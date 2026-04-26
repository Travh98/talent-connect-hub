"""Lazy-built occupation embedding index for cosine-similarity matching.

First call to search() builds the 426-vector matrix and writes it to disk.
Subsequent calls (and restarts with a warm cache) are instant.
"""

from __future__ import annotations

import threading
from typing import Optional

import numpy as np

from . import consts
from .dashboard_loader import get_unique_isco
from .embedder import embed

_lock = threading.Lock()
_vectors: Optional[np.ndarray] = None  # L2-normalised, shape (n, EMBED_DIMS)
_codes: Optional[list[str]] = None     # isco4 codes, row-aligned with _vectors


def _normalize(matrix: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    return (matrix / norms).astype(np.float32)


def _build() -> None:
    global _vectors, _codes
    isco_rows = get_unique_isco()
    codes = list(isco_rows.keys())
    cache = consts.EMBED_CACHE_PATH

    if cache.exists():
        try:
            matrix = np.load(str(cache)).astype(np.float32)
            if matrix.shape == (len(codes), consts.EMBED_DIMS):
                _vectors = _normalize(matrix)
                _codes = codes
                return
        except Exception:
            pass  # corrupt or wrong-shape cache — rebuild

    texts = [
        f"{row['isco_4_label']}. Essential skills: {row['top_essential_skills']}"
        for row in isco_rows.values()
    ]
    matrix = embed(texts)
    cache.parent.mkdir(parents=True, exist_ok=True)
    np.save(str(cache), matrix)
    _vectors = _normalize(matrix)
    _codes = codes


def _ensure_built() -> None:
    if _vectors is None:
        with _lock:
            if _vectors is None:
                _build()


def search(query_vec: np.ndarray, top_n: int) -> list[tuple[str, float]]:
    """Return top_n (isco4_code, cosine_similarity) pairs, sorted descending."""
    _ensure_built()
    q = query_vec.astype(np.float32).flatten()
    norm = np.linalg.norm(q)
    if norm > 0:
        q = q / norm
    scores = _vectors @ q  # type: ignore[operator]
    idx = np.argsort(-scores)[:top_n]
    return [(_codes[i], float(scores[i])) for i in idx]  # type: ignore[index]


def reset_for_testing() -> None:
    """Reset module state; only for use in tests."""
    global _vectors, _codes
    _vectors = None
    _codes = None
