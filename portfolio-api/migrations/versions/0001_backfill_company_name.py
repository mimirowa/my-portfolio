"""backfill company names for existing stocks"""

from __future__ import annotations

import os
from flask import Flask

from src.config import SQLALCHEMY_DATABASE_URI
from src.models.portfolio import Stock, Transaction
from src.models.user import db
from src.services.market_data import get_company_name

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def create_app() -> Flask:
    app = Flask("backfill-company-name")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "DATABASE_URL", SQLALCHEMY_DATABASE_URI
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)
    return app


def upgrade() -> None:
    app = create_app()
    with app.app_context():
        tickers = (
            db.session.query(Stock.symbol)
            .join(Transaction)
            .filter(Stock.company_name.is_(None))
            .distinct()
            .all()
        )
        total = len(tickers)
        ok = 0
        failed = 0
        for (symbol,) in tickers:
            name = get_company_name(symbol)
            if name:
                stock = Stock.query.filter_by(symbol=symbol).first()
                stock.company_name = name
                db.session.add(stock)
                ok += 1
            else:
                failed += 1
        db.session.commit()
        print(f"Back-filled {total} tickers ({ok} OK, {failed} failed)")


def downgrade() -> None:
    pass
