from io import BytesIO

import pandas as pd


def test_xlsx_preview_returns_rows(client):
    df = pd.DataFrame({
        'Datum': pd.date_range('2024-01-01', periods=30),
        'Typ': ['Köp'] * 30,
        'Namn': ['AAPL'] * 30,
        'Antal/Belopp': [10] * 30,
        'Kurs': [100] * 30,
        'Belopp': [1000] * 30,
        'Valuta': ['SEK'] * 30,
    })
    bio = BytesIO()
    df.to_excel(bio, index=False)
    bio.seek(0)
    data = {'file': (bio, 'avanza.xlsx')}
    resp = client.post('/api/import/xlsx/preview', data=data, content_type='multipart/form-data')
    assert resp.status_code == 200
    body = resp.get_json()
    assert len(body['rows']) >= 25
    assert body['invalid_rows'] == []
