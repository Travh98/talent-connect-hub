"""ESCO API client.

Thin wrapper around the ESCO REST API /search endpoint. Returns a list of
ESCOMatch objects ranked by the API's own keyword relevance. Callers take
the first result as the best match.

If the API is unreachable or returns no results, this module returns an
empty list — the passport builder handles the unresolved-skill path.
"""

from __future__ import annotations

import httpx

from . import consts
from .models import ESCOMatch


def search(
    term: str,
    language: str = consts.ESCO_DEFAULT_LANGUAGE,
    limit: int = consts.ESCO_SEARCH_RESULTS_LIMIT,
    search_type: str | None = None,
) -> list[ESCOMatch]:
    """Query the ESCO /search endpoint and return ranked matches.

    Args:
        term: The search term, already normalised by the LLM.
        language: ESCO language code (e.g. "en", "fr", "ar").
        limit: Maximum results to fetch (defaults to ESCO_SEARCH_RESULTS_LIMIT).
        search_type: Optional ESCO type filter ("skill" or "occupation").

    Returns:
        List of ESCOMatch, best match first. Empty list on no results or error.
    """
    params: dict[str, str | int] = {
        "language": language,
        "text": term,
        "limit": limit,
        "offset": 0,
    }
    if search_type is not None:
        params["type"] = search_type

    try:
        with httpx.Client(timeout=consts.ESCO_API_TIMEOUT_SECONDS) as client:
            response = client.get(
                f"{consts.ESCO_API_BASE_URL}/search", params=params
            )
            response.raise_for_status()
            payload = response.json()
    except (httpx.HTTPError, httpx.TimeoutException):
        return []

    results = payload.get("_embedded", {}).get("results", [])
    return [_parse_result(item, language) for item in results]


def _parse_result(item: dict, language: str) -> ESCOMatch:
    preferred_labels = item.get("preferredLabel", {})
    label = (
        preferred_labels.get(language)
        or preferred_labels.get(consts.ESCO_DEFAULT_LANGUAGE)
        or item.get("title", "")
    )
    return ESCOMatch(
        uri=item.get("uri", ""),
        preferred_label=label,
        isco_code=item.get("code"),
    )
