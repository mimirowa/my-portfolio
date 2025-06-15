from datetime import datetime
from flask import Blueprint, request, jsonify
from src.models.portfolio import Stock, Transaction, CurrencyEnum
from src.models.user import db
from src.services.google_finance import parse_raw

import_bp = Blueprint('import', __name__)


@import_bp.route('/google-finance/preview', methods=['POST'])
def google_finance_preview():
    data = request.get_json(force=True)
    raw = data.get('raw', '')
    rows, invalid = parse_raw(raw)
    return jsonify({"rows": rows, "invalid_rows": invalid})


@import_bp.route('/google-finance', methods=['POST'])
def google_finance_import():
    data = request.get_json(force=True)
    raw = data.get('raw', '')
    rows, invalid = parse_raw(raw)
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
        currency_key = row.get('currency', 'USD')
        if currency_key not in CurrencyEnum.__members__:
            currency_key = 'USD'
        tx = Transaction(
            stock_id=stock.id,
            transaction_type=side,
            quantity=int(row['shares']),
            price_per_share=float(row['price']),
            currency=CurrencyEnum[currency_key],
            fx_rate=1.0,
            fee_amount=row.get('fee_amount'),
            fee_currency=row.get('fee_currency'),
            deal_amount=row.get('deal_amount'),
            deal_currency=row.get('deal_currency'),
            transaction_date=date_obj,
        )
        db.session.add(tx)
        db.session.flush()
        ids.append(tx.id)
    db.session.commit()
    return jsonify({"inserted_ids": ids, "invalid_rows": invalid, "duplicates_skipped": duplicates})
