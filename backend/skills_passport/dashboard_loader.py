"""Load dashboard_simple_isco4.csv into two in-memory indexes.

Loaded once on first access (lazy singleton). Thread-safe: the lock ensures
only one thread builds the indexes; all others wait.
"""

from __future__ import annotations

import csv
import os
import threading
from pathlib import Path
from typing import Optional

from . import consts

_lock = threading.Lock()
_by_country_isco: Optional[dict[tuple[str, str], dict]] = None
_unique_isco: Optional[dict[str, dict]] = None
_country_anchor_rows: Optional[dict[str, list[dict]]] = None


def _csv_path() -> Path:
    env = os.environ.get("DASHBOARD_CSV_PATH")
    return Path(env) if env else consts.DASHBOARD_CSV_PATH_DEFAULT


def _load() -> None:
    global _by_country_isco, _unique_isco, _country_anchor_rows
    by_country_isco: dict[tuple[str, str], dict] = {}
    unique_isco: dict[str, dict] = {}
    country_anchor_rows: dict[str, list[dict]] = {}

    with open(_csv_path(), newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            country = row["country_iso3"].strip().upper()
            isco4 = row["isco_4_code"].strip()
            by_country_isco[(country, isco4)] = row
            if isco4 not in unique_isco:
                unique_isco[isco4] = row
            if row.get("is_isco2_anchor", "").strip().upper() in ("TRUE", "1", "YES"):
                country_anchor_rows.setdefault(country, []).append(row)

    _by_country_isco = by_country_isco
    _unique_isco = unique_isco
    _country_anchor_rows = country_anchor_rows


def _ensure_loaded() -> None:
    if _by_country_isco is None:
        with _lock:
            if _by_country_isco is None:
                _load()


def get_by_country_isco(country: str, isco4: str) -> Optional[dict]:
    _ensure_loaded()
    return _by_country_isco.get((country.upper(), isco4))


def get_unique_isco() -> dict[str, dict]:
    _ensure_loaded()
    return _unique_isco  # type: ignore[return-value]


def get_anchor_rows(country: str) -> list[dict]:
    _ensure_loaded()
    return _country_anchor_rows.get(country.upper(), [])  # type: ignore[union-attr]


def get_known_countries() -> set[str]:
    _ensure_loaded()
    return {k[0] for k in _by_country_isco}  # type: ignore[union-attr]


def reset_for_testing() -> None:
    """Reset module state; only for use in tests."""
    global _by_country_isco, _unique_isco, _country_anchor_rows
    _by_country_isco = None
    _unique_isco = None
    _country_anchor_rows = None
