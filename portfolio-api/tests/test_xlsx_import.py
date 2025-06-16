import pandas as pd
import pytest

from src.services.xlsx_import import parse_xlsx, _localize_headers


def test_missing_headers(tmp_path, app):
    df = pd.DataFrame({"Date": ["2025-06-15"], "Symbol": ["AAPL"]})
    bad_file = tmp_path / "bad.xlsx"
    df.to_excel(bad_file, index=False)

    with app.app_context():
        with pytest.raises(ValueError, match="Missing required columns"):
            parse_xlsx(bad_file)


def test_avanza_headers():
    df = pd.DataFrame(columns=[
        "Datum",
        "Konto",
        "Trnsaktionstyp",
        "V\u00e4rdepapper/Beskrivning",
        "Antal",
        "Kurs",
        "Belopp",
    ])
    localized = _localize_headers(df)
    assert localized.columns.tolist() == [
        "Date",
        "Konto",
        "Action",
        "Symbol",
        "Quantity",
        "PriceRaw",
        "TotalAmount",
    ]
