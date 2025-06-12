import re
from datetime import datetime
from flask import Blueprint, request, jsonify
from src.models.portfolio import Stock, Transaction, CurrencyEnum
from src.models.user import db

import_bp = Blueprint('import', __name__)

HEADER_RE = re.compile(r"^(?P<ticker>[A-Z]{2,5})\s+(?P<side>purchase|sale)$", re.I)
DETAIL_RE = re.compile(
    r"^(?P<date>\d{1,2}/\d{1,2}/\d{4})\s+(?P<shares>[\d.,]+)\s+shares?\s+(?:@|at)\s+[€$]?(?P<price>[\d.,]+)",
    re.I,
)


def _parse_number(text: str) -> float | None:
    clean = text.replace("\u202f", "").replace(" ", "")
    clean = clean.replace("€", "").replace("$", "")
    if clean.count(",") > 0 and clean.count(".") > 0:
        if clean.rfind(",") > clean.rfind("."):
            clean = clean.replace(".", "").replace(",", ".")
        else:
            clean = clean.replace(",", "")
    elif clean.count(",") > 0:
        clean = clean.replace(",", ".")
    try:
        return float(clean)
    except ValueError:
        return None


def _parse_block(lines):
    if len(lines) < 3:
        return None
    m1 = HEADER_RE.match(lines[0])
    if not m1:
        return None
    m2 = DETAIL_RE.match(lines[2])
    if not m2:
        return None
    amount = _parse_number(lines[1])
    date_str = m2.group("date")
    try:
        date = datetime.strptime(date_str, "%d/%m/%Y").date()
    except ValueError:
        return None
    shares = _parse_number(m2.group("shares"))
    price = _parse_number(m2.group("price"))
    currency = "USD"
    if "€" in lines[1] or "€" in lines[2]:
        currency = "EUR"
    row = {
        "ticker": m1.group("ticker").upper(),
        "action": m1.group("side").lower(),
        "date": date.isoformat(),
        "shares": shares,
        "price": price,
        "amount": round((shares or 0) * (price or 0), 2),
        "currency": currency,
    }
    if None in row.values():
        return None
    return row


def _parse_raw(raw: str):
    lines = [ln.strip() for ln in raw.splitlines() if ln.strip()]
    rows = []
    invalid = []
    i = 0
    while i < len(lines):
        chunk = lines[i:i+3]
        row = _parse_block(chunk)
        if row:
            rows.append(row)
            i += 3
        else:
            invalid.append(lines[i])
            i += 1
    return rows, invalid


@import_bp.route('/google-finance/preview', methods=['POST'])
def google_finance_preview():
    data = request.get_json(force=True)
    raw = data.get('raw', '')
    rows, invalid = _parse_raw(raw)
    return jsonify({"rows": rows, "invalid_rows": invalid})


@import_bp.route('/google-finance', methods=['POST'])
def google_finance_import():
    data = request.get_json(force=True)
    raw = data.get('raw', '')
    rows, invalid = _parse_raw(raw)
    ids = []
    duplicates = 0
    for row in rows:
        side = 'buy' if row['action'] == 'purchase' else 'sell'
        date_obj = datetime.strptime(row['date'], '%Y-%m-%d').date()
        stock = Stock.query.filter_by(symbol=row['ticker']).first()
        if not stock:
            stock = Stock(symbol=row['ticker'])
            db.session.add(stock)
            db.session.flush()
        exists = Transaction.query.join(Stock).filter(
            Stock.symbol == row['ticker'],
            Transaction.transaction_type == side,
            Transaction.transaction_date == date_obj,
            Transaction.quantity == int(row['shares']),
            Transaction.price_per_share == float(row['price']),
        ).first()
        if exists:
            duplicates += 1
            continue
        tx = Transaction(
            stock_id=stock.id,
            transaction_type=side,
            quantity=int(row['shares']),
            price_per_share=float(row['price']),
            currency=CurrencyEnum[row['currency']],
            fx_rate=1.0,
            transaction_date=date_obj,
        )
        db.session.add(tx)
        db.session.flush()
        ids.append(tx.id)
    db.session.commit()
    return jsonify({"inserted_ids": ids, "invalid_rows": invalid, "duplicates_skipped": duplicates})
