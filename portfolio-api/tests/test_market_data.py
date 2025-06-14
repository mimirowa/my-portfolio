import json
from src.services import market_data


def test_search_aapl_success(monkeypatch, client):
    market_data._CACHE.clear()
    monkeypatch.setenv("ALPHAVANTAGE_API_KEY", "demo")

    fake_json = {
        "Global Quote": {
            "01. symbol": "AAPL",
            "05. price": "123.45",
        }
    }

    def fake_get(url, params=None, **kwargs):
        class R:
            def raise_for_status(self):
                pass
            def json(self):
                return fake_json
        return R()

    monkeypatch.setattr(market_data.requests, "get", fake_get)

    resp = client.get("/api/portfolio/stocks/search/AAPL")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["symbol"] == "AAPL"
    assert data["price"] == 123.45
