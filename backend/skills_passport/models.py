"""Pydantic models for the skills-passport protocol.

The hierarchy mirrors the pipeline: ProfileInput (P1) → NormalizationResult
(P2) → SkillsPassport (P3). The passport is the canonical, portable artifact
serialized as JSON-LD via SkillsPassport.to_jsonld().
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from . import consts


class ProfileInput(BaseModel):
    """P1 input: free-text plus light structure.

    `raw_text` is the primary surface. Structured fields (education_level,
    languages, years_experience) are concatenated into the LLM prompt so
    the normalizer sees them as additional context. We deliberately do
    not parse them separately — the LLM handles the messy data.
    """

    raw_text: str = Field(..., min_length=1)
    country_code: str = Field(..., min_length=2, max_length=3)
    locale: str = consts.ESCO_DEFAULT_LANGUAGE
    education_level: Optional[str] = None
    languages: Optional[list[str]] = None
    years_experience: Optional[float] = None


class CountryPack(BaseModel):
    """Per-country configuration. Drives ESCO query language and downstream
    matching context. The passport is country-agnostic — this only shapes
    inputs to ESCO and which country code is recorded on the passport.
    """

    country_code: str
    country_name: str
    esco_language: str = consts.ESCO_DEFAULT_LANGUAGE
    locale: str = consts.ESCO_DEFAULT_LANGUAGE
    ilostat_country_code: str


class NormalizedSkillExtraction(BaseModel):
    """One skill claim extracted by the LLM, before ESCO resolution."""

    local_label: str
    normalized_label: str
    esco_search_term: str
    confidence: float = Field(
        ge=consts.CONFIDENCE_MIN, le=consts.CONFIDENCE_MAX
    )
    skill_type: str

    @field_validator("skill_type")
    @classmethod
    def _validate_skill_type(cls, value: str) -> str:
        if value not in consts.SKILL_TYPES_VALID:
            raise ValueError(
                f"skill_type must be one of {consts.SKILL_TYPES_VALID}"
            )
        return value


class NormalizationResult(BaseModel):
    """Top-level container for the LLM response. Used as `response_format`
    with OpenAI's structured-output parse() call."""

    skill_extractions: list[NormalizedSkillExtraction]


class ESCOMatch(BaseModel):
    """A single ranked result from the ESCO /search endpoint."""

    uri: str
    preferred_label: str
    isco_code: Optional[str] = None


class SkillClaim(BaseModel):
    """A skill on the issued passport. Resolved claims carry an ESCO URI;
    unresolved claims keep `local_label` so the user's data is never lost."""

    local_label: str
    normalized_label: str
    confidence: float
    is_resolved: bool
    skill_type: str
    esco_uri: Optional[str] = None
    esco_preferred_label: Optional[str] = None
    isco_code: Optional[str] = None


class SkillsPassport(BaseModel):
    """The portable artifact. Serialize via to_jsonld() before sending
    over the wire — JSON-LD is the canonical wire format."""

    id: str
    schema_version: str
    issued_at: datetime
    country_code: str
    locale: str
    skill_claims: list[SkillClaim]

    def to_jsonld(self) -> dict:
        return {
            "@context": _jsonld_context(),
            "@type": consts.JSONLD_TYPE_PASSPORT,
            "@id": self.id,
            "passport:schemaVersion": self.schema_version,
            "passport:issuedAt": self.issued_at.isoformat(),
            "passport:country": self.country_code,
            "passport:locale": self.locale,
            "passport:skillClaims": [
                _skill_claim_to_jsonld(claim) for claim in self.skill_claims
            ],
        }


def _jsonld_context() -> dict:
    return {
        "esco": consts.JSONLD_CONTEXT_ESCO,
        "schema": consts.JSONLD_CONTEXT_SCHEMA,
        "passport": consts.JSONLD_CONTEXT_PASSPORT,
        "skos": consts.JSONLD_CONTEXT_SKOS,
    }


def _skill_claim_to_jsonld(claim: SkillClaim) -> dict:
    node: dict = {
        "@type": _jsonld_type_for(claim.skill_type),
        "passport:localLabel": claim.local_label,
        "skos:prefLabel": (
            claim.esco_preferred_label or claim.normalized_label
        ),
        "passport:confidence": claim.confidence,
        "passport:isResolved": claim.is_resolved,
        "passport:skillType": claim.skill_type,
    }
    if claim.esco_uri is not None:
        node["@id"] = claim.esco_uri
    if claim.isco_code is not None:
        node["esco:iscoCode"] = claim.isco_code
    return node


class EmploymentSignal(BaseModel):
    value: float                       # employment_pct_change * 100
    year_first: int
    year_last: int
    employment_last_thousands: float
    source: str


class EarningsSignal(BaseModel):
    value: float                       # earnings_value_last
    pct_change: float                  # earnings_pct_change * 100
    year_last: int
    source: str


class SignalBlock(BaseModel):
    employment_growth: Optional[EmploymentSignal] = None
    earnings_level: Optional[EarningsSignal] = None


class MatchResult(BaseModel):
    rank: int
    isco_4_code: str
    isco_4_label: str
    fit_score: int
    avg_green_share: float
    avg_share_digital: float
    skill_gaps: list[str]
    signals: SignalBlock


class MatchRequest(BaseModel):
    passport: dict
    country_code: str
    top_n: int = 5


class MarketSectorRow(BaseModel):
    isco_2_code: str
    isco_2_label: str
    employment_thousands_last: float
    employment_pct_change: float
    earnings_value_last: Optional[float] = None
    avg_green_share: float


class MarketResponse(BaseModel):
    country_code: str
    country_name: str
    employment_year_last: int
    earnings_year_last: int
    total_employment_thousands: float
    sector_employment: list[MarketSectorRow]


class CountryKPI(BaseModel):
    country_iso3: str
    country_label: str
    total_workers_k: float
    workers_delta_pct: float
    workers_year_first: int
    workers_year_last: int
    avg_earnings: float
    earnings_currency: str
    earnings_delta_pct: float
    earnings_year_first: int
    earnings_year_last: int
    avg_green_share_pct: float


class TopMoverEntry(BaseModel):
    rank: int
    isco_1_code: str
    isco_1_label: str
    pct_change: float
    year_first: int
    year_last: int
    workers_thousands: Optional[float] = None


class TopEarnerEntry(TopMoverEntry):
    earnings_value_last: float
    earnings_currency: str


class CountryTopMovers(BaseModel):
    country_iso3: str
    country_label: str
    top_employment_growth_majors: list[TopMoverEntry]
    top_earnings_growth_majors: list[TopEarnerEntry]


def _jsonld_type_for(skill_type: str) -> str:
    if skill_type == consts.SKILL_TYPE_OCCUPATION:
        return consts.JSONLD_TYPE_OCCUPATION
    if skill_type == consts.SKILL_TYPE_KNOWLEDGE:
        return consts.JSONLD_TYPE_KNOWLEDGE
    return consts.JSONLD_TYPE_SKILL
