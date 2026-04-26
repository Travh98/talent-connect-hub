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
HTTP_STATUS_NOT_FOUND: int = 404
HTTP_STATUS_INTERNAL_ERROR: int = 500

# Embedding
from pathlib import Path  # noqa: E402 — intentional late import to keep top clean

EMBED_MODEL: str = "text-embedding-3-small"
EMBED_DIMS: int = 1536
EMBED_BATCH_SIZE: int = 100

_PACKAGE_DIR = Path(__file__).parent
_BACKEND_DIR = _PACKAGE_DIR.parent
_REPO_DIR = _BACKEND_DIR.parent

EMBED_CACHE_PATH: Path = _BACKEND_DIR / "cache" / f"embeddings_{EMBED_MODEL}.npy"
DASHBOARD_CSV_PATH_DEFAULT: Path = _REPO_DIR / "data" / "dashboard_simple_isco4.csv"
KPI_SUMMARY_JSON_PATH_DEFAULT: Path = _REPO_DIR / "data" / "kpi_summary.json"
TOP_MOVERS_JSON_PATH_DEFAULT: Path = _REPO_DIR / "data" / "top_movers.json"

# Matching
MATCH_TOP_N_DEFAULT: int = 5
MATCH_SKILL_GAPS_LIMIT: int = 3

# Ed25519 signing
ED25519_PRIVATE_KEY_PATH_DEFAULT: Path = _REPO_DIR / "keys" / "passport_signing_key.pem"
ED25519_PUBLIC_KEY_PATH_DEFAULT: Path = _REPO_DIR / "keys" / "passport_verifying_key.pem"
JSONLD_TYPE_PROOF: str = "Ed25519Signature2020"
PASSPORT_VERIFICATION_METHOD_DEFAULT: str = "did:web:candidateconnect.local#key-1"
