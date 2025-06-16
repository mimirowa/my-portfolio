"""XLSX import helpers."""

from __future__ import annotations

import re
from datetime import datetime
from typing import IO, Iterable

import pandas as pd
from flask import current_app as app


NUMERIC = re.compile(r"[^0-9,.-]")

SV_TO_EN = {
    "Datum": "Date",
    "Trnsaktionstyp": "Action",
    "Typ": "Action",
    "Antal": "Quantity",
    "Antal/Belopp": "Quantity",
    "V\u00e4rdepapper/Beskrivning": "Symbol",
    "Namn": "Symbol",
    "Kurs": "PriceRaw",
    "Belopp": "TotalAmount",
    "Valuta": "Currency",
}

ALIAS_MAP = {
    "Ticker": "Symbol",
    "Qty": "Quantity",
    "Amount": "Price",
}

REQUIRED_COLUMNS = {"Date", "Symbol", "Action", "Quantity", "Price", "Currency"}


def _localize_headers(df: pd.DataFrame) -> pd.DataFrame:
    rename_map = {k: v for k, v in SV_TO_EN.items() if k in df.columns}
    rename_map.update({k: v for k, v in ALIAS_MAP.items() if k in df.columns})
    return df.rename(columns=rename_map)


def split_price_currency(raw: str | float | int) -> tuple[float | None, str | None]:
    if raw is None or str(raw).strip() == "-":
        return None, None
    txt = str(raw).replace("\u2212", "-").replace("\xa0", " ").strip()
    parts = txt.split()
    number = parts[0]
    cur = parts[1] if len(parts) > 1 else None
    number = NUMERIC.sub("", number).replace(",", ".")
    try:
        return float(number), cur
    except ValueError:
        return None, cur


def clean_number(val: str | float | int) -> float | None:
    if pd.isna(val):
        return None
    txt = (
        str(val)
        .replace("\u2212", "-")
        .replace("\xa0", "")
        .replace(" ", "")
        .replace(",", ".")
    )
    txt = re.sub(r"[^0-9.-]", "", txt)
    return float(txt) if txt else None


def _postprocess_avanza(df: pd.DataFrame) -> pd.DataFrame:
    if "PriceRaw" in df.columns:
        df[["Price", "Currency"]] = (
            df.pop("PriceRaw").apply(split_price_currency).apply(pd.Series)
        )
    if "Quantity" in df.columns:
        df["Quantity"] = df["Quantity"].apply(clean_number)
    if "TotalAmount" in df.columns:
        df["TotalAmount"] = df["TotalAmount"].apply(clean_number)
    if "Symbol" in df.columns:
        df["Symbol"] = (
            df["Symbol"].str.extract(r"(\b[A-Z]{1,5}\b)", expand=False).fillna(df["Symbol"])
        )
    return df


def _validate_headers(df: pd.DataFrame) -> None:
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        current = ", ".join(df.columns)
        app.logger.warning("XLSX import failed; missing=%s", sorted(missing))
        raise ValueError(
            f"Missing required columns: {sorted(missing)}; got: {current}"
        )


def parse_xlsx(file_obj: IO) -> tuple[list[dict], list[str]]:
    """Parse an Avanza or generic trade spreadsheet."""

    df = pd.read_excel(file_obj, dtype=str)
    df = _localize_headers(df)

    if {"Date", "Action", "Quantity", "Symbol"}.issubset(df.columns):
        df = _postprocess_avanza(df)

    _validate_headers(df)

    rows: list[dict] = []
    invalid: list[str] = []

    for _, row in df.iterrows():
        try:
            date_raw = row["Date"]
            if pd.isna(date_raw):
                raise ValueError("missing date")
            date = pd.to_datetime(str(date_raw)).date()

            action_raw = str(row["Action"]).lower()
            if action_raw.startswith("k"):
                action = "purchase"
            elif action_raw.startswith("s"):
                action = "sale"
            else:
                action = action_raw

            ticker = str(row["Symbol"]).strip()

            qty = clean_number(row["Quantity"])
            price = clean_number(row["Price"])
            amount = clean_number(row.get("TotalAmount"))
            if amount is None and qty is not None and price is not None:
                amount = round(qty * price, 2)

            currency = str(row.get("Currency", "")).strip().upper() or None

            if None in (qty, price, currency):
                raise ValueError("missing numeric")

            rows.append(
                {
                    "ticker": ticker,
                    "action": action,
                    "date": date.isoformat(),
                    "shares": int(qty),
                    "price": float(price),
                    "amount": float(amount) if amount is not None else None,
                    "currency": currency,
                }
            )
        except Exception:
            invalid.append(str(row.to_dict()))

    return rows, invalid

