"""P4 + P5: semantic occupation matching with ILO signal annotation.

Given a JSON-LD passport and a country code, returns ranked MatchResult
objects with ISCO-4 fit scores and ILOSTAT economic signals.
"""

from __future__ import annotations

import os

from openai import OpenAI

from . import consts
from .dashboard_loader import get_by_country_isco, get_unique_isco
from .embedder import embed
from .indexer import search
from .models import EarningsSignal, EmploymentSignal, MatchResult, SignalBlock

_SOURCE = "ILOSTAT via dashboard_simple_isco4"


def match(
    passport: dict,
    country_code: str,
    top_n: int = consts.MATCH_TOP_N_DEFAULT,
    openai_client: OpenAI | None = None,
) -> list[MatchResult]:
    """Run P4+P5: embed passport skills, search index, annotate with signals."""
    if openai_client is None:
        openai_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    labels = _extract_labels(passport)
    if not labels:
        raise ValueError("no resolvable skills in passport")

    query_vec = embed(["; ".join(labels)], openai_client)
    hits = search(query_vec, top_n)

    unique = get_unique_isco()
    results: list[MatchResult] = []
    for rank, (isco4, similarity) in enumerate(hits, start=1):
        row = unique.get(isco4, {})
        country_row = get_by_country_isco(country_code, isco4)
        results.append(
            MatchResult(
                rank=rank,
                isco_4_code=isco4,
                isco_4_label=row.get("isco_4_label", isco4),
                fit_score=min(100, max(0, round(similarity * 100))),
                avg_green_share=_float(row.get("avg_green_share")),
                avg_share_digital=_float(row.get("avg_share_digital")),
                skill_gaps=_derive_gaps(labels, row.get("top_essential_skills", "")),
                signals=_build_signals(country_row),
            )
        )
    return results


def _extract_labels(passport: dict) -> list[str]:
    claims = passport.get("passport:skillClaims", [])
    return [
        c["skos:prefLabel"]
        for c in claims
        if c.get("passport:isResolved") and c.get("skos:prefLabel")
    ]


def _build_signals(row: dict | None) -> SignalBlock:
    if row is None:
        return SignalBlock()

    employment: EmploymentSignal | None = None
    try:
        emp_pct = row["employment_pct_change"]
        if emp_pct not in (None, ""):
            employment = EmploymentSignal(
                value=float(emp_pct) * 100,
                year_first=int(float(row["employment_year_first"])),
                year_last=int(float(row["employment_year_last"])),
                employment_last_thousands=float(row["employment_thousands_last"]),
                source=_SOURCE,
            )
    except (KeyError, ValueError, TypeError):
        pass

    earnings: EarningsSignal | None = None
    try:
        earn_val = row["earnings_value_last"]
        if earn_val not in (None, "") and float(earn_val) > 0:
            earn_pct = row.get("earnings_pct_change") or 0
            earnings = EarningsSignal(
                value=float(earn_val),
                pct_change=float(earn_pct) * 100,
                year_last=int(float(row["earnings_year_last"])),
                source=_SOURCE,
            )
    except (KeyError, ValueError, TypeError):
        pass

    return SignalBlock(employment_growth=employment, earnings_level=earnings)


def _derive_gaps(labels: list[str], skills_csv: str) -> list[str]:
    if not skills_csv:
        return []
    labels_lower = {l.lower() for l in labels}
    gaps: list[str] = []
    for skill in skills_csv.split(";"):
        skill = skill.strip()
        if not skill:
            continue
        skill_lower = skill.lower()
        if not any(skill_lower in ll or ll in skill_lower for ll in labels_lower):
            gaps.append(skill)
        if len(gaps) >= consts.MATCH_SKILL_GAPS_LIMIT:
            break
    return gaps


def _float(val: object) -> float:
    try:
        return float(val)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return 0.0
