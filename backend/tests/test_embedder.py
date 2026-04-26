"""Tests for embedder — OpenAI client is always mocked."""

from __future__ import annotations

from unittest.mock import MagicMock, call

import numpy as np
import pytest

from skills_passport import consts
from skills_passport.embedder import embed


def _make_mock_client(dims: int = consts.EMBED_DIMS) -> MagicMock:
    """Return a mock OpenAI client whose embeddings.create echoes back zeros."""

    def _create(model, input):  # noqa: A002
        response = MagicMock()
        response.data = [
            MagicMock(embedding=[0.0] * dims) for _ in input
        ]
        return response

    client = MagicMock()
    client.embeddings.create.side_effect = _create
    return client


def test_empty_input_returns_empty_array():
    result = embed([], _make_mock_client())
    assert result.shape == (0, consts.EMBED_DIMS)
    assert result.dtype == np.float32


def test_single_text_returns_correct_shape():
    result = embed(["hello world"], _make_mock_client())
    assert result.shape == (1, consts.EMBED_DIMS)
    assert result.dtype == np.float32


def test_batch_size_respected(monkeypatch):
    monkeypatch.setattr(consts, "EMBED_BATCH_SIZE", 2)
    client = _make_mock_client()
    texts = ["a", "b", "c", "d", "e"]
    result = embed(texts, client)

    # 5 texts with batch_size=2 → 3 API calls (2+2+1)
    assert client.embeddings.create.call_count == 3
    assert result.shape == (5, consts.EMBED_DIMS)


def test_exact_batch_boundary(monkeypatch):
    monkeypatch.setattr(consts, "EMBED_BATCH_SIZE", 3)
    client = _make_mock_client()
    embed(["x"] * 6, client)
    assert client.embeddings.create.call_count == 2


def test_single_batch_no_extra_calls(monkeypatch):
    monkeypatch.setattr(consts, "EMBED_BATCH_SIZE", 100)
    client = _make_mock_client()
    embed(["x"] * 50, client)
    assert client.embeddings.create.call_count == 1


def test_output_dtype_is_float32():
    client = _make_mock_client()
    result = embed(["test"], client)
    assert result.dtype == np.float32
