"""Tests for indexer — embed() and dashboard_loader are mocked."""

from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import numpy as np
import pytest

from skills_passport import consts
import skills_passport.indexer as indexer


_FAKE_CODES = ["7422", "7421", "2311"]
_N = len(_FAKE_CODES)


def _fake_unique_isco():
    return {
        code: {
            "isco_4_label": f"Occupation {code}",
            "top_essential_skills": f"skill_a_{code}; skill_b_{code}",
        }
        for code in _FAKE_CODES
    }


def _fake_embed(texts, client=None):
    rng = np.random.default_rng(42)
    return rng.random((len(texts), consts.EMBED_DIMS)).astype(np.float32)


@pytest.fixture(autouse=True)
def reset_indexer():
    indexer.reset_for_testing()
    yield
    indexer.reset_for_testing()


@pytest.fixture
def patched_deps(tmp_path):
    cache_path = tmp_path / "cache" / f"embeddings_{consts.EMBED_MODEL}.npy"
    with (
        patch("skills_passport.indexer.get_unique_isco", side_effect=_fake_unique_isco),
        patch("skills_passport.indexer.embed", side_effect=_fake_embed),
        patch.object(consts, "EMBED_CACHE_PATH", cache_path),
    ):
        yield cache_path


def test_search_returns_top_n(patched_deps):
    query = np.ones((1, consts.EMBED_DIMS), dtype=np.float32)
    results = indexer.search(query, top_n=2)
    assert len(results) == 2


def test_search_returns_known_codes(patched_deps):
    query = np.ones((1, consts.EMBED_DIMS), dtype=np.float32)
    results = indexer.search(query, top_n=_N)
    returned_codes = {code for code, _ in results}
    assert returned_codes == set(_FAKE_CODES)


def test_search_results_sorted_descending(patched_deps):
    query = np.ones((1, consts.EMBED_DIMS), dtype=np.float32)
    results = indexer.search(query, top_n=_N)
    scores = [s for _, s in results]
    assert scores == sorted(scores, reverse=True)


def test_cache_written_on_first_build(patched_deps):
    cache_path = patched_deps
    assert not cache_path.exists()
    query = np.ones((1, consts.EMBED_DIMS), dtype=np.float32)
    indexer.search(query, top_n=1)
    assert cache_path.exists()


def test_cache_hit_skips_embedding(patched_deps, tmp_path):
    cache_path = patched_deps
    # Prime cache
    query = np.ones((1, consts.EMBED_DIMS), dtype=np.float32)
    indexer.search(query, top_n=1)
    indexer.reset_for_testing()

    with patch("skills_passport.indexer.embed", side_effect=_fake_embed) as mock_embed:
        indexer.search(query, top_n=1)
        mock_embed.assert_not_called()


def test_corrupt_cache_triggers_rebuild(patched_deps, tmp_path):
    cache_path = patched_deps
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    # Write garbage
    cache_path.write_bytes(b"not a numpy file")
    indexer.reset_for_testing()

    with patch("skills_passport.indexer.embed", side_effect=_fake_embed) as mock_embed:
        query = np.ones((1, consts.EMBED_DIMS), dtype=np.float32)
        indexer.search(query, top_n=1)
        mock_embed.assert_called_once()
