"""Batch-embed strings via OpenAI text-embedding-3-small.

Returns numpy.ndarray of shape (n, EMBED_DIMS), dtype float32.
"""

from __future__ import annotations

import os

import numpy as np
from openai import OpenAI

from . import consts


def embed(texts: list[str], client: OpenAI | None = None) -> np.ndarray:
    """Embed texts in batches; return shape (n, EMBED_DIMS) float32."""
    if not texts:
        return np.empty((0, consts.EMBED_DIMS), dtype=np.float32)
    if client is None:
        client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    results: list[list[float]] = []
    for i in range(0, len(texts), consts.EMBED_BATCH_SIZE):
        batch = texts[i : i + consts.EMBED_BATCH_SIZE]
        response = client.embeddings.create(model=consts.EMBED_MODEL, input=batch)
        results.extend(item.embedding for item in response.data)

    return np.array(results, dtype=np.float32)
