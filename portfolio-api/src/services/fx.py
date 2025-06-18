from __future__ import annotations

import time
from datetime import date as date_cls
from typing import Dict

import requests
from flask import current_app

from src.models.portfolio import FxRate, CurrencyEnum
from src.models.user import db
from src.lib.fx import validate_currency_code, FxDownloadError
from src import settings

SUPPORTED_CCY = [c.name for c in CurrencyEnum]


def _fetch_rates(dt: date_cls, base: str) -> Dict[str, float]:
    url = f"{settings.FX_PROVIDER_URL.rstrip('/')}/{dt.isoformat()}"
    params = {"base": base}
    if settings.FX_API_KEY:
        params["apikey"] = settings.FX_API_KEY
    delay = 1.0
    last_exc: Exception | None = None
    for _ in range(3):
        try:
            resp = requests.get(url, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            if "rates" not in data:
                raise ValueError("missing rates")
            return {k.upper(): float(v) for k, v in data["rates"].items()}
        except Exception as exc:  # noqa: BLE001
            last_exc = exc
            current_app.logger.warning("FX fetch failed: %s", exc)
            time.sleep(delay)
            delay *= 2
    raise FxDownloadError(str(last_exc) if last_exc else "unknown error")


def get_rate(date: date_cls | str, base_ccy: str, quote_ccy: str) -> float:
    dt = date_cls.fromisoformat(date) if isinstance(date, str) else date
    base = validate_currency_code(base_ccy)
    quote = validate_currency_code(quote_ccy)

    if base == quote:
        return 1.0

    rec = FxRate.query.filter_by(base=base, target=quote, date=dt).first()
    if rec:
        return rec.rate

    rates = _fetch_rates(dt, base)
    for tgt, rate in rates.items():
        if tgt not in SUPPORTED_CCY:
            continue
        row = FxRate.query.filter_by(base=base, target=tgt, date=dt).first()
        if row:
            row.rate = rate
        else:
            db.session.add(FxRate(base=base, target=tgt, date=dt, rate=rate))
    db.session.commit()

    if quote not in rates:
        raise FxDownloadError("pair unavailable")
    return rates[quote]


def ensure_fx_rates(trade_date: date_cls | str, trade_ccy: str) -> None:
    dt = trade_date if isinstance(trade_date, date_cls) else date_cls.fromisoformat(trade_date)
    base = validate_currency_code(trade_ccy)
    for ccy in SUPPORTED_CCY:
        if ccy == base:
            continue
        try:
            get_rate(dt, base, ccy)
        except FxDownloadError:
            pass
