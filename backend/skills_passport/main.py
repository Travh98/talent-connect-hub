"""UNMAPPED Skills Passport — FastAPI application entry point.

Run with:
    uvicorn skills_passport.main:app --reload
"""

from dotenv import find_dotenv, load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(find_dotenv())

from .router import match_router, router

app = FastAPI(
    title="UNMAPPED Skills Passport Protocol",
    description=(
        "Converts informal experience into a portable JSON-LD skills passport "
        "grounded in the ESCO taxonomy. Protocol layer — no UI."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(match_router)
