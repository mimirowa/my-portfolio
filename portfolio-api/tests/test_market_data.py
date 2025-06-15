import json
from src.services import market_data
from src.lib import market_data as lib_market_data


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
    monkeypatch.setattr(lib_market_data, "get_company_name", lambda s: "Apple Inc.")

    resp = client.get("/api/portfolio/stocks/search/AAPL")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["symbol"] == "AAPL"
    assert data["price"] == 123.45
    assert data["company"] == "Apple Inc."

def test_get_company_name(monkeypatch):
    def fake_call_api(self, path, query=None):
        return {
            "chart": {"result": [{"meta": {"longName": "Apple Inc"}}]}
        }

    monkeypatch.setattr(market_data.ApiClient, "call_api", fake_call_api)

    name = market_data.get_company_name("AAPL")
    assert name == "Apple Inc"
