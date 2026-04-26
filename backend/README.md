# UNMAPPED — Skills Passport Protocol (Modules 01 + 03)

Converts informal experience into a portable **JSON-LD skills passport** grounded
in the [ESCO taxonomy](https://esco.ec.europa.eu) and ISCO-08 occupation codes,
then matches it against a pre-built ILOSTAT labour market dataset.

---

## Pipeline

```
P1 Capture    ProfileInput (free text + optional structured fields)
     ↓
P2 Infer      OpenAI structured-JSON call → NormalizationResult
     ↓
P3 Mint       ESCO API lookup per skill → SkillsPassport (JSON-LD)
     ↓
P4 Match      OpenAI embedding → cosine search over 426 ISCO-4 occupations
     ↓
P5 Annotate   Join with ILOSTAT employment + earnings signals (dashboard CSV)
     ↓
P6 Swap       Re-run P4+P5 with a different country code, same passport
```

Unresolved skills (no ESCO match) are retained on the passport with
`passport:isResolved: false` so no user data is silently dropped.

---

## Quickstart

```bash
cd backend

python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env — set OPENAI_API_KEY
```

The `dashboard_simple_isco4.csv` file is expected at `../data/dashboard_simple_isco4.csv`
relative to the backend directory (i.e. `talent-connect-hub/data/`). Override with
`DASHBOARD_CSV_PATH=/absolute/path/to/file.csv` in `.env` if needed.

```bash
uvicorn skills_passport.main:app --reload
```

API at `http://localhost:8000`. Docs at `/docs`.

**First call to `POST /match`** takes ~5 s to build and cache the embedding index
(`backend/cache/embeddings_text-embedding-3-small.npy`). Every subsequent call is instant.
Delete the cache file to force a rebuild.

---

## Environment

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | Yes | — | Used for P2 (extraction) and P4 (embedding) |
| `DASHBOARD_CSV_PATH` | No | `../data/dashboard_simple_isco4.csv` | Path to pre-built ILOSTAT CSV |

---

## API

### `POST /passport/generate`

Run the full P1→P3 pipeline. Returns a JSON-LD `SkillsPassport`.

**Request**

| Field | Type | Required | Description |
|---|---|---|---|
| `raw_text` | string | Yes | Free-text profile description |
| `country_code` | string | Yes | ISO-3 code: `GHA`, `IND`, or `BGD` |
| `locale` | string | No | BCP-47 locale, default `en` |
| `education_level` | string | No | Highest credential attained |
| `languages` | string[] | No | Languages spoken |
| `years_experience` | number | No | Total years of work experience |

**Example**

```bash
curl -X POST http://localhost:8000/passport/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "raw_text": "I have been repairing phones in Accra for 3 years and speak English and Twi",
    "country_code": "GHA",
    "locale": "en"
  }'
```

---

### `POST /match`

P4+P5: embed passport skill claims, search the occupation index, annotate with
ILOSTAT employment growth and earnings signals.

**Request**

```json
{
  "passport": { /* full JSON-LD passport from /passport/generate */ },
  "country_code": "GHA",
  "top_n": 5
}
```

**Response**

```json
{
  "country_code": "GHA",
  "matches": [
    {
      "rank": 1,
      "isco_4_code": "7422",
      "isco_4_label": "Electronics mechanics and servicers",
      "fit_score": 87,
      "avg_green_share": 0.12,
      "avg_share_digital": 0.31,
      "skill_gaps": ["soldering", "circuit testing", "fault diagnosis"],
      "signals": {
        "employment_growth": {
          "value": 8.4,
          "year_first": 2013,
          "year_last": 2017,
          "employment_last_thousands": 142.3,
          "source": "ILOSTAT via dashboard_simple_isco4"
        },
        "earnings_level": {
          "value": 312.0,
          "pct_change": 14.2,
          "year_last": 2017,
          "source": "ILOSTAT via dashboard_simple_isco4"
        }
      }
    }
  ]
}
```

`signals` fields are `null` when ILOSTAT coverage is missing for a country × ISCO-4 combination.

Returns `400` when the passport contains no resolved skill claims.

---

### `GET /market/{country_code}`

Aggregate ILOSTAT employment and earnings data by ISCO-2 sector for a country.
Anchor-filtered to avoid double-counting.

```bash
curl http://localhost:8000/market/GHA
curl http://localhost:8000/market/IND
curl http://localhost:8000/market/BGD
```

Returns `404` for unknown country codes.

---

### `GET /passport/health`

Returns `{"status": "ok"}`.

---

## Country Packs

Built-in packs: **Ghana** (`GHA`), **India** (`IND`), **Bangladesh** (`BGD`).

To add a new context without changing code, write a JSON file and load it:

```json
{
  "country_code": "NGA",
  "country_name": "Nigeria",
  "esco_language": "en",
  "locale": "en",
  "ilostat_country_code": "NGA"
}
```

```python
from skills_passport.country_pack import load_pack_from_file
pack = load_pack_from_file("packs/nga.json")
```

Note: signal data from `POST /match` and `GET /market` is sourced from the CSV.
A country pack alone is not enough to get signals — the CSV must contain rows for that `country_iso3`.

---

## Tests

```bash
# From backend/
.venv/bin/pytest tests/ -v
```

All tests are unit tests — mocked OpenAI, ESCO, and file I/O. No network or API key required.

---

## Project layout

```
backend/
  skills_passport/
    consts.py             # all numeric/boolean constants + file paths
    models.py             # Pydantic models + JSON-LD serialization
    country_pack.py       # country pack registry (GHA, IND, BGD)
    esco_client.py        # ESCO /search wrapper (P3)
    normalizer.py         # OpenAI structured-JSON extraction (P2)
    passport_builder.py   # assembles passport from extractions (P3)
    dashboard_loader.py   # loads dashboard CSV into memory (P5)
    embedder.py           # OpenAI text-embedding-3-small batch wrapper (P4)
    indexer.py            # lazy-built cosine similarity index + disk cache (P4)
    matcher.py            # P4+P5: embed → search → annotate with signals
    router.py             # FastAPI routes
    main.py               # app entry point + CORS
  tests/
    conftest.py
    test_country_pack.py
    test_dashboard_loader.py
    test_embedder.py
    test_esco_client.py
    test_indexer.py
    test_matcher.py
    test_normalizer.py
    test_passport_builder.py
    test_router.py
  cache/                  # auto-created; holds embedding .npy file
  .env.example
  requirements.txt
  README.md

data/
  dashboard_simple_isco4.csv   # 1,704 rows · GHA/IND/BGD · ISCO-4 grain
```
