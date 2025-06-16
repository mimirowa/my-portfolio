import pandas as pd
from flask import current_app as app
from .google_finance import _parse_number
from datetime import datetime

REQUIRED_COLUMNS = {"Date", "Symbol", "Action", "Quantity", "Price", "Currency"}

ALIAS_MAP = {
    "Ticker": "Symbol",
    "Qty": "Quantity",
    "Amount": "Price",
}


def parse_xlsx(file_obj):
    df = pd.read_excel(file_obj)
    df.rename(columns=ALIAS_MAP, inplace=True)

    swedish = {
        "Datum": "Date",
        "Typ": "Action",
        "Namn": "Symbol",
        "Antal/Belopp": "Quantity",
        "Kurs": "Price",
        "Valuta": "Currency",
    }
    df.rename(columns=swedish, inplace=True)

    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        current = ", ".join(df.columns)
        app.logger.warning("XLSX import failed; missing=%s", sorted(missing))
        raise ValueError(
            f"Missing required columns: {sorted(missing)}; got: {current}"
        )
    df.rename(columns={v: k for k, v in swedish.items()}, inplace=True)

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
