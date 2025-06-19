"""Fetch and store FX rates for a given date.

This task mirrors the behaviour of the `/api/fx/refresh` endpoint but can be
run as a standalone script or scheduled job.
"""

from __future__ import annotations

import os
from datetime import date

from flask import Flask

from src.config import SQLALCHEMY_DATABASE_URI, PORTFOLIO_BASE_CCY
from src.models.user import db
from src.services.fx import ensure_fx_rates


def create_app() -> Flask:
    app = Flask("refresh-fx")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "DATABASE_URL", SQLALCHEMY_DATABASE_URI
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)
    return app


def refresh_fx(target_date: date) -> None:
    """Download FX rates for ``target_date`` and save them to the DB."""
    app = create_app()
    with app.app_context():
        db.create_all()
        base_currency = os.environ.get("PORTFOLIO_BASE_CCY", PORTFOLIO_BASE_CCY)
        ensure_fx_rates(target_date, base_currency)
        print(f"FX rates refreshed for {target_date.isoformat()}", flush=True)


if __name__ == "__main__":
    refresh_fx(date.today())
