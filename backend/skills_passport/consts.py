"""All numeric, boolean, and stable identifier constants for the protocol.

No raw numeric or boolean literals should appear elsewhere in the package.
String constants live here when they are configuration-like (URIs, model
names, language codes). Truly one-off strings stay inline at their use site.
"""

# ESCO API
ESCO_API_BASE_URL: str = "https://ec.europa.eu/esco/api"
ESCO_API_TIMEOUT_SECONDS: float = 10.0
ESCO_SEARCH_RESULTS_LIMIT: int = 5
ESCO_DEFAULT_LANGUAGE: str = "en"
ESCO_SEARCH_TYPE_SKILL: str = "skill"
ESCO_SEARCH_TYPE_OCCUPATION: str = "occupation"

# OpenAI
OPENAI_MODEL: str = "gpt-4o-2024-08-06"
OPENAI_TEMPERATURE: float = 0.0

# Passport identifiers
PASSPORT_SCHEMA_VERSION: str = "1.0.0"
PASSPORT_ID_PREFIX: str = "urn:unmapped:passport:"

# JSON-LD context URIs
JSONLD_CONTEXT_ESCO: str = "http://data.europa.eu/esco/"
JSONLD_CONTEXT_SCHEMA: str = "https://schema.org/"
JSONLD_CONTEXT_PASSPORT: str = "https://unmapped.io/passport/"
JSONLD_CONTEXT_SKOS: str = "http://www.w3.org/2004/02/skos/core#"

# JSON-LD type names (under the passport: prefix)
JSONLD_TYPE_PASSPORT: str = "passport:SkillsPassport"
JSONLD_TYPE_SKILL: str = "esco:Skill"
JSONLD_TYPE_OCCUPATION: str = "esco:Occupation"
JSONLD_TYPE_KNOWLEDGE: str = "esco:Knowledge"

# Confidence thresholds
CONFIDENCE_MIN: float = 0.0
CONFIDENCE_MAX: float = 1.0
CONFIDENCE_UNRESOLVED: float = 0.1

# Skill types (used in extraction output and to drive @type selection)
SKILL_TYPE_SKILL: str = "skill"
SKILL_TYPE_OCCUPATION: str = "occupation"
SKILL_TYPE_KNOWLEDGE: str = "knowledge"
SKILL_TYPES_VALID: tuple[str, ...] = (
    SKILL_TYPE_SKILL,
    SKILL_TYPE_OCCUPATION,
    SKILL_TYPE_KNOWLEDGE,
)

# HTTP status semantics used at the API boundary
HTTP_STATUS_BAD_REQUEST: int = 400
HTTP_STATUS_INTERNAL_ERROR: int = 500
