import os
import requests


_API_URL = "https://www.alphavantage.co/query"


def _fetch_av_overview(symbol: str, api_key: str) -> str | None:
    """Return company name using Alpha Vantage OVERVIEW."""
    try:
        resp = requests.get(
            _API_URL,
            params={"function": "OVERVIEW", "symbol": symbol, "apikey": api_key},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("Name") or None
    except Exception:
        return None


def _fetch_yahoo_company(symbol: str) -> str | None:
    """Return company name using Yahoo Finance quoteSummary."""
    url = f"https://query1.finance.yahoo.com/v10/finance/quoteSummary/{symbol}"
    try:
        resp = requests.get(url, params={"modules": "price"}, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        result = data.get("quoteSummary", {}).get("result")
        if result:
            price_info = result[0].get("price", {})
            return price_info.get("longName") or price_info.get("shortName")
    except Exception:
        return None
    return None


def get_company_name(ticker: str) -> str | None:
    """Return company name for ticker symbol using Alpha Vantage or Yahoo."""
    symbol = ticker.upper()
    api_key = os.environ.get("ALPHAVANTAGE_API_KEY")

    if api_key:
        name = _fetch_av_overview(symbol, api_key)
        if name:
            return name

    return _fetch_yahoo_company(symbol)
