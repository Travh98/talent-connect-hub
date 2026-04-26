"""Tests for dashboard_loader — pure CSV parsing, no OpenAI/ESCO calls."""

from __future__ import annotations

import csv
import os
import tempfile
from pathlib import Path

import pytest

import skills_passport.dashboard_loader as loader


FIXTURE_ROWS = [
    {
        "country_iso3": "GHA",
        "country_label": "Ghana",
        "isco_2_code": "74",
        "isco_2_label": "Electrical and electronic trades workers",
        "isco_3_code": "742",
        "isco_3_label": "Electronics and telecommunications installers",
        "isco_4_code": "7422",
        "isco_4_label": "Electronics mechanics and servicers",
        "n_occupations": "4",
        "avg_green_share": "0.12",
        "avg_share_digital": "0.31",
        "avg_share_transversal": "0.1",
        "top_essential_skills": "mobile phone repair; soldering; circuit testing",
        "employment_year_first": "2013",
        "employment_thousands_first": "100.0",
        "employment_year_last": "2017",
        "employment_thousands_last": "142.3",
        "employment_pct_change": "0.084",
        "earnings_year_first": "2013",
        "earnings_value_first": "280.0",
        "earnings_year_last": "2017",
        "earnings_value_last": "312.0",
        "earnings_pct_change": "0.142",
        "is_isco2_anchor": "TRUE",
    },
    {
        "country_iso3": "GHA",
        "country_label": "Ghana",
        "isco_2_code": "74",
        "isco_2_label": "Electrical and electronic trades workers",
        "isco_3_code": "742",
        "isco_3_label": "Electronics and telecommunications installers",
        "isco_4_code": "7421",
        "isco_4_label": "Electrical mechanics and fitters",
        "n_occupations": "3",
        "avg_green_share": "0.10",
        "avg_share_digital": "0.25",
        "avg_share_transversal": "0.1",
        "top_essential_skills": "electrical wiring; fault diagnosis; safety procedures",
        "employment_year_first": "2013",
        "employment_thousands_first": "80.0",
        "employment_year_last": "2017",
        "employment_thousands_last": "90.0",
        "employment_pct_change": "0.125",
        "earnings_year_first": "2013",
        "earnings_value_first": "250.0",
        "earnings_year_last": "2017",
        "earnings_value_last": "290.0",
        "earnings_pct_change": "0.16",
        "is_isco2_anchor": "FALSE",
    },
    {
        "country_iso3": "IND",
        "country_label": "India",
        "isco_2_code": "74",
        "isco_2_label": "Electrical and electronic trades workers",
        "isco_3_code": "742",
        "isco_3_label": "Electronics and telecommunications installers",
        "isco_4_code": "7422",
        "isco_4_label": "Electronics mechanics and servicers",
        "n_occupations": "4",
        "avg_green_share": "0.11",
        "avg_share_digital": "0.28",
        "avg_share_transversal": "0.09",
        "top_essential_skills": "mobile phone repair; soldering; circuit testing",
        "employment_year_first": "2010",
        "employment_thousands_first": "500.0",
        "employment_year_last": "2024",
        "employment_thousands_last": "620.0",
        "employment_pct_change": "0.24",
        "earnings_year_first": "2010",
        "earnings_value_first": "200.0",
        "earnings_year_last": "2024",
        "earnings_value_last": "350.0",
        "earnings_pct_change": "0.75",
        "is_isco2_anchor": "TRUE",
    },
]

FIELDNAMES = list(FIXTURE_ROWS[0].keys())


@pytest.fixture(autouse=True)
def reset_loader():
    loader.reset_for_testing()
    yield
    loader.reset_for_testing()


@pytest.fixture
def fixture_csv(tmp_path: Path) -> Path:
    path = tmp_path / "dashboard.csv"
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(FIXTURE_ROWS)
    return path


def test_by_country_isco_lookup(fixture_csv, monkeypatch):
    monkeypatch.setenv("DASHBOARD_CSV_PATH", str(fixture_csv))
    row = loader.get_by_country_isco("GHA", "7422")
    assert row is not None
    assert row["isco_4_label"] == "Electronics mechanics and servicers"


def test_by_country_isco_different_country(fixture_csv, monkeypatch):
    monkeypatch.setenv("DASHBOARD_CSV_PATH", str(fixture_csv))
    ind_row = loader.get_by_country_isco("IND", "7422")
    gha_row = loader.get_by_country_isco("GHA", "7422")
    assert ind_row is not None and gha_row is not None
    assert ind_row["employment_thousands_last"] != gha_row["employment_thousands_last"]


def test_by_country_isco_missing_returns_none(fixture_csv, monkeypatch):
    monkeypatch.setenv("DASHBOARD_CSV_PATH", str(fixture_csv))
    assert loader.get_by_country_isco("ZZZ", "7422") is None


def test_unique_isco_deduplicates_across_countries(fixture_csv, monkeypatch):
    monkeypatch.setenv("DASHBOARD_CSV_PATH", str(fixture_csv))
    unique = loader.get_unique_isco()
    # 7422 appears in both GHA and IND — should be stored once
    assert "7422" in unique
    assert "7421" in unique
    assert len(unique) == 2


def test_anchor_filter_excludes_false_rows(fixture_csv, monkeypatch):
    monkeypatch.setenv("DASHBOARD_CSV_PATH", str(fixture_csv))
    anchors = loader.get_anchor_rows("GHA")
    isco4_codes = [r["isco_4_code"] for r in anchors]
    assert "7422" in isco4_codes
    assert "7421" not in isco4_codes


def test_anchor_rows_india(fixture_csv, monkeypatch):
    monkeypatch.setenv("DASHBOARD_CSV_PATH", str(fixture_csv))
    anchors = loader.get_anchor_rows("IND")
    assert len(anchors) == 1
    assert anchors[0]["isco_4_code"] == "7422"


def test_get_known_countries(fixture_csv, monkeypatch):
    monkeypatch.setenv("DASHBOARD_CSV_PATH", str(fixture_csv))
    countries = loader.get_known_countries()
    assert {"GHA", "IND"} == countries


def test_case_insensitive_country_lookup(fixture_csv, monkeypatch):
    monkeypatch.setenv("DASHBOARD_CSV_PATH", str(fixture_csv))
    assert loader.get_by_country_isco("gha", "7422") is not None
