"""FastAPI router for the skills-passport protocol.

Exposes two routes:
  POST /passport/generate  — runs the full P1→P3 pipeline
  GET  /passport/health    — liveness check

The OpenAI client is injected via FastAPI's dependency system so tests can
swap it without patching module-level state.
"""

from __future__ import annotations

import os

from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI

from . import consts
from .country_pack import load_pack
from .models import ProfileInput
from .normalizer import extract_skills
from .passport_builder import build_passport

router = APIRouter(prefix="/passport", tags=["passport"])


def _get_openai_client() -> OpenAI:
    return OpenAI(api_key=os.environ["OPENAI_API_KEY"])


@router.post("/generate")
def generate_passport(
    profile: ProfileInput,
    openai_client: OpenAI = Depends(_get_openai_client),
) -> dict:
    """Run the full pipeline and return a JSON-LD skills passport."""
    try:
        country_pack = load_pack(profile.country_code)
    except ValueError as exc:
        raise HTTPException(
            status_code=consts.HTTP_STATUS_BAD_REQUEST, detail=str(exc)
        ) from exc

    normalization = extract_skills(profile, openai_client)
    passport = build_passport(normalization.skill_extractions, country_pack)
    return passport.to_jsonld()


@router.get("/health")
def health() -> dict:
    return {"status": "ok"}
