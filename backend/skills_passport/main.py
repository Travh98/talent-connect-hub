"""UNMAPPED Skills Passport — FastAPI application entry point.

Run with:
    uvicorn skills_passport.main:app --reload
"""

from dotenv import find_dotenv, load_dotenv
from fastapi import FastAPI

load_dotenv(find_dotenv())

from .router import router

app = FastAPI(
    title="UNMAPPED Skills Passport Protocol",
    description=(
        "Converts informal experience into a portable JSON-LD skills passport "
        "grounded in the ESCO taxonomy. Protocol layer — no UI."
    ),
    version="1.0.0",
)

app.include_router(router)
