"""Tests for kpi_loader — fixture JSON files only, no real data files."""

from __future__ import annotations

import json

import pytest

from skills_passport import kpi_loader

KPI_ROWS = [
    {
        "country_iso3": "GHA", "country_label": "Ghana",
        "total_workers_k": 9448.0, "workers_delta_pct": -18.4,
        "workers_year_first": 2013, "workers_year_last": 2017,
        "avg_earnings": 2491.0, "earnings_currency": "GHS",
        "earnings_delta_pct": 458.5, "earnings_year_first": 2013, "earnings_year_last": 2024,
        "avg_green_share_pct": 4.5,
    },
    {
        "country_iso3": "IND", "country_label": "India",
        "total_workers_k": 468374.0, "workers_delta_pct": 22.8,
        "workers_year_first": 2018, "workers_year_last": 2024,
        "avg_earnings": 15927.0, "earnings_currency": "INR",
        "earnings_delta_pct": -3.8, "earnings_year_first": 2022, "earnings_year_last": 2024,
        "avg_green_share_pct": 4.5,
    },
    {
        "country_iso3": "KEN", "country_label": "Kenya",
        "total_workers_k": 14456.0, "workers_delta_pct": -31.6,
        "workers_year_first": 2019, "workers_year_last": 2022,
        "avg_earnings": 11676.0, "earnings_currency": "KES",
        "earnings_delta_pct": -20.5, "earnings_year_first": 2019, "earnings_year_last": 2019,
        "avg_green_share_pct": 4.5,
    },
]

TOP_MOVERS = {
    "GHA": {
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
    },
    "KEN": {
        "country_iso3": "KEN",
        "country_label": "Kenya",
        "top_employment_growth_majors": [],
        "top_earnings_growth_majors": [],
    },
}


@pytest.fixture(autouse=True)
def _reset(tmp_path, monkeypatch):
    kpi_path = tmp_path / "kpi.json"
    kpi_path.write_text(json.dumps(KPI_ROWS))
    movers_path = tmp_path / "movers.json"
    movers_path.write_text(json.dumps(TOP_MOVERS))

    monkeypatch.setenv("KPI_SUMMARY_JSON_PATH", str(kpi_path))
    monkeypatch.setenv("TOP_MOVERS_JSON_PATH", str(movers_path))
    kpi_loader.reset_for_testing()
    yield
    kpi_loader.reset_for_testing()


def test_kpi_summary_filters_ken():
    summary = kpi_loader.get_kpi_summary()
    codes = {r["country_iso3"] for r in summary}
    assert "KEN" not in codes
    assert codes == {"GHA", "IND"}


def test_kpi_summary_gha_present():
    summary = kpi_loader.get_kpi_summary()
    gha = next(r for r in summary if r["country_iso3"] == "GHA")
    assert gha["avg_earnings"] == pytest.approx(2491.0)


def test_top_movers_gha():
    data = kpi_loader.get_top_movers("GHA")
    assert data is not None
    assert data["country_label"] == "Ghana"
    assert len(data["top_employment_growth_majors"]) == 1


def test_top_movers_ken_filtered():
    data = kpi_loader.get_top_movers("KEN")
    assert data is None


def test_top_movers_unknown_returns_none():
    data = kpi_loader.get_top_movers("ZZZ")
    assert data is None


def test_case_insensitive_lookup():
    assert kpi_loader.get_top_movers("gha") is not None


def test_reset_clears_state():
    kpi_loader.get_kpi_summary()  # trigger load
    kpi_loader.reset_for_testing()
    # pylint: disable=protected-access
    assert kpi_loader._kpi_summary is None
    assert kpi_loader._top_movers is None
