"""Country pack registry and loader.

A country pack is a small JSON config that tells the protocol which
language to query ESCO in, which ILOSTAT country code to use downstream,
and what to record on the passport. Built-in packs ship for the demo
contexts (Ghana, Kenya); operators can also load packs from disk for
new deployments without code changes.
"""

from __future__ import annotations

import json
from pathlib import Path

from .models import CountryPack

GHANA_PACK = CountryPack(
    country_code="GHA",
    country_name="Ghana",
    esco_language="en",
    locale="en",
    ilostat_country_code="GHA",
)

INDIA_PACK = CountryPack(
    country_code="IND",
    country_name="India",
    esco_language="en",
    locale="en",
    ilostat_country_code="IND",
)

BANGLADESH_PACK = CountryPack(
    country_code="BGD",
    country_name="Bangladesh",
    esco_language="en",
    locale="en",
    ilostat_country_code="BGD",
)

BUILTIN_PACKS: dict[str, CountryPack] = {
    GHANA_PACK.country_code: GHANA_PACK,
    INDIA_PACK.country_code: INDIA_PACK,
    BANGLADESH_PACK.country_code: BANGLADESH_PACK,
}


def load_pack(country_code: str) -> CountryPack:
    """Look up a built-in country pack by ISO-3 country code (case-insensitive)."""
    code = country_code.upper()
    if code not in BUILTIN_PACKS:
        raise ValueError(
            f"No built-in country pack for '{country_code}'. "
            f"Known codes: {sorted(BUILTIN_PACKS)}"
        )
    return BUILTIN_PACKS[code]


def load_pack_from_file(path: str | Path) -> CountryPack:
    """Load a country pack from a JSON file on disk."""
    with open(path, "r", encoding="utf-8") as handle:
        data = json.load(handle)
    return CountryPack(**data)
