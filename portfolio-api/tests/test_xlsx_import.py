import pandas as pd
import pytest

from src.services.xlsx_import import parse_xlsx


def test_missing_headers(tmp_path, app):
    df = pd.DataFrame({"Date": ["2025-06-15"], "Symbol": ["AAPL"]})
    bad_file = tmp_path / "bad.xlsx"
    df.to_excel(bad_file, index=False)

    with app.app_context():
        with pytest.raises(ValueError, match="Missing required columns"):
            parse_xlsx(bad_file)
