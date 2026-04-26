"""Load kpi_summary.json and top_movers.json into memory.

Loaded once on first access (lazy singleton). Thread-safe. KEN is filtered
out at the loader boundary — only GHA / IND / BGD are exposed.
"""

from __future__ import annotations

import json
import os
import threading
from pathlib import Path
from typing import Optional

from . import consts

_SUPPORTED: frozenset[str] = frozenset({"GHA", "IND", "BGD"})

_lock = threading.Lock()
_kpi_summary: Optional[list[dict]] = None
_top_movers: Optional[dict[str, dict]] = None


def _kpi_path() -> Path:
    env = os.environ.get("KPI_SUMMARY_JSON_PATH")
    return Path(env) if env else consts.KPI_SUMMARY_JSON_PATH_DEFAULT


def _top_movers_path() -> Path:
    env = os.environ.get("TOP_MOVERS_JSON_PATH")
    return Path(env) if env else consts.TOP_MOVERS_JSON_PATH_DEFAULT


def _load() -> None:
    global _kpi_summary, _top_movers

    with open(_kpi_path(), encoding="utf-8") as f:
        raw_kpi: list[dict] = json.load(f)
    _kpi_summary = [r for r in raw_kpi if r.get("country_iso3", "").upper() in _SUPPORTED]

    with open(_top_movers_path(), encoding="utf-8") as f:
        raw_movers: dict[str, dict] = json.load(f)
    _top_movers = {k.upper(): v for k, v in raw_movers.items() if k.upper() in _SUPPORTED}


def _ensure_loaded() -> None:
    if _kpi_summary is None:
        with _lock:
            if _kpi_summary is None:
                _load()


def get_kpi_summary() -> list[dict]:
    _ensure_loaded()
    return _kpi_summary  # type: ignore[return-value]


def get_top_movers(iso3: str) -> Optional[dict]:
    _ensure_loaded()
    return _top_movers.get(iso3.upper())  # type: ignore[union-attr]


def reset_for_testing() -> None:
    """Reset module state; only for use in tests."""
    global _kpi_summary, _top_movers
    _kpi_summary = None
    _top_movers = None
