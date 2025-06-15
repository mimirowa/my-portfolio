import json


def test_fee_summary_after_migration(client, monkeypatch):
    monkeypatch.setattr('src.routes.portfolio.get_fx_rate', lambda *a, **k: 1.0)
    buy = {
        'symbol': 'AAPL',
        'transaction_type': 'buy',
        'quantity': 100,
        'price_per_share': 10.0,
        'transaction_date': '2024-01-01',
        'currency': 'EUR',
        'fee_amount': 5.0,
        'fee_currency': 'EUR',
    }
    sell = {
        'symbol': 'AAPL',
        'transaction_type': 'sell',
        'quantity': 100,
        'price_per_share': 12.0,
        'transaction_date': '2024-01-02',
        'currency': 'EUR',
        'fee_amount': 1.0,
        'fee_currency': 'EUR',
    }

    client.post('/api/portfolio/transactions', json=buy)
    client.post('/api/portfolio/transactions', json=sell)

    resp = client.get('/api/portfolio/summary')
    assert resp.status_code == 200
    data = resp.get_json()
    assert round(data['total_fees_paid'], 2) == 6.0
    assert round(data['net_gain_after_fees'], 2) == 194.0
