"""LLM normalizer — P2 of the pipeline.

One OpenAI call in structured-JSON mode converts free-text profile input
into a list of NormalizedSkillExtraction objects. The model normalises
idiomatic or informal language (e.g. "I fix people's Samsungs") into
terms clean enough for the ESCO keyword search to match reliably.

The model also outputs a confidence score per extraction. Low confidence
is expected for vague claims; the passport builder preserves them
rather than dropping them.
"""

from __future__ import annotations

from openai import OpenAI

from . import consts
from .models import NormalizationResult, ProfileInput

_SYSTEM_PROMPT = """\
You are a skills extraction engine for informal workers in low-income countries.

Given a profile description, extract every skill, competency, occupation, and
knowledge area the person demonstrates or mentions. For each item:

1. Preserve the original phrasing as `local_label`.
2. Normalise it to formal English as `normalized_label` — concise, professional.
3. Suggest the best `esco_search_term` for searching the ESCO taxonomy — typically
   the normalized label or a slight simplification (e.g. "mobile phone repair").
4. Assign a `confidence` (0.0–1.0) reflecting how clearly the skill was stated.
   Assign low confidence to vague mentions; do not omit them.
5. Classify as `skill_type`: one of "skill", "occupation", or "knowledge".

Extract everything — err on the side of inclusion. The caller handles filtering.
"""


def extract_skills(
    profile: ProfileInput,
    client: OpenAI,
) -> NormalizationResult:
    """Run the normalisation call and return structured skill extractions."""
    user_content = _build_user_content(profile)

    response = client.beta.chat.completions.parse(
        model=consts.OPENAI_MODEL,
        temperature=consts.OPENAI_TEMPERATURE,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        response_format=NormalizationResult,
    )

    return response.choices[0].message.parsed


def _build_user_content(profile: ProfileInput) -> str:
    parts = [profile.raw_text]

    if profile.education_level:
        parts.append(f"Education level: {profile.education_level}")
    if profile.languages:
        parts.append(f"Languages spoken: {', '.join(profile.languages)}")
    if profile.years_experience is not None:
        parts.append(f"Years of experience: {profile.years_experience}")
    if profile.country_code:
        parts.append(f"Country context: {profile.country_code}")

    return "\n".join(parts)
