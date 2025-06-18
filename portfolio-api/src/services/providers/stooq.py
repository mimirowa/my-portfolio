import io
import pandas as pd
import requests


def fetch_quote(symbol: str):
    """Return latest closing price from Stooq or ``None`` if unavailable."""
    stooq_symbol = symbol.split('.')[0].lower()
    url = f"https://stooq.com/q/l/?s={stooq_symbol}&f=sd2t2ohlcv&h&e=csv"
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    df = pd.read_csv(io.StringIO(resp.text))
    if df.empty or df['Close'].isna().iloc[0]:
        return None
    return float(df['Close'].iloc[0])
