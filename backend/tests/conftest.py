"""Shared fixtures for the skills-passport test suite."""

from __future__ import annotations

import pytest

from skills_passport.models import (
    CountryPack,
    ESCOMatch,
    NormalizedSkillExtraction,
    ProfileInput,
)
from skills_passport import consts


@pytest.fixture
def ghana_pack() -> CountryPack:
    return CountryPack(
        country_code="GHA",
        country_name="Ghana",
        esco_language="en",
        locale="en",
        ilostat_country_code="GHA",
    )


@pytest.fixture
def sample_profile() -> ProfileInput:
    return ProfileInput(
        raw_text="I fix phones and have been running a repair shop since I was 17.",
        country_code="GHA",
        locale="en",
        education_level="secondary school",
        languages=["English", "Twi"],
        years_experience=5.0,
    )


@pytest.fixture
def sample_extraction() -> NormalizedSkillExtraction:
    return NormalizedSkillExtraction(
        local_label="I fix phones",
        normalized_label="mobile phone repair",
        esco_search_term="mobile phone repair",
        confidence=0.9,
        skill_type=consts.SKILL_TYPE_SKILL,
    )


@pytest.fixture
def sample_esco_match() -> ESCOMatch:
    return ESCOMatch(
        uri="http://data.europa.eu/esco/skill/abc123",
        preferred_label="mobile phone repair technician",
        isco_code="7421",
    )
