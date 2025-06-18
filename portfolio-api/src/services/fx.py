from datetime import date as date_cls
from typing import Optional, Union

from importlib import import_module

from src.lib.fx import get_fx_rate, FxDownloadError, validate_currency_code


def get_rate(from_ccy: str, to_ccy: str, dt: Union[str, date_cls]) -> Optional[float]:
    """Return FX rate or ``None`` if unavailable."""
    from_ccy = validate_currency_code(from_ccy)
    to_ccy = validate_currency_code(to_ccy)
    try:
        portfolio_mod = import_module("src.routes.portfolio")
        getter = getattr(portfolio_mod, "get_fx_rate", get_fx_rate)
    except Exception:
        getter = get_fx_rate
    try:
        return getter(from_ccy, to_ccy, dt)
    except FxDownloadError:
        return None
