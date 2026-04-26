# UNMAPPED — Skills Passport Protocol (Module 01)

Converts informal experience and structured profile inputs into a portable
**JSON-LD skills passport** grounded in the [ESCO taxonomy](https://esco.ec.europa.eu)
and ISCO-08 occupation codes.

This is the protocol layer. It has no UI. Downstream systems (matching engines,
dashboards, employer portals) consume the passport JSON-LD without writing
custom parsers.

---

## Pipeline

```
P1 Capture    ProfileInput (free text + optional structured fields)
     ↓
P2 Infer      OpenAI structured-JSON call → NormalizationResult
     ↓
P3 Mint       ESCO API lookup per skill → SkillsPassport (JSON-LD)
```

Unresolved skills (no ESCO match) are retained on the passport with
`passport:isResolved: false` and a low confidence score so no user data
is silently dropped.

---

## Quickstart

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

export OPENAI_API_KEY=sk-...
uvicorn skills_passport.main:app --reload
```

API is available at `http://localhost:8000`. Interactive docs at `/docs`.

---

## API

### `POST /passport/generate`

Generate a skills passport from a profile.

**Request body**

| Field              | Type          | Required | Description                                  |
|--------------------|---------------|----------|----------------------------------------------|
| `raw_text`         | string        | Yes      | Free-text profile description                |
| `country_code`     | string        | Yes      | ISO-3 country code (`GHA`, `KEN`)            |
| `locale`           | string        | No       | BCP-47 locale tag, default `en`              |
| `education_level`  | string        | No       | Highest credential attained                  |
| `languages`        | string[]      | No       | Languages spoken                             |
| `years_experience` | number        | No       | Total years of work experience               |

**Example request**

```json
{
  "raw_text": "I've been fixing phones since I was 17. I also teach basic coding.",
  "country_code": "GHA",
  "locale": "en",
  "education_level": "secondary school",
  "languages": ["English", "Twi"],
  "years_experience": 5
}
```

**Example response** (JSON-LD)

```json
{
  "@context": {
    "esco": "http://data.europa.eu/esco/",
    "schema": "https://schema.org/",
    "passport": "https://unmapped.io/passport/",
    "skos": "http://www.w3.org/2004/02/skos/core#"
  },
  "@type": "passport:SkillsPassport",
  "@id": "urn:unmapped:passport:3fa85f64-...",
  "passport:schemaVersion": "1.0.0",
  "passport:issuedAt": "2026-04-25T22:00:00+00:00",
  "passport:country": "GHA",
  "passport:locale": "en",
  "passport:skillClaims": [
    {
      "@type": "esco:Skill",
      "@id": "http://data.europa.eu/esco/skill/abc123",
      "passport:localLabel": "fixing phones since I was 17",
      "skos:prefLabel": "mobile phone repair technician",
      "passport:confidence": 0.92,
      "passport:isResolved": true,
      "passport:skillType": "occupation",
      "esco:iscoCode": "7421"
    }
  ]
}
```

### `GET /passport/health`

Returns `{"status": "ok"}`.

---

## Country Packs

Built-in packs ship for **Ghana** (`GHA`) and **Kenya** (`KEN`).

To add a new context without changing code, write a JSON file and point to it:

```json
{
  "country_code": "NGA",
  "country_name": "Nigeria",
  "esco_language": "en",
  "locale": "en",
  "ilostat_country_code": "NGA"
}
```

Load it at startup via `load_pack_from_file("packs/nga.json")`.

**Configurable per deployment (no code changes):**

| Concern                     | Mechanism                              |
|-----------------------------|----------------------------------------|
| ESCO query language         | `esco_language` in country pack        |
| UI locale / text direction  | `locale` in country pack               |
| ILOSTAT data scope          | `ilostat_country_code` in country pack |
| Number of ESCO results      | `ESCO_SEARCH_RESULTS_LIMIT` in consts  |

---

## Tests

```bash
pytest tests/ -v
```

All tests are unit tests with mocked OpenAI and ESCO calls — no network
or API key required.

---

## Constants

All numeric and boolean configuration lives in `skills_passport/consts.py`.
No raw numbers appear elsewhere in the package.

---

## Project layout

```
backend/
  skills_passport/
    consts.py           # all numeric/boolean constants
    models.py           # Pydantic models + JSON-LD serialization
    country_pack.py     # country pack registry and loader
    esco_client.py      # ESCO /search wrapper
    normalizer.py       # OpenAI structured-JSON extraction (P2)
    passport_builder.py # assembles passport from extractions (P3)
    router.py           # FastAPI routes
    main.py             # app entry point
  tests/
    conftest.py
    test_country_pack.py
    test_esco_client.py
    test_normalizer.py
    test_passport_builder.py
    test_router.py
  docs/
    architecture.md
    postman_collection.json
  requirements.txt
  README.md
```
