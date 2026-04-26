"""Tests for esco_client module.

All tests mock httpx so no live network calls are made.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from skills_passport import consts
from skills_passport.esco_client import search


def _mock_response(payload: dict, status_code: int = 200) -> MagicMock:
    mock = MagicMock()
    mock.status_code = status_code
    mock.json.return_value = payload
    mock.raise_for_status = MagicMock()
    if status_code >= 400:
        import httpx
        mock.raise_for_status.side_effect = httpx.HTTPStatusError(
            "error", request=MagicMock(), response=mock
        )
    return mock


ESCO_RESPONSE_ONE_RESULT = {
    "_embedded": {
        "results": [
            {
                "uri": "http://data.europa.eu/esco/skill/abc123",
                "preferredLabel": {"en": "mobile phone repair technician"},
                "code": "7421",
                "title": "mobile phone repair technician",
            }
        ]
    }
}

ESCO_RESPONSE_EMPTY = {"_embedded": {"results": []}}


@patch("skills_passport.esco_client.httpx.Client")
def test_search_returns_matches(mock_client_cls):
    mock_client = MagicMock()
    mock_client.__enter__ = MagicMock(return_value=mock_client)
    mock_client.__exit__ = MagicMock(return_value=False)
    mock_client.get.return_value = _mock_response(ESCO_RESPONSE_ONE_RESULT)
    mock_client_cls.return_value = mock_client

    results = search("mobile phone repair")

    assert len(results) == 1
    assert results[0].uri == "http://data.europa.eu/esco/skill/abc123"
    assert results[0].preferred_label == "mobile phone repair technician"
    assert results[0].isco_code == "7421"


@patch("skills_passport.esco_client.httpx.Client")
def test_search_empty_results_returns_empty_list(mock_client_cls):
    mock_client = MagicMock()
    mock_client.__enter__ = MagicMock(return_value=mock_client)
    mock_client.__exit__ = MagicMock(return_value=False)
    mock_client.get.return_value = _mock_response(ESCO_RESPONSE_EMPTY)
    mock_client_cls.return_value = mock_client

    results = search("xyzzy nonexistent skill")

    assert results == []


@patch("skills_passport.esco_client.httpx.Client")
def test_search_http_error_returns_empty_list(mock_client_cls):
    import httpx

    mock_client = MagicMock()
    mock_client.__enter__ = MagicMock(return_value=mock_client)
    mock_client.__exit__ = MagicMock(return_value=False)
    mock_client.get.side_effect = httpx.HTTPError("connection failed")
    mock_client_cls.return_value = mock_client

    results = search("any term")

    assert results == []


@patch("skills_passport.esco_client.httpx.Client")
def test_search_passes_language_param(mock_client_cls):
    mock_client = MagicMock()
    mock_client.__enter__ = MagicMock(return_value=mock_client)
    mock_client.__exit__ = MagicMock(return_value=False)
    mock_client.get.return_value = _mock_response(ESCO_RESPONSE_EMPTY)
    mock_client_cls.return_value = mock_client

    search("phone repair", language="fr")

    _, kwargs = mock_client.get.call_args
    assert kwargs["params"]["language"] == "fr"


@patch("skills_passport.esco_client.httpx.Client")
def test_search_uses_configured_limit(mock_client_cls):
    mock_client = MagicMock()
    mock_client.__enter__ = MagicMock(return_value=mock_client)
    mock_client.__exit__ = MagicMock(return_value=False)
    mock_client.get.return_value = _mock_response(ESCO_RESPONSE_EMPTY)
    mock_client_cls.return_value = mock_client

    search("phone repair")

    _, kwargs = mock_client.get.call_args
    assert kwargs["params"]["limit"] == consts.ESCO_SEARCH_RESULTS_LIMIT


@patch("skills_passport.esco_client.httpx.Client")
def test_search_missing_preferred_label_falls_back_to_title(mock_client_cls):
    response = {
        "_embedded": {
            "results": [
                {
                    "uri": "http://data.europa.eu/esco/skill/xyz",
                    "preferredLabel": {},
                    "title": "fallback title",
                }
            ]
        }
    }
    mock_client = MagicMock()
    mock_client.__enter__ = MagicMock(return_value=mock_client)
    mock_client.__exit__ = MagicMock(return_value=False)
    mock_client.get.return_value = _mock_response(response)
    mock_client_cls.return_value = mock_client

    results = search("something")

    assert results[0].preferred_label == "fallback title"
