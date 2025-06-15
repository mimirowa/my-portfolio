import json
from datetime import date
from pathlib import Path

def sample_raw():
    return """AAPL purchase
$200.00
01/05/2024 2 shares @ $100.00

MSFT sale
€300,00
02/05/2024 3 shares @ €100,00

BADLINE"""


def test_preview_parses_rows(client):
    resp = client.post('/api/import/google-finance/preview', json={'raw': sample_raw()})
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data['rows']) == 2
    first = data['rows'][0]
    assert first['ticker'] == 'AAPL'
    assert first['action'] == 'purchase'
    assert first['shares'] == 2
    assert first['price'] == 100.0


def test_import_creates_transactions(client, app):
    resp = client.post('/api/import/google-finance', json={'raw': sample_raw()})
    assert resp.status_code == 200
    body = resp.get_json()
    assert len(body['inserted_ids']) == 2
    assert body['duplicates_skipped'] == 0

    # second call should skip duplicates
    resp2 = client.post('/api/import/google-finance', json={'raw': sample_raw()})
    assert resp2.status_code == 200
    body2 = resp2.get_json()
    assert body2['duplicates_skipped'] == 2

    with app.app_context():
        from src.models.portfolio import Transaction
        assert Transaction.query.count() == 2


def test_invalid_lines_returned(client):
    raw = "BAD purchase\n123\nmissing details"
    resp = client.post('/api/import/google-finance/preview', json={'raw': raw})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['rows'] == []
    assert len(data['invalid_rows']) >= 1


def read_fixture(name: str) -> str:
    path = Path(__file__).parent / 'fixtures' / name
    with open(path, 'r', encoding='utf-8') as fh:
        return fh.read()


def test_avanza_snippet_parsed(client):
    raw = read_fixture('avanza_snippet.txt')
    resp = client.post('/api/import/google-finance/preview', json={'raw': raw})
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data['rows']) >= 25
    assert data['invalid_rows'] == []


def test_preview_parses_fee_and_fx(client):
    raw = read_fixture('avrakningsnota_nr_250527106476.txt')
    resp = client.post('/api/import/google-finance/preview', json={'raw': raw})
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data['invalid_rows']) == 0
    assert data['rows'][0]['fee_amount'] == 1.5
    assert data['rows'][0]['fx_rate'] == 11.5
