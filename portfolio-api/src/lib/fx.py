from datetime import date as date_cls
from typing import Union
import os

import requests
from flask import current_app
from werkzeug.exceptions import BadGateway

from src.config import PORTFOLIO_BASE_CCY

from src.models.portfolio import ExchangeRate
from src.models.user import db


class UnsupportedCurrency(Exception):
    pass


class FxDownloadError(Exception):
    pass


def _norm(code: str) -> str:
    code = code.strip().upper()
    if len(code) != 3 or not code.isascii() or not code.isalpha():
        raise UnsupportedCurrency(code)
    return code


validate_currency_code = _norm


def get_fx_rate(from_ccy: str, to_ccy: str, dt: Union[str, date_cls]) -> float:
    """Return FX rate from ``from_ccy`` to ``to_ccy`` for ``dt``.

    Checks local cache first and falls back to AlphaVantage FX_DAILY.
    """
    if isinstance(dt, str):
        dt = date_cls.fromisoformat(dt)

    from_ccy = _norm(from_ccy)
    to_ccy = _norm(to_ccy)

    if from_ccy == to_ccy:
        return 1.0

    rate = ExchangeRate.query.filter_by(base=from_ccy, quote=to_ccy, date=dt).first()
    if rate:
        return rate.rate

    api_key = os.environ.get("ALPHAVANTAGE_API_KEY")
    if not api_key:
        raise FxDownloadError("missing API key")

    params = {
        "function": "FX_DAILY",
        "from_symbol": from_ccy,
        "to_symbol": to_ccy,
        "outputsize": "compact",
        "apikey": api_key,
    }
    try:
        resp = requests.get("https://www.alphavantage.co/query", params=params, timeout=10)
        data = resp.json()
        if "Note" in data:
            raise FxDownloadError("quota exceeded")
        if "Error Message" in data:
            raise FxDownloadError("invalid pair")
        series = data["Time Series FX (Daily)"]
        fx = float(series[dt.isoformat()]["4. close"])
    except FxDownloadError:
        raise
    except Exception as exc:
        current_app.logger.exception("FX fetch failed: %s", exc)
        raise FxDownloadError("unreachable") from exc

    db.session.add(ExchangeRate(base=from_ccy, quote=to_ccy, date=dt, rate=fx))
    db.session.commit()

    return fx


def to_base(value: float, ccy: str, dt: Union[str, date_cls]) -> float:
    """Convert ``value`` from ``ccy`` to the portfolio base currency.

    Raises :class:`BadGateway` when the rate is unavailable.
    """
    if isinstance(dt, str):
        dt = date_cls.fromisoformat(dt)

    ccy = _norm(ccy)
    base_ccy = _norm(current_app.config.get("PORTFOLIO_BASE_CCY", PORTFOLIO_BASE_CCY))

    if ccy == base_ccy:
        return float(value)

    from src.services import fx as svc

    try:
        rate = svc.get_rate(dt, ccy, base_ccy)
    except FxDownloadError as exc:
        raise BadGateway("FX rate unavailable") from exc

    return float(value) * rate
