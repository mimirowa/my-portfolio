import json
from datetime import date
from src.routes.portfolio import QuoteAPIError


def test_get_stocks_empty(client):
    resp = client.get('/api/portfolio/stocks')
    assert resp.status_code == 200
    assert resp.get_json() == []


def test_add_transaction_and_fetch(client):
    data = {
        'symbol': 'AAPL',
        'transaction_type': 'buy',
        'quantity': 5,
        'price_per_share': 10.0,
        'transaction_date': '2024-01-01'
    }
    post_resp = client.post('/api/portfolio/transactions', json=data)
    assert post_resp.status_code == 201
    body = post_resp.get_json()
    assert body['transaction_type'] == 'buy'
    assert body['quantity'] == 5

    get_resp = client.get('/api/portfolio/transactions')
    assert get_resp.status_code == 200
    items = get_resp.get_json()
    assert len(items) == 1
    assert items[0]['stock_symbol'] == 'AAPL'


def test_stocks_after_transaction(client):
    data = {
        'symbol': 'MSFT',
        'transaction_type': 'buy',
        'quantity': 2,
        'price_per_share': 15.0,
        'transaction_date': '2024-01-01'
    }
    client.post('/api/portfolio/transactions', json=data)
    resp = client.get('/api/portfolio/stocks')
    assert resp.status_code == 200
    stocks = resp.get_json()
    assert len(stocks) == 1
    assert stocks[0]['symbol'] == 'MSFT'
    assert stocks[0]['quantity'] == 2


def test_currency_conversion(client, monkeypatch):
    def fake_get(url, params=None, **kwargs):
        class R:
            def json(self_inner):
                return {"rates": {params['symbols']: 1.2}}
        return R()

    monkeypatch.setattr('requests.get', fake_get)

    usd = {
        'symbol': 'AAPL',
        'transaction_type': 'buy',
        'quantity': 1,
        'price_per_share': 100.0,
        'transaction_date': '2024-01-01',
        'currency': 'USD'
    }
    eur = {
        'symbol': 'AAPL',
        'transaction_type': 'buy',
        'quantity': 1,
        'price_per_share': 100.0,
        'transaction_date': '2024-01-02',
        'currency': 'EUR'
    }
    client.post('/api/portfolio/transactions', json=usd)
    client.post('/api/portfolio/transactions', json=eur)

    summary = client.get('/api/portfolio/summary')
    assert summary.status_code == 200
    data = summary.get_json()
    assert round(data['total_cost_basis'], 2) == 220.0


def test_portfolio_history(client, app):
    t1 = {
        'symbol': 'AAPL',
        'transaction_type': 'buy',
        'quantity': 1,
        'price_per_share': 100.0,
        'transaction_date': '2024-01-01'
    }
    t2 = {
        'symbol': 'AAPL',
        'transaction_type': 'buy',
        'quantity': 1,
        'price_per_share': 100.0,
        'transaction_date': '2024-02-01'
    }

    client.post('/api/portfolio/transactions', json=t1)
    client.post('/api/portfolio/transactions', json=t2)

    with app.app_context():
        from src.models.portfolio import Stock, db
        stock = Stock.query.filter_by(symbol='AAPL').first()
        stock.current_price = 110.0
        db.session.commit()

    resp = client.get('/api/portfolio/history?start=2024-01-01&end=2024-02-05')
    assert resp.status_code == 200
    data = resp.get_json()

    expected_len = (date(2024, 2, 5) - date(2024, 1, 1)).days + 1
    assert len(data) == expected_len

    assert data[0]['date'] == '2024-01-01'
    assert data[0]['with_contributions'] == 110.0
    assert data[0]['market_value_only'] == 10.0

    assert data[-1]['with_contributions'] == 220.0
    assert data[-1]['market_value_only'] == 20.0


def test_search_missing(client, monkeypatch):
    def no_price(*args, **kwargs):
        return {}

    monkeypatch.setattr('src.routes.portfolio.client.call_api', no_price)

    r = client.get('/api/portfolio/stocks/search/FOO')
    assert r.status_code == 404
    assert r.get_json()["message"] == "symbol not found"


def test_search_not_found(client):
    r = client.get('/api/portfolio/stocks/search/FOO')
    assert r.status_code == 404


def test_search_external_fail(monkeypatch, client):
    monkeypatch.setattr(
        'src.routes.portfolio.fetch_quote',
        lambda s: (_ for _ in ()).throw(QuoteAPIError())
    )
    r = client.get('/api/portfolio/stocks/search/FAIL')
    assert r.status_code == 502
