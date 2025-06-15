from datetime import date
from flask import Blueprint, request, jsonify
from src.models.portfolio import FxRate
from src.models.user import db
from src.lib.fx import validate_currency_code

fx_bp = Blueprint('fx', __name__)

@fx_bp.route('/manual', methods=['POST'])
def manual_rate():
    data = request.get_json(force=True)
    base = validate_currency_code(data.get('base', ''))
    quote = validate_currency_code(data.get('quote', ''))
    rate = float(data['rate'])
    today = date.today()
    rec = FxRate.query.filter_by(base=base, target=quote, date=today).first()
    if rec:
        rec.rate = rate
    else:
        db.session.add(FxRate(base=base, target=quote, date=today, rate=rate))
    db.session.commit()
    return jsonify({'base': base, 'quote': quote, 'rate': rate})
