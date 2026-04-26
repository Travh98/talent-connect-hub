"""UNMAPPED Skills Passport Protocol.

Module 01 of UNMAPPED. Converts informal experience plus structured
inputs into a portable, JSON-LD skills passport grounded in the ESCO
taxonomy and ISCO-08 occupation codes.

This package is the protocol layer — it has no UI. Downstream systems
(matching engines, dashboards, employer portals) consume the passport
JSON-LD without writing custom parsers.
"""

from .consts import PASSPORT_SCHEMA_VERSION

__all__ = ["PASSPORT_SCHEMA_VERSION"]
