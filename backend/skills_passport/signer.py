"""Ed25519 passport signing and verification.

Keys are loaded lazily on first use (thread-safe, double-checked init).
If key files are missing they are auto-generated and written to disk so the
demo works without any manual setup step.

proofValue is base64url-encoded (no padding) — a pragmatic deviation from
the strict Ed25519Signature2020 multibase/base58btc spec that avoids
pulling in a base58 dependency for a hackathon demo.
"""

from __future__ import annotations

import base64
import json
import os
import sys
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)

from . import consts

_lock = threading.Lock()
_private_key: Optional[Ed25519PrivateKey] = None
_public_key: Optional[Ed25519PublicKey] = None


def _private_key_path() -> Path:
    env = os.environ.get("ED25519_PRIVATE_KEY_PATH")
    return Path(env) if env else consts.ED25519_PRIVATE_KEY_PATH_DEFAULT


def _public_key_path() -> Path:
    env = os.environ.get("ED25519_PUBLIC_KEY_PATH")
    return Path(env) if env else consts.ED25519_PUBLIC_KEY_PATH_DEFAULT


def _verification_method() -> str:
    env = os.environ.get("PASSPORT_VERIFICATION_METHOD")
    return env if env else consts.PASSPORT_VERIFICATION_METHOD_DEFAULT


def _generate_and_save() -> tuple[Ed25519PrivateKey, Ed25519PublicKey]:
    priv = Ed25519PrivateKey.generate()
    pub = priv.public_key()

    priv_path = _private_key_path()
    pub_path = _public_key_path()
    priv_path.parent.mkdir(parents=True, exist_ok=True)

    priv_path.write_bytes(
        priv.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        )
    )
    pub_path.write_bytes(
        pub.public_bytes(
            serialization.Encoding.PEM,
            serialization.PublicFormat.SubjectPublicKeyInfo,
        )
    )
    print(
        f"[signer] Auto-generated Ed25519 keypair → {priv_path}, {pub_path}",
        file=sys.stderr,
    )
    return priv, pub


def _load() -> None:
    global _private_key, _public_key

    priv_path = _private_key_path()
    pub_path = _public_key_path()

    if not priv_path.exists() or not pub_path.exists():
        _private_key, _public_key = _generate_and_save()
        return

    _private_key = serialization.load_pem_private_key(
        priv_path.read_bytes(), password=None
    )
    _public_key = serialization.load_pem_public_key(pub_path.read_bytes())  # type: ignore[assignment]


def _ensure_loaded() -> None:
    if _private_key is None:
        with _lock:
            if _private_key is None:
                _load()


def _canonicalize(passport: dict) -> bytes:
    payload = {k: v for k, v in passport.items() if k != "proof"}
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str).encode("utf-8")


def sign_passport(jsonld: dict) -> dict:
    _ensure_loaded()
    canonical = _canonicalize(jsonld)
    sig_bytes = _private_key.sign(canonical)  # type: ignore[union-attr]
    proof_value = base64.urlsafe_b64encode(sig_bytes).rstrip(b"=").decode()
    proof = {
        "type": consts.JSONLD_TYPE_PROOF,
        "created": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "verificationMethod": _verification_method(),
        "proofPurpose": "assertionMethod",
        "proofValue": proof_value,
    }
    return {**jsonld, "proof": proof}


def verify_passport(jsonld: dict) -> bool:
    _ensure_loaded()
    proof = jsonld.get("proof")
    if not proof or not proof.get("proofValue"):
        return False
    try:
        sig_bytes = base64.urlsafe_b64decode(proof["proofValue"] + "==")
        canonical = _canonicalize(jsonld)
        _public_key.verify(sig_bytes, canonical)  # type: ignore[union-attr]
        return True
    except (InvalidSignature, Exception):
        return False


def get_public_key_pem() -> str:
    _ensure_loaded()
    return _public_key.public_bytes(  # type: ignore[union-attr]
        serialization.Encoding.PEM,
        serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode()


def get_verification_method() -> str:
    return _verification_method()


def reset_for_testing() -> None:
    """Reset module state; only for use in tests."""
    global _private_key, _public_key
    _private_key = None
    _public_key = None
