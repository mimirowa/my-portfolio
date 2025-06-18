import os
import time
import requests
from typing import Optional

from .providers import stooq

from src.data_api import ApiClient

class QuoteAPIError(Exception):
    """Raised when the external quote service fails"""


_CACHE = {}
_CACHE_TTL = 60  # seconds
_API_URL = "https://www.alphavantage.co/query"


def fetch_quote(symbol: str):
    """Return the latest price for *symbol* or ``None`` if unavailable.

    Tries Alpha Vantage first and falls back to Stooq when the symbol is not
    supported there or the API returns no data.
    """

    api_key = os.environ.get("ALPHAVANTAGE_API_KEY")

    symbol = symbol.upper()
    now = time.time()
    cached = _CACHE.get(symbol)
    if cached and now - cached[1] < _CACHE_TTL:
        return cached[0]

    price = None
    if api_key:
        params = {
            "function": "GLOBAL_QUOTE",
            "symbol": symbol,
            "apikey": api_key,
        }
        try:
            resp = requests.get(_API_URL, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            if "Global Quote" in data and data["Global Quote"]:
                price = float(data["Global Quote"]["05. price"])
            elif "Error Message" in data:
                price = None
            elif "Note" in data:
                raise QuoteAPIError(data.get("Note"))
        except QuoteAPIError:
            raise
        except Exception as exc:
            raise QuoteAPIError(str(exc)) from exc

    if price is None:
        try:
            price = stooq.fetch_quote(symbol)
        except Exception as exc:
            raise QuoteAPIError(str(exc)) from exc

    _CACHE[symbol] = (price, now)
    return price


def get_company_name(symbol: str) -> Optional[str]:
    """Return the company name for ``symbol`` using the data API.

    Returns ``None`` if the lookup fails or the API response is invalid.
    """
    client = ApiClient()
    try:
        data = client.call_api(
            "YahooFinance/get_stock_chart",
            query={"symbol": symbol.upper(), "interval": "1d", "range": "1d"},
        )
    except Exception:
        return None

    try:
        result = data["chart"]["result"][0]
        meta = result.get("meta", {})
        return meta.get("longName") or meta.get("shortName")
    except Exception:
        return None
