from datetime import date
from flask import Blueprint, request, jsonify
from src.models.portfolio import ExchangeRate
from src.models.user import db
from src.lib.fx import validate_currency_code

fx_bp = Blueprint('fx', __name__)

@fx_bp.route('/override', methods=['POST'])
def manual_rate():
    data = request.get_json(force=True)
    base = validate_currency_code(data.get('base', ''))
    quote = validate_currency_code(data.get('quote', ''))
    rate = float(data['rate'])
    dt = date.fromisoformat(data['date'])
    rec = ExchangeRate.query.filter_by(base=base, quote=quote, date=dt).first()
    if rec:
        rec.rate = rate
        rec.source = 'manual'
    else:
        db.session.add(
            ExchangeRate(base=base, quote=quote, date=dt, rate=rate, source='manual')
        )
    db.session.commit()
    return jsonify({'date': dt.isoformat(), 'base': base, 'quote': quote, 'rate': rate})
