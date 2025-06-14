from datetime import date as date_cls
from typing import Union

import requests
from flask import current_app

from src.models.portfolio import FxRate
from src.models.user import db


def get_fx_rate(from_ccy: str, to_ccy: str, dt: Union[str, date_cls]) -> float:
    """Return FX rate from ``from_ccy`` to ``to_ccy`` for ``dt``.

    Looks up the local ``fx_rates`` table first, otherwise fetches from
    exchangerate.host and caches the result.
    """
    if isinstance(dt, str):
        dt = date_cls.fromisoformat(dt)

    if from_ccy.upper() == to_ccy.upper():
        return 1.0

    rate = FxRate.query.filter_by(base=from_ccy.upper(), target=to_ccy.upper(), date=dt).first()
    if rate:
        return rate.rate

    url = f"https://api.exchangerate.host/{dt.isoformat()}"
    resp = requests.get(url, params={"base": from_ccy, "symbols": to_ccy}, timeout=10)
    data = resp.json()
    fx = data["rates"][to_ccy.upper()]

    db.session.add(FxRate(base=from_ccy.upper(), target=to_ccy.upper(), date=dt, rate=fx))
    db.session.commit()

    return fx
