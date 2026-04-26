"""Passport builder — P3 of the pipeline.

Takes the LLM's normalized extractions and resolves each one against the
ESCO API. Builds and returns a SkillsPassport.

Unresolved skills (no ESCO match) are kept on the passport with a low
confidence score and a null URI so that no user data is silently dropped.
Future work can extend this to additional taxonomies without changing the
passport schema.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from . import consts
from .esco_client import search
from .models import (
    CountryPack,
    NormalizedSkillExtraction,
    SkillClaim,
    SkillsPassport,
)


def build_passport(
    extractions: list[NormalizedSkillExtraction],
    country_pack: CountryPack,
) -> SkillsPassport:
    """Resolve extractions against ESCO and assemble the passport."""
    skill_claims = [
        _resolve(extraction, country_pack) for extraction in extractions
    ]
    return SkillsPassport(
        id=f"{consts.PASSPORT_ID_PREFIX}{uuid.uuid4()}",
        schema_version=consts.PASSPORT_SCHEMA_VERSION,
        issued_at=datetime.now(timezone.utc),
        country_code=country_pack.country_code,
        locale=country_pack.locale,
        skill_claims=skill_claims,
    )


def _resolve(
    extraction: NormalizedSkillExtraction,
    country_pack: CountryPack,
) -> SkillClaim:
    results = search(
        term=extraction.esco_search_term,
        language=country_pack.esco_language,
    )

    if results:
        best = results[0]
        return SkillClaim(
            local_label=extraction.local_label,
            normalized_label=extraction.normalized_label,
            confidence=extraction.confidence,
            is_resolved=True,
            skill_type=extraction.skill_type,
            esco_uri=best.uri,
            esco_preferred_label=best.preferred_label,
            isco_code=best.isco_code,
        )

    return SkillClaim(
        local_label=extraction.local_label,
        normalized_label=extraction.normalized_label,
        confidence=consts.CONFIDENCE_UNRESOLVED,
        is_resolved=False,
        skill_type=extraction.skill_type,
    )
