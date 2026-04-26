"""Tests for the FastAPI router — contract only, no live OpenAI or ESCO calls.

FastAPI dependencies must be overridden via app.dependency_overrides, not
@patch, because Depends() stores the original function reference at import
time and @patch only updates the module-level name.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from skills_passport import consts
from skills_passport.main import app
from skills_passport.models import (
    NormalizationResult,
    SkillClaim,
    SkillsPassport,
)
from skills_passport.router import _get_openai_client


def _make_passport() -> SkillsPassport:
    return SkillsPassport(
        id=f"{consts.PASSPORT_ID_PREFIX}{uuid.uuid4()}",
        schema_version=consts.PASSPORT_SCHEMA_VERSION,
        issued_at=datetime.now(timezone.utc),
        country_code="GHA",
        locale="en",
        skill_claims=[
            SkillClaim(
                local_label="I fix phones",
                normalized_label="mobile phone repair",
                confidence=0.9,
                is_resolved=True,
                skill_type=consts.SKILL_TYPE_SKILL,
                esco_uri="http://data.europa.eu/esco/skill/abc123",
                esco_preferred_label="mobile phone repair technician",
                isco_code="7421",
            )
        ],
    )


VALID_PAYLOAD = {
    "raw_text": "I have been repairing phones for 5 years.",
    "country_code": "GHA",
    "locale": "en",
}


@pytest.fixture
def client():
    """TestClient with the OpenAI dependency overridden."""
    app.dependency_overrides[_get_openai_client] = lambda: MagicMock()
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_health_returns_ok(client):
    response = client.get("/passport/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@patch("skills_passport.router.build_passport")
@patch("skills_passport.router.extract_skills")
def test_generate_returns_jsonld(mock_extract, mock_build, client):
    mock_extract.return_value = NormalizationResult(skill_extractions=[])
    mock_build.return_value = _make_passport()

    response = client.post("/passport/generate", json=VALID_PAYLOAD)

    assert response.status_code == 200
    body = response.json()
    assert body["@type"] == consts.JSONLD_TYPE_PASSPORT
    assert "@context" in body


@patch("skills_passport.router.build_passport")
@patch("skills_passport.router.extract_skills")
def test_generate_passport_id_present(mock_extract, mock_build, client):
    mock_extract.return_value = NormalizationResult(skill_extractions=[])
    mock_build.return_value = _make_passport()

    response = client.post("/passport/generate", json=VALID_PAYLOAD)

    assert response.json()["@id"].startswith(consts.PASSPORT_ID_PREFIX)


@patch("skills_passport.router.build_passport")
@patch("skills_passport.router.extract_skills")
def test_generate_passport_country_matches_input(mock_extract, mock_build, client):
    mock_extract.return_value = NormalizationResult(skill_extractions=[])
    mock_build.return_value = _make_passport()

    response = client.post("/passport/generate", json=VALID_PAYLOAD)

    assert response.json()["passport:country"] == "GHA"


def test_generate_unknown_country_returns_400(client):
    payload = {**VALID_PAYLOAD, "country_code": "ZZZ"}
    response = client.post("/passport/generate", json=payload)

    assert response.status_code == consts.HTTP_STATUS_BAD_REQUEST


def test_generate_missing_raw_text_returns_422(client):
    response = client.post(
        "/passport/generate", json={"country_code": "GHA"}
    )
    assert response.status_code == 422


def test_generate_empty_raw_text_returns_422(client):
    response = client.post(
        "/passport/generate",
        json={"raw_text": "", "country_code": "GHA"},
    )
    assert response.status_code == 422


@patch("skills_passport.router.build_passport")
@patch("skills_passport.router.extract_skills")
def test_generate_calls_extract_once(mock_extract, mock_build, client):
    mock_extract.return_value = NormalizationResult(skill_extractions=[])
    mock_build.return_value = _make_passport()

    client.post("/passport/generate", json=VALID_PAYLOAD)

    assert mock_extract.call_count == 1


@patch("skills_passport.router.build_passport")
@patch("skills_passport.router.extract_skills")
def test_generate_calls_build_once(mock_extract, mock_build, client):
    mock_extract.return_value = NormalizationResult(skill_extractions=[])
    mock_build.return_value = _make_passport()

    client.post("/passport/generate", json=VALID_PAYLOAD)

    assert mock_build.call_count == 1


# ── /market/kpi-summary ─────────────────────────────────────────────────────

_KPI_ROW = {
    "country_iso3": "GHA", "country_label": "Ghana",
    "total_workers_k": 9448.0, "workers_delta_pct": -18.4,
    "workers_year_first": 2013, "workers_year_last": 2017,
    "avg_earnings": 2491.0, "earnings_currency": "GHS",
    "earnings_delta_pct": 458.5, "earnings_year_first": 2013, "earnings_year_last": 2024,
    "avg_green_share_pct": 4.5,
}


@patch("skills_passport.router.get_kpi_summary", return_value=[_KPI_ROW])
def test_kpi_summary_returns_list(mock_kpi, client):
    response = client.get("/market/kpi-summary")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert body[0]["country_iso3"] == "GHA"


@patch("skills_passport.router.get_kpi_summary", return_value=[_KPI_ROW])
def test_kpi_summary_shape(mock_kpi, client):
    body = client.get("/market/kpi-summary").json()
    assert "total_workers_k" in body[0]
    assert "avg_earnings" in body[0]


# ── /market/{country_code}/top-movers ───────────────────────────────────────

_TOP_MOVERS_DATA = {
    "country_iso3": "GHA",
    "country_label": "Ghana",
    "top_employment_growth_majors": [
        {"rank": 1, "isco_1_code": "7", "isco_1_label": "Craft workers",
         "pct_change": 37.7, "year_first": 2013, "year_last": 2017, "workers_thousands": 500},
    ],
    "top_earnings_growth_majors": [
        {"rank": 1, "isco_1_code": "5", "isco_1_label": "Service workers",
         "pct_change": 356.8, "year_first": 2013, "year_last": 2024,
         "workers_thousands": None, "earnings_value_last": 2032.0, "earnings_currency": "GHS"},
    ],
}


@patch("skills_passport.router.get_top_movers", return_value=_TOP_MOVERS_DATA)
def test_top_movers_returns_shape(mock_movers, client):
    response = client.get("/market/GHA/top-movers")
    assert response.status_code == 200
    body = response.json()
    assert body["country_iso3"] == "GHA"
    assert len(body["top_employment_growth_majors"]) == 1
    assert len(body["top_earnings_growth_majors"]) == 1


@patch("skills_passport.router.get_top_movers", return_value=None)
def test_top_movers_unknown_country_returns_404(mock_movers, client):
    response = client.get("/market/ZZZ/top-movers")
    assert response.status_code == consts.HTTP_STATUS_NOT_FOUND
