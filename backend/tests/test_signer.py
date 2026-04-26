"""Tests for skills_passport.signer."""

from __future__ import annotations

from pathlib import Path

import pytest

from skills_passport import signer as signer_mod
from skills_passport.signer import (
    get_public_key_pem,
    reset_for_testing,
    sign_passport,
    verify_passport,
)


@pytest.fixture(autouse=True)
def _reset():
    """Ensure each test starts with no cached keys."""
    reset_for_testing()
    yield
    reset_for_testing()


@pytest.fixture()
def key_paths(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    """Point signer at tmp_path so tests never touch real keys."""
    priv = tmp_path / "private.pem"
    pub = tmp_path / "public.pem"
    monkeypatch.setenv("ED25519_PRIVATE_KEY_PATH", str(priv))
    monkeypatch.setenv("ED25519_PUBLIC_KEY_PATH", str(pub))
    return priv, pub


def test_sign_produces_proof_block(key_paths):
    passport = {"@id": "urn:test:1", "@type": "passport:SkillsPassport", "passport:country": "GHA"}
    signed = sign_passport(passport)

    assert "proof" in signed
    proof = signed["proof"]
    assert proof["type"] == "Ed25519Signature2020"
    assert proof["proofPurpose"] == "assertionMethod"
    assert proof["verificationMethod"]
    assert len(proof["proofValue"]) > 0
    assert proof["created"]


def test_verify_returns_true_for_valid_passport(key_paths):
    passport = {"@id": "urn:test:2", "passport:country": "IND"}
    signed = sign_passport(passport)
    assert verify_passport(signed) is True


def test_verify_returns_false_for_tampered_field(key_paths):
    passport = {"@id": "urn:test:3", "passport:country": "GHA"}
    signed = sign_passport(passport)
    tampered = {**signed, "passport:country": "ZZZ"}
    assert verify_passport(tampered) is False


def test_verify_returns_false_for_tampered_proof_value(key_paths):
    passport = {"@id": "urn:test:4", "passport:locale": "en"}
    signed = sign_passport(passport)
    bad_proof = {**signed["proof"], "proofValue": "AAAA"}
    tampered = {**signed, "proof": bad_proof}
    assert verify_passport(tampered) is False


def test_verify_returns_false_for_missing_proof():
    passport = {"@id": "urn:test:5"}
    assert verify_passport(passport) is False


def test_auto_generation_creates_key_files(key_paths):
    priv_path, pub_path = key_paths
    assert not priv_path.exists()
    assert not pub_path.exists()

    sign_passport({"@id": "urn:test:6"})

    assert priv_path.exists()
    assert pub_path.exists()
    assert b"-----BEGIN PRIVATE KEY-----" in priv_path.read_bytes()
    assert b"-----BEGIN PUBLIC KEY-----" in pub_path.read_bytes()


def test_reset_for_testing_clears_cached_keys(key_paths):
    sign_passport({"@id": "urn:test:7"})
    assert signer_mod._private_key is not None
    reset_for_testing()
    assert signer_mod._private_key is None
    assert signer_mod._public_key is None


def test_get_public_key_pem(key_paths):
    sign_passport({"@id": "urn:test:8"})
    pem = get_public_key_pem()
    assert pem.startswith("-----BEGIN PUBLIC KEY-----")
