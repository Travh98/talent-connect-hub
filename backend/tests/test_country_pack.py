"""Tests for country_pack module."""

import json
import tempfile
from pathlib import Path

import pytest

from skills_passport.country_pack import (
    BUILTIN_PACKS,
    load_pack,
    load_pack_from_file,
)


def test_load_pack_ghana():
    pack = load_pack("GHA")
    assert pack.country_code == "GHA"
    assert pack.esco_language == "en"


def test_load_pack_kenya():
    pack = load_pack("KEN")
    assert pack.country_code == "KEN"


def test_load_pack_case_insensitive():
    assert load_pack("gha").country_code == "GHA"
    assert load_pack("Gha").country_code == "GHA"


def test_load_pack_unknown_raises():
    with pytest.raises(ValueError, match="No built-in country pack"):
        load_pack("ZZZ")


def test_load_pack_from_file():
    pack_data = {
        "country_code": "NGA",
        "country_name": "Nigeria",
        "esco_language": "en",
        "locale": "en",
        "ilostat_country_code": "NGA",
    }
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".json", delete=False
    ) as tmp:
        json.dump(pack_data, tmp)
        tmp_path = Path(tmp.name)

    try:
        pack = load_pack_from_file(tmp_path)
        assert pack.country_code == "NGA"
        assert pack.country_name == "Nigeria"
    finally:
        tmp_path.unlink()


def test_builtin_packs_all_have_ilostat_code():
    for code, pack in BUILTIN_PACKS.items():
        assert pack.ilostat_country_code, f"{code} missing ilostat_country_code"
