"""Update stock prices for all known tickers.

This script fetches the latest quote for each stock symbol in the
portfolio and stores the result in the database. Prices are stored in the
instrument's native currency. The script mirrors the behaviour of the
/price/refresh API endpoint but can be run standalone.
"""

from __future__ import annotations

import os
from datetime import datetime

from flask import Flask

from src.config import SQLALCHEMY_DATABASE_URI, PORTFOLIO_BASE_CCY
from src.models.portfolio import Stock, PriceCache, CurrencyEnum
from src.models.user import db
from src.services.market_data import fetch_quote, QuoteAPIError


def create_app() -> Flask:
    app = Flask("update-prices")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "DATABASE_URL", SQLALCHEMY_DATABASE_URI
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)
    return app


def update_prices() -> None:
    app = create_app()
    with app.app_context():
        db.create_all()
        base_currency = os.environ.get("PORTFOLIO_BASE_CCY", PORTFOLIO_BASE_CCY)
        symbols = [s.symbol for s in Stock.query.distinct(Stock.symbol)]
        for symbol in symbols:
            try:
                price = fetch_quote(symbol)
            except QuoteAPIError as exc:
                print(f"failed to fetch {symbol}: {exc}", flush=True)
                continue
            if price is None:
                print(f"no quote for {symbol}", flush=True)
                continue
            stock = Stock.query.filter_by(symbol=symbol).first()
            stock.current_price = price
            stock.last_updated = datetime.utcnow()
            db.session.add(
                PriceCache(
                    symbol=symbol,
                    price=price,
                    currency=CurrencyEnum[base_currency],
                )
            )
            db.session.commit()
            print(f"{symbol}: {price}", flush=True)


if __name__ == "__main__":
    update_prices()
