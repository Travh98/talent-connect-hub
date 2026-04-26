"""FastAPI router for the skills-passport protocol.

Exposes two routes:
  POST /passport/generate  — runs the full P1→P3 pipeline
  GET  /passport/health    — liveness check

The OpenAI client is injected via FastAPI's dependency system so tests can
swap it without patching module-level state.
"""

from __future__ import annotations

import os

from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI

from . import consts, signer
from .country_pack import load_pack
from .dashboard_loader import get_anchor_rows, get_known_countries
from .kpi_loader import get_kpi_summary, get_top_movers
from .matcher import match
from .models import (
    CountryKPI,
    CountryTopMovers,
    MarketResponse,
    MarketSectorRow,
    MatchRequest,
    ProfileInput,
    TopEarnerEntry,
    TopMoverEntry,
)
from .normalizer import extract_skills
from .passport_builder import build_passport

router = APIRouter(prefix="/passport", tags=["passport"])
match_router = APIRouter(tags=["match"])


def _get_openai_client() -> OpenAI:
    return OpenAI(api_key=os.environ["OPENAI_API_KEY"])


@router.post("/generate")
def generate_passport(
    profile: ProfileInput,
    openai_client: OpenAI = Depends(_get_openai_client),
) -> dict:
    """Run the full pipeline and return a JSON-LD skills passport."""
    try:
        country_pack = load_pack(profile.country_code)
    except ValueError as exc:
        raise HTTPException(
            status_code=consts.HTTP_STATUS_BAD_REQUEST, detail=str(exc)
        ) from exc

    normalization = extract_skills(profile, openai_client)
    passport = build_passport(normalization.skill_extractions, country_pack)
    return signer.sign_passport(passport.to_jsonld())


@router.post("/verify")
def verify_passport_route(body: dict) -> dict:
    """Verify the Ed25519 proof on a signed passport. Returns {valid: bool}."""
    passport = body.get("passport")
    if not isinstance(passport, dict):
        raise HTTPException(
            status_code=consts.HTTP_STATUS_BAD_REQUEST,
            detail="Request body must be {\"passport\": <passport object>}",
        )
    valid = signer.verify_passport(passport)
    return {"valid": valid, "verification_method": signer.get_verification_method()}


@router.get("/public-key")
def get_public_key() -> dict:
    """Return the Ed25519 public key PEM and verification method identifier."""
    return {
        "public_key_pem": signer.get_public_key_pem(),
        "verification_method": signer.get_verification_method(),
        "algorithm": "Ed25519",
    }


@router.get("/health")
def health() -> dict:
    return {"status": "ok"}


@match_router.post("/match")
def run_match(
    request: MatchRequest,
    openai_client: OpenAI = Depends(_get_openai_client),
) -> dict:
    """P4+P5: embed passport, search occupation index, annotate with signals."""
    try:
        results = match(
            request.passport,
            request.country_code,
            request.top_n,
            openai_client,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=consts.HTTP_STATUS_BAD_REQUEST, detail=str(exc)
        ) from exc
    return {"country_code": request.country_code, "matches": [r.model_dump() for r in results]}


@match_router.get("/market/kpi-summary")
def get_kpi_summary_route() -> list[CountryKPI]:
    """Per-country KPI summary (workforce size, earnings, green share)."""
    return [CountryKPI(**row) for row in get_kpi_summary()]


@match_router.get("/market/{country_code}")
def get_market(country_code: str) -> MarketResponse:
    """Aggregate ILOSTAT employment/earnings data for a country."""
    code = country_code.upper()
    if code not in get_known_countries():
        raise HTTPException(
            status_code=consts.HTTP_STATUS_NOT_FOUND,
            detail=f"No data for country '{country_code}'",
        )

    anchor_rows = get_anchor_rows(code)
    if not anchor_rows:
        raise HTTPException(
            status_code=consts.HTTP_STATUS_NOT_FOUND,
            detail=f"No anchor data for country '{country_code}'",
        )

    # Deduplicate by isco_2_code — anchor rows are one per isco_4 but we want sectors
    seen: set[str] = set()
    sectors: list[MarketSectorRow] = []
    total_employment = 0.0
    emp_year_last = 0
    earn_year_last = 0

    for row in anchor_rows:
        isco2 = row["isco_2_code"]
        if isco2 in seen:
            continue
        seen.add(isco2)

        emp_last = _safe_float(row.get("employment_thousands_last"))
        total_employment += emp_last or 0.0

        ey = _safe_int(row.get("employment_year_last"))
        if ey and ey > emp_year_last:
            emp_year_last = ey
        ry = _safe_int(row.get("earnings_year_last"))
        if ry and ry > earn_year_last:
            earn_year_last = ry

        sectors.append(
            MarketSectorRow(
                isco_2_code=isco2,
                isco_2_label=row.get("isco_2_label", isco2),
                employment_thousands_last=emp_last or 0.0,
                employment_pct_change=(_safe_float(row.get("employment_pct_change")) or 0.0) * 100,
                earnings_value_last=_safe_float(row.get("earnings_value_last")),
                avg_green_share=_safe_float(row.get("avg_green_share")) or 0.0,
            )
        )

    country_name = anchor_rows[0].get("country_label", code)
    return MarketResponse(
        country_code=code,
        country_name=country_name,
        employment_year_last=emp_year_last,
        earnings_year_last=earn_year_last,
        total_employment_thousands=round(total_employment, 1),
        sector_employment=sectors,
    )


@match_router.get("/market/{country_code}/top-movers")
def get_top_movers_route(country_code: str) -> CountryTopMovers:
    """Top-5 ISCO-1 employment-growth and earnings-growth movers for a country."""
    data = get_top_movers(country_code.upper())
    if data is None:
        raise HTTPException(
            status_code=consts.HTTP_STATUS_NOT_FOUND,
            detail=f"No top-movers data for country '{country_code}'",
        )
    return CountryTopMovers(
        country_iso3=data["country_iso3"],
        country_label=data["country_label"],
        top_employment_growth_majors=[
            TopMoverEntry(**e) for e in data["top_employment_growth_majors"]
        ],
        top_earnings_growth_majors=[
            TopEarnerEntry(**e) for e in data["top_earnings_growth_majors"]
        ],
    )


def _safe_float(val: object) -> float | None:
    try:
        return float(val)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None


def _safe_int(val: object) -> int | None:
    try:
        return int(float(val))  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
