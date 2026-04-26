"""Tests for matcher — embed(), search(), and dashboard_loader are mocked."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import numpy as np
import pytest

from skills_passport import consts
from skills_passport.matcher import _derive_gaps, _extract_labels, match


_RESOLVED_CLAIM = {
    "@type": "esco:Skill",
    "passport:localLabel": "fixing phones",
    "skos:prefLabel": "mobile phone repair",
    "passport:confidence": 0.91,
    "passport:isResolved": True,
    "passport:skillType": "skill",
}

_UNRESOLVED_CLAIM = {
    "@type": "esco:Skill",
    "passport:localLabel": "fixes Samsungs fast",
    "skos:prefLabel": "fixes Samsungs fast",
    "passport:confidence": 0.30,
    "passport:isResolved": False,
    "passport:skillType": "skill",
}

_PASSPORT = {
    "@type": "passport:SkillsPassport",
    "@id": "urn:unmapped:passport:test-001",
    "passport:skillClaims": [_RESOLVED_CLAIM, _UNRESOLVED_CLAIM],
}

_PASSPORT_NO_RESOLVED = {
    "@type": "passport:SkillsPassport",
    "@id": "urn:unmapped:passport:test-002",
    "passport:skillClaims": [_UNRESOLVED_CLAIM],
}

_SIGNAL_ROW = {
    "isco_4_label": "Electronics mechanics and servicers",
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
    "avg_green_share": "0.12",
    "avg_share_digital": "0.31",
}


@pytest.fixture
def mock_client():
    return MagicMock()


@pytest.fixture
def patched_search():
    fake_vec = np.ones((1, consts.EMBED_DIMS), dtype=np.float32)
    with (
        patch("skills_passport.matcher.embed", return_value=fake_vec),
        patch(
            "skills_passport.matcher.search",
            return_value=[("7422", 0.87), ("7421", 0.72)],
        ),
        patch(
            "skills_passport.matcher.get_unique_isco",
            return_value={"7422": _SIGNAL_ROW, "7421": {**_SIGNAL_ROW, "isco_4_label": "Other"}},
        ),
        patch(
            "skills_passport.matcher.get_by_country_isco",
            return_value=_SIGNAL_ROW,
        ),
    ):
        yield


def test_extract_labels_returns_resolved_only():
    labels = _extract_labels(_PASSPORT)
    assert labels == ["mobile phone repair"]


def test_extract_labels_empty_on_no_resolved():
    assert _extract_labels(_PASSPORT_NO_RESOLVED) == []


def test_match_returns_correct_count(patched_search, mock_client):
    results = match(_PASSPORT, "GHA", top_n=2, openai_client=mock_client)
    assert len(results) == 2


def test_match_ranks_sequential(patched_search, mock_client):
    results = match(_PASSPORT, "GHA", top_n=2, openai_client=mock_client)
    assert [r.rank for r in results] == [1, 2]


def test_match_fit_score_in_range(patched_search, mock_client):
    results = match(_PASSPORT, "GHA", top_n=2, openai_client=mock_client)
    for r in results:
        assert 0 <= r.fit_score <= 100


def test_match_top_result_has_signals(patched_search, mock_client):
    results = match(_PASSPORT, "GHA", top_n=1, openai_client=mock_client)
    sig = results[0].signals
    assert sig.employment_growth is not None
    assert sig.earnings_level is not None


def test_match_signal_values_multiplied(patched_search, mock_client):
    results = match(_PASSPORT, "GHA", top_n=1, openai_client=mock_client)
    emp = results[0].signals.employment_growth
    assert abs(emp.value - 8.4) < 0.01  # 0.084 * 100


def test_match_null_signal_when_no_country_row(mock_client):
    fake_vec = np.ones((1, consts.EMBED_DIMS), dtype=np.float32)
    with (
        patch("skills_passport.matcher.embed", return_value=fake_vec),
        patch("skills_passport.matcher.search", return_value=[("7422", 0.80)]),
        patch("skills_passport.matcher.get_unique_isco", return_value={"7422": _SIGNAL_ROW}),
        patch("skills_passport.matcher.get_by_country_isco", return_value=None),
    ):
        results = match(_PASSPORT, "ZZZ", top_n=1, openai_client=mock_client)
        assert results[0].signals.employment_growth is None
        assert results[0].signals.earnings_level is None


def test_match_raises_on_empty_claims(patched_search, mock_client):
    with pytest.raises(ValueError, match="no resolvable skills"):
        match(_PASSPORT_NO_RESOLVED, "GHA", openai_client=mock_client)


def test_derive_gaps_filters_matched_skills():
    labels = ["mobile phone repair"]
    gaps = _derive_gaps(labels, "mobile phone repair; soldering; circuit testing")
    assert "mobile phone repair" not in gaps
    assert "soldering" in gaps


def test_derive_gaps_respects_limit():
    labels = []
    skills = "; ".join(f"skill_{i}" for i in range(20))
    gaps = _derive_gaps(labels, skills)
    assert len(gaps) == consts.MATCH_SKILL_GAPS_LIMIT


def test_derive_gaps_empty_skills_csv():
    assert _derive_gaps(["some skill"], "") == []
