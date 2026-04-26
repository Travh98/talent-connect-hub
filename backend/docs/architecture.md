# Skills Passport Protocol — Architecture

## Pipeline overview

```
┌─────────────────────────────────────────────────────────────┐
│  POST /passport/generate                                    │
│                                                             │
│  ProfileInput                                               │
│  ├── raw_text (free text)                                   │
│  ├── country_code                                           │
│  └── optional: education_level, languages, years_experience │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
          ┌─────────────────────────┐
          │  P1 Capture             │
          │  Assemble user content  │
          │  for LLM prompt         │
          └────────────┬────────────┘
                       │
                       ▼
          ┌─────────────────────────┐
          │  P2 Infer               │
          │  OpenAI structured JSON │
          │  One call, JSON schema  │
          │  mode enforced          │
          │                         │
          │  Per skill extracted:   │
          │  • local_label          │
          │  • normalized_label     │
          │  • esco_search_term     │
          │  • confidence (0–1)     │
          │  • skill_type           │
          └────────────┬────────────┘
                       │
                       ▼ (one ESCO call per extraction)
          ┌─────────────────────────┐
          │  P3 Mint                │
          │  ESCO /search per skill │
          │  Take rank-1 result     │
          │                         │
          │  Resolved → ESCO URI    │
          │  Unresolved → null URI, │
          │  confidence = 0.1,      │
          │  local_label preserved  │
          └────────────┬────────────┘
                       │
                       ▼
          ┌─────────────────────────┐
          │  SkillsPassport         │
          │  JSON-LD output         │
          └─────────────────────────┘
```

## Data sources

| Source       | Role                          | Access     |
|--------------|-------------------------------|------------|
| OpenAI       | Free-text normalization (P2)  | Live API   |
| ESCO API     | Canonical skill/occupation URIs (P3) | Live API |
| Country pack | Language + country context    | Local JSON |

## Country-agnostic design

The protocol records country context but does not hardcode it:

- `CountryPack.esco_language` drives the ESCO query language
- `CountryPack.ilostat_country_code` is passed downstream for Module 03
- New countries require only a JSON config file — no code changes

## Unresolved skills

ESCO is EU-anchored. Informal LMIC occupations (e.g. mobile money agent,
okada rider) may not match. The protocol handles this by:

1. Retaining `local_label` verbatim from the user's input
2. Setting `passport:isResolved: false`
3. Assigning `passport:confidence: 0.1` (CONFIDENCE_UNRESOLVED)
4. Omitting `@id` from the JSON-LD node

This keeps user data intact and makes the gap legible to both humans and
downstream systems. Future datasets can be added in the builder without
changing the passport schema.

## JSON-LD structure

The passport uses four namespace prefixes:

| Prefix    | URI                                      | Purpose              |
|-----------|------------------------------------------|----------------------|
| `esco:`   | http://data.europa.eu/esco/              | ESCO type names      |
| `schema:` | https://schema.org/                      | Generic schema terms |
| `passport:` | https://unmapped.io/passport/          | Protocol-specific    |
| `skos:`   | http://www.w3.org/2004/02/skos/core#     | Preferred labels     |

ESCO URIs appear as `@id` values on resolved skill nodes — making the
passport natively compatible with linked-data consumers.
