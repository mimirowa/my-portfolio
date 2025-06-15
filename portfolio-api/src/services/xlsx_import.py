import pandas as pd
from .google_finance import _parse_number
from datetime import datetime

REQUIRED_COLS = ["Datum", "Typ", "Namn", "Antal/Belopp", "Kurs", "Belopp", "Valuta"]


def parse_xlsx(file_obj):
    df = pd.read_excel(file_obj, engine="openpyxl")
    cols = list(df.columns)
    if not all(c in cols for c in REQUIRED_COLS):
        raise ValueError("Missing required columns")

    rows = []
    invalid = []
    for _, row in df.iterrows():
        try:
            date_raw = row["Datum"]
            if pd.isna(date_raw):
                raise ValueError("missing date")
            if isinstance(date_raw, str):
                date = pd.to_datetime(date_raw).date()
            else:
                date = pd.to_datetime(str(date_raw)).date()

            typ = str(row["Typ"]).lower()
            if typ.startswith("k"):  # köp
                action = "purchase"
            elif typ.startswith("s"):  # sälj
                action = "sale"
            else:
                continue  # skip non trade rows

            ticker = str(row["Namn"]).strip()
            qty = row["Antal/Belopp"]
            price = row["Kurs"]
            amount = row["Belopp"]
            shares = _parse_number(str(qty)) if not isinstance(qty, (int, float)) else float(qty)
            price = _parse_number(str(price)) if not isinstance(price, (int, float)) else float(price)
            amount = _parse_number(str(amount)) if not isinstance(amount, (int, float)) else float(amount)
            currency = str(row.get("Valuta", "SEK")).strip().upper()
            if None in (shares, price, amount):
                raise ValueError("missing numeric")
            rows.append({
                "ticker": ticker,
                "action": action,
                "date": date.isoformat(),
                "shares": int(shares),
                "price": float(price),
                "amount": float(amount),
                "currency": currency,
            })
        except Exception:
            invalid.append(str(row.to_dict()))
    return rows, invalid
