"""Tests for the LLM normalizer.

All tests mock the OpenAI client — no live API calls.
"""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from skills_passport import consts
from skills_passport.models import (
    NormalizationResult,
    NormalizedSkillExtraction,
    ProfileInput,
)
from skills_passport.normalizer import extract_skills, _build_user_content


def _make_mock_client(result: NormalizationResult) -> MagicMock:
    parsed_message = MagicMock()
    parsed_message.parsed = result

    choice = MagicMock()
    choice.message = parsed_message

    completion = MagicMock()
    completion.choices = [choice]

    client = MagicMock()
    client.beta.chat.completions.parse.return_value = completion
    return client


def _make_extraction(**kwargs) -> NormalizedSkillExtraction:
    defaults = dict(
        local_label="I fix phones",
        normalized_label="mobile phone repair",
        esco_search_term="mobile phone repair",
        confidence=0.9,
        skill_type=consts.SKILL_TYPE_SKILL,
    )
    defaults.update(kwargs)
    return NormalizedSkillExtraction(**defaults)


def test_extract_skills_returns_normalization_result(sample_profile):
    expected = NormalizationResult(skill_extractions=[_make_extraction()])
    client = _make_mock_client(expected)

    result = extract_skills(sample_profile, client)

    assert isinstance(result, NormalizationResult)
    assert len(result.skill_extractions) == 1


def test_extract_skills_calls_parse_once(sample_profile):
    expected = NormalizationResult(skill_extractions=[])
    client = _make_mock_client(expected)

    extract_skills(sample_profile, client)

    assert client.beta.chat.completions.parse.call_count == 1


def test_extract_skills_uses_configured_model(sample_profile):
    expected = NormalizationResult(skill_extractions=[])
    client = _make_mock_client(expected)

    extract_skills(sample_profile, client)

    call_kwargs = client.beta.chat.completions.parse.call_args[1]
    assert call_kwargs["model"] == consts.OPENAI_MODEL


def test_extract_skills_uses_zero_temperature(sample_profile):
    expected = NormalizationResult(skill_extractions=[])
    client = _make_mock_client(expected)

    extract_skills(sample_profile, client)

    call_kwargs = client.beta.chat.completions.parse.call_args[1]
    assert call_kwargs["temperature"] == consts.OPENAI_TEMPERATURE


def test_extract_skills_multiple_extractions(sample_profile):
    extractions = [
        _make_extraction(local_label="fix phones", normalized_label="phone repair"),
        _make_extraction(
            local_label="runs shop",
            normalized_label="small business management",
            skill_type=consts.SKILL_TYPE_KNOWLEDGE,
            confidence=0.7,
        ),
    ]
    expected = NormalizationResult(skill_extractions=extractions)
    client = _make_mock_client(expected)

    result = extract_skills(sample_profile, client)

    assert len(result.skill_extractions) == 2


def test_build_user_content_includes_raw_text(sample_profile):
    content = _build_user_content(sample_profile)
    assert sample_profile.raw_text in content


def test_build_user_content_includes_education_level(sample_profile):
    content = _build_user_content(sample_profile)
    assert "secondary school" in content


def test_build_user_content_includes_languages(sample_profile):
    content = _build_user_content(sample_profile)
    assert "Twi" in content


def test_build_user_content_includes_years_experience(sample_profile):
    content = _build_user_content(sample_profile)
    assert "5.0" in content


def test_build_user_content_minimal_profile():
    profile = ProfileInput(raw_text="I weld metal.", country_code="KEN")
    content = _build_user_content(profile)
    assert "I weld metal." in content
