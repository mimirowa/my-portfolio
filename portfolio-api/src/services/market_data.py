import os
import time
import requests

class QuoteAPIError(Exception):
    """Raised when the external quote service fails"""


_CACHE = {}
_CACHE_TTL = 60  # seconds
_API_URL = "https://www.alphavantage.co/query"


def fetch_quote(symbol: str):
    """Return the latest price for *symbol* or None if unavailable."""
    api_key = os.environ.get("ALPHAVANTAGE_API_KEY")
    if not api_key:
        return None

    symbol = symbol.upper()
    now = time.time()
    cached = _CACHE.get(symbol)
    if cached and now - cached[1] < _CACHE_TTL:
        return cached[0]

    params = {
        "function": "GLOBAL_QUOTE",
        "symbol": symbol,
        "apikey": api_key,
    }
    try:
        resp = requests.get(_API_URL, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        price = float(data["Global Quote"]["05. price"])
    except Exception as exc:
        raise QuoteAPIError(str(exc)) from exc

    _CACHE[symbol] = (price, now)
    return price
