"""Tests for passport_builder module.

ESCO search is mocked — no live network calls.
"""

from __future__ import annotations

from unittest.mock import patch

import pytest

from skills_passport import consts
from skills_passport.models import ESCOMatch, NormalizedSkillExtraction
from skills_passport.passport_builder import build_passport


def _extraction(**kwargs) -> NormalizedSkillExtraction:
    defaults = dict(
        local_label="I fix phones",
        normalized_label="mobile phone repair",
        esco_search_term="mobile phone repair",
        confidence=0.9,
        skill_type=consts.SKILL_TYPE_SKILL,
    )
    defaults.update(kwargs)
    return NormalizedSkillExtraction(**defaults)


def _esco_match(**kwargs) -> ESCOMatch:
    defaults = dict(
        uri="http://data.europa.eu/esco/skill/abc123",
        preferred_label="mobile phone repair technician",
        isco_code="7421",
    )
    defaults.update(kwargs)
    return ESCOMatch(**defaults)


@patch("skills_passport.passport_builder.search")
def test_resolved_claim_carries_esco_uri(mock_search, ghana_pack):
    mock_search.return_value = [_esco_match()]
    passport = build_passport([_extraction()], ghana_pack)

    claim = passport.skill_claims[0]
    assert claim.is_resolved is True
    assert claim.esco_uri == "http://data.europa.eu/esco/skill/abc123"


@patch("skills_passport.passport_builder.search")
def test_resolved_claim_preserves_local_label(mock_search, ghana_pack):
    mock_search.return_value = [_esco_match()]
    passport = build_passport([_extraction(local_label="fixing Samsungs")], ghana_pack)

    assert passport.skill_claims[0].local_label == "fixing Samsungs"


@patch("skills_passport.passport_builder.search")
def test_unresolved_claim_has_low_confidence(mock_search, ghana_pack):
    mock_search.return_value = []
    passport = build_passport([_extraction()], ghana_pack)

    claim = passport.skill_claims[0]
    assert claim.is_resolved is False
    assert claim.confidence == consts.CONFIDENCE_UNRESOLVED


@patch("skills_passport.passport_builder.search")
def test_unresolved_claim_has_null_esco_uri(mock_search, ghana_pack):
    mock_search.return_value = []
    passport = build_passport([_extraction()], ghana_pack)

    assert passport.skill_claims[0].esco_uri is None


@patch("skills_passport.passport_builder.search")
def test_unresolved_claim_preserves_local_label(mock_search, ghana_pack):
    mock_search.return_value = []
    passport = build_passport(
        [_extraction(local_label="make nice pots")], ghana_pack
    )

    assert passport.skill_claims[0].local_label == "make nice pots"


@patch("skills_passport.passport_builder.search")
def test_passport_schema_version(mock_search, ghana_pack):
    mock_search.return_value = []
    passport = build_passport([_extraction()], ghana_pack)

    assert passport.schema_version == consts.PASSPORT_SCHEMA_VERSION


@patch("skills_passport.passport_builder.search")
def test_passport_id_prefix(mock_search, ghana_pack):
    mock_search.return_value = []
    passport = build_passport([_extraction()], ghana_pack)

    assert passport.id.startswith(consts.PASSPORT_ID_PREFIX)


@patch("skills_passport.passport_builder.search")
def test_passport_country_code(mock_search, ghana_pack):
    mock_search.return_value = []
    passport = build_passport([_extraction()], ghana_pack)

    assert passport.country_code == "GHA"


@patch("skills_passport.passport_builder.search")
def test_mixed_resolved_and_unresolved(mock_search, ghana_pack):
    mock_search.side_effect = [
        [_esco_match()],
        [],
    ]
    extractions = [_extraction(), _extraction(local_label="some vague skill")]
    passport = build_passport(extractions, ghana_pack)

    assert passport.skill_claims[0].is_resolved is True
    assert passport.skill_claims[1].is_resolved is False


@patch("skills_passport.passport_builder.search")
def test_to_jsonld_type(mock_search, ghana_pack):
    mock_search.return_value = [_esco_match()]
    passport = build_passport([_extraction()], ghana_pack)
    jsonld = passport.to_jsonld()

    assert jsonld["@type"] == consts.JSONLD_TYPE_PASSPORT


@patch("skills_passport.passport_builder.search")
def test_to_jsonld_skill_claims_present(mock_search, ghana_pack):
    mock_search.return_value = [_esco_match()]
    passport = build_passport([_extraction()], ghana_pack)
    jsonld = passport.to_jsonld()

    assert len(jsonld["passport:skillClaims"]) == 1


@patch("skills_passport.passport_builder.search")
def test_to_jsonld_resolved_claim_has_id(mock_search, ghana_pack):
    mock_search.return_value = [_esco_match()]
    passport = build_passport([_extraction()], ghana_pack)
    jsonld = passport.to_jsonld()
    claim_node = jsonld["passport:skillClaims"][0]

    assert "@id" in claim_node
    assert claim_node["@id"] == "http://data.europa.eu/esco/skill/abc123"


@patch("skills_passport.passport_builder.search")
def test_to_jsonld_unresolved_claim_has_no_id(mock_search, ghana_pack):
    mock_search.return_value = []
    passport = build_passport([_extraction()], ghana_pack)
    jsonld = passport.to_jsonld()
    claim_node = jsonld["passport:skillClaims"][0]

    assert "@id" not in claim_node


@patch("skills_passport.passport_builder.search")
def test_to_jsonld_occupation_type(mock_search, ghana_pack):
    mock_search.return_value = [_esco_match()]
    passport = build_passport(
        [_extraction(skill_type=consts.SKILL_TYPE_OCCUPATION)], ghana_pack
    )
    jsonld = passport.to_jsonld()
    claim_node = jsonld["passport:skillClaims"][0]

    assert claim_node["@type"] == consts.JSONLD_TYPE_OCCUPATION
