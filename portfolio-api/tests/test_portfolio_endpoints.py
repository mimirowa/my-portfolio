import json
from datetime import date


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
