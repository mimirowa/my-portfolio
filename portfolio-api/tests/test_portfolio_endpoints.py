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


def test_transaction_custom_currency(client, app, monkeypatch):
    def fake_get(url, params=None, **kwargs):
        class R:
            def json(self_inner):
                return {"rates": {params['symbols']: 1.0}}

        return R()

    monkeypatch.setattr('requests.get', fake_get)

    data = {
        'symbol': 'PLN1',
        'transaction_type': 'buy',
        'quantity': 1,
        'price_per_share': 100.0,
        'transaction_date': '2024-03-01',
        'currency': 'PLN',
    }
    resp = client.post('/api/portfolio/transactions', json=data)
    assert resp.status_code == 201
    body = resp.get_json()
    assert body['currency'] == 'PLN'
    with app.app_context():
        from src.models.portfolio import Transaction
        tx = Transaction.query.get(body['id'])
        assert tx.currency.name == 'PLN'


def test_transaction_default_currency(client):
    data = {
        'symbol': 'USD1',
        'transaction_type': 'buy',
        'quantity': 1,
        'price_per_share': 50.0,
        'transaction_date': '2024-03-02'
    }
    resp = client.post('/api/portfolio/transactions', json=data)
    assert resp.status_code == 201
    body = resp.get_json()
    assert body['currency'] == 'USD'


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


def test_currency_conversion(client, monkeypatch, app):
    # transactions fetch FX when inserted
    monkeypatch.setattr('src.routes.portfolio.get_fx_rate', lambda *a, **k: 1.0)

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

    # restore real fx function for summary
    from src.lib.fx import get_fx_rate as real_fx
    monkeypatch.setattr('src.routes.portfolio.get_fx_rate', real_fx)

    def fake_fx_get(url, params=None, **kwargs):
        class R:
            def json(self_inner):
                return {"rates": {params['symbols']: 1.2}}

        return R()

    monkeypatch.setattr('src.lib.fx.requests.get', fake_fx_get)

    summary = client.get('/api/portfolio/summary')
    assert summary.status_code == 200
    data = summary.get_json()
    assert round(data['total_cost_basis'], 2) == 220.0

    with app.app_context():
        from src.models.portfolio import FxRate
        assert FxRate.query.count() == 1


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
    monkeypatch.setattr('src.routes.portfolio.fetch_quote', lambda s: None)

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


def test_prices_refresh_updates_cache(client, monkeypatch, app):
    tx = {
        'symbol': 'AAPL',
        'transaction_type': 'buy',
        'quantity': 1,
        'price_per_share': 100.0,
        'transaction_date': '2024-01-01'
    }
    client.post('/api/portfolio/transactions', json=tx)

    monkeypatch.setenv('ALPHAVANTAGE_API_KEY', 'demo')

    def fake_get(url, params=None, **kwargs):
        class R:
            def raise_for_status(self):
                pass

            def json(self):
                return {
                    'Global Quote': {
                        '05. price': '123.45'
                    }
                }

        return R()

    monkeypatch.setattr('requests.get', fake_get)

    resp = client.post('/api/portfolio/prices/refresh', json={})
    assert resp.status_code == 200
    assert resp.get_json() == {'updated': 1, 'failed': []}

    with app.app_context():
        from src.models.portfolio import PriceCache
        assert PriceCache.query.count() == 1
        rec = PriceCache.query.first()
        assert rec.currency.name == 'USD'


def test_update_price_includes_company(client, monkeypatch):
    tx = {
        'symbol': 'AAPL',
        'transaction_type': 'buy',
        'quantity': 1,
        'price_per_share': 100.0,
        'transaction_date': '2024-01-01'
    }
    client.post('/api/portfolio/transactions', json=tx)

    fake_chart = {
        'chart': {
            'result': [{
                'meta': {
                    'regularMarketPrice': 150.0,
                    'longName': 'Apple Inc.'
                }
            }]
        }
    }
    monkeypatch.setattr('src.routes.portfolio.client.call_api', lambda *a, **k: fake_chart)

    resp = client.post('/api/portfolio/stocks/AAPL/price')
    assert resp.status_code == 200
    body = resp.get_json()
    assert body['company'] == 'Apple Inc.'
