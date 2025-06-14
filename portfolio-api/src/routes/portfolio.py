from flask import Blueprint, request, jsonify, abort, current_app
from werkzeug.exceptions import HTTPException
from src.models.user import db
from src.models.portfolio import (
    Stock,
    Transaction,
    CurrencyEnum,
    PriceCache,
    BASE_CURRENCY,
)
from src.config import PORTFOLIO_BASE_CCY
from src.lib.fx import get_fx_rate
import requests
from datetime import datetime, date, timedelta
import os

from src.data_api import ApiClient
from src.services.market_data import fetch_quote, QuoteAPIError

portfolio_bp = Blueprint('portfolio', __name__)
client = ApiClient()

# Return JSON for not found errors within this blueprint
@portfolio_bp.errorhandler(404)
def not_found(e):
    return jsonify(message=getattr(e, "description", "Not Found")), 404

@portfolio_bp.route('/stocks', methods=['GET'])
def get_all_stocks():
    """Get all stocks in the portfolio with current holdings"""
    try:
        env_base = os.environ.get('BASE_CURRENCY', BASE_CURRENCY)
        requested_base = request.args.get('base', env_base).upper()
        rate = 1.0
        if requested_base != env_base:
            try:
                resp = requests.get(
                    "https://api.exchangerate.host/latest",
                    params={"base": env_base, "symbols": requested_base},
                    timeout=10,
                )
                rate = resp.json()["rates"][requested_base]
            except Exception:
                rate = 1.0

        stocks = Stock.query.all()
        portfolio_data = []
        
        base_currency = os.environ.get("PORTFOLIO_BASE_CCY", PORTFOLIO_BASE_CCY)

        for stock in stocks:
            # Calculate current holdings
            buy_transactions = Transaction.query.filter_by(
                stock_id=stock.id, 
                transaction_type='buy'
            ).all()
            sell_transactions = Transaction.query.filter_by(
                stock_id=stock.id, 
                transaction_type='sell'
            ).all()
            
            total_bought = sum(t.quantity for t in buy_transactions)
            total_sold = sum(t.quantity for t in sell_transactions)
            current_quantity = total_bought - total_sold
            
            if current_quantity > 0:  # Only include stocks we currently own
                # Determine transaction currency (use first buy)
                tx_currency = buy_transactions[0].currency.value if buy_transactions else env_base
                # Calculate average cost basis
                total_cost = sum(
                    t.quantity
                    * t.price_per_share
                    * get_fx_rate(t.currency.value, base_currency, t.transaction_date)
                    for t in buy_transactions
                )
                avg_cost_basis = total_cost / total_bought if total_bought > 0 else 0
                total_cost_orig = sum(t.quantity * t.price_per_share for t in buy_transactions if t.currency.value == tx_currency)
                
                # Calculate current value and gains
                current_value = current_quantity * (stock.current_price or 0)
                cost_basis = current_quantity * avg_cost_basis
                total_gain = current_value - cost_basis
                total_gain_percent = (total_gain / cost_basis * 100) if cost_basis > 0 else 0
                
                stock_data = stock.to_dict()
                stock_data.update({
                    'quantity': current_quantity,
                    'avg_cost_basis': round(avg_cost_basis * rate, 2),
                    'avg_cost_original': round(total_cost_orig / total_bought, 2) if total_bought > 0 else 0,
                    'transaction_currency': tx_currency,
                    'current_price': round((stock.current_price or 0) * rate, 2) if stock.current_price else None,
                    'current_value': round(current_value * rate, 2),
                    'cost_basis': round(cost_basis * rate, 2),
                    'total_gain': round(total_gain * rate, 2),
                    'total_gain_percent': round(total_gain_percent, 2)
                })
                portfolio_data.append(stock_data)
        
        return jsonify(portfolio_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@portfolio_bp.route('/stocks/<symbol>', methods=['GET'])
def get_stock(symbol):
    """Get a specific stock by symbol"""
    try:
        stock = Stock.query.filter_by(symbol=symbol.upper()).first()
        if not stock:
            return jsonify({'error': 'Stock not found'}), 404
        return jsonify(stock.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@portfolio_bp.route('/stocks/<symbol>/price', methods=['POST'])
def update_stock_price(symbol):
    """Update stock price from Yahoo Finance API"""
    try:
        stock = Stock.query.filter_by(symbol=symbol.upper()).first()
        if not stock:
            return jsonify({'error': 'Stock not found'}), 404
        
        # Fetch current price from Yahoo Finance
        try:
            chart_data = client.call_api('YahooFinance/get_stock_chart', query={
                'symbol': symbol.upper(),
                'interval': '1d',
                'range': '1d'
            })
            
            if chart_data and 'chart' in chart_data and 'result' in chart_data['chart']:
                result = chart_data['chart']['result'][0]
                if 'meta' in result and 'regularMarketPrice' in result['meta']:
                    current_price = result['meta']['regularMarketPrice']
                    company_name = result['meta'].get('longName', result['meta'].get('shortName', ''))
                    
                    stock.current_price = current_price
                    stock.company_name = company_name
                    stock.last_updated = datetime.utcnow()
                    db.session.commit()
                    
                    return jsonify({
                        'symbol': stock.symbol,
                        'current_price': current_price,
                        'company_name': company_name,
                        'last_updated': stock.last_updated.isoformat()
                    })
                else:
                    return jsonify({'error': 'Price data not available'}), 400
            else:
                return jsonify({'error': 'Failed to fetch price data'}), 400
                
        except Exception as api_error:
            return jsonify({'error': f'API error: {str(api_error)}'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@portfolio_bp.route('/prices/refresh', methods=['POST'])
def refresh_prices():
    """Refresh prices for all known tickers using AlphaVantage."""
    symbols = [s.symbol for s in Stock.query.distinct(Stock.symbol)]
    base_currency = os.environ.get('BASE_CURRENCY', BASE_CURRENCY)
    updated = 0
    failed = []
    for symbol in symbols:
        try:
            price = fetch_quote(symbol)
        except QuoteAPIError:
            price = None
        if price is None:
            failed.append(symbol)
            continue
        stock = Stock.query.filter_by(symbol=symbol).first()
        stock.current_price = price
        stock.last_updated = datetime.utcnow()
        db.session.add(
            PriceCache(
                symbol=symbol,
                price=price,
                currency=CurrencyEnum[base_currency]
            )
        )
        updated += 1
    db.session.commit()
    return jsonify({"updated": updated, "failed": failed})

@portfolio_bp.route('/transactions', methods=['GET'])
def get_transactions():
    """Get all transactions"""
    try:
        transactions = Transaction.query.order_by(Transaction.transaction_date.desc()).all()
        return jsonify([t.to_dict() for t in transactions])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@portfolio_bp.route('/transactions', methods=['POST'])
def add_transaction():
    """Add a new transaction"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['symbol', 'transaction_type', 'quantity', 'price_per_share', 'transaction_date']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        symbol = data['symbol'].upper()

        base_currency = os.environ.get('PORTFOLIO_BASE_CCY', PORTFOLIO_BASE_CCY)
        currency = data.get('currency', base_currency).upper()
        if currency not in CurrencyEnum.__members__:
            return jsonify({'error': 'Unsupported currency'}), 400

        # Get or create stock
        stock = Stock.query.filter_by(symbol=symbol).first()
        if not stock:
            stock = Stock(symbol=symbol)
            db.session.add(stock)
            db.session.flush()  # Get the ID
        
        # Parse transaction date
        try:
            transaction_date = datetime.strptime(data['transaction_date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        fx_rate = 1.0
        if currency != base_currency:
            try:
                fx_rate = get_fx_rate(currency, base_currency, transaction_date)
            except Exception:
                return jsonify({'error': 'Failed to fetch FX rate'}), 500

        transaction = Transaction(
            stock_id=stock.id,
            transaction_type=data['transaction_type'].lower(),
            quantity=int(data['quantity']),
            price_per_share=float(data['price_per_share']),
            currency=CurrencyEnum[currency],
            fx_rate=fx_rate,
            transaction_date=transaction_date
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify(transaction.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@portfolio_bp.route('/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    """Delete a transaction"""
    try:
        transaction = Transaction.query.get(transaction_id)
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        db.session.delete(transaction)
        db.session.commit()
        
        return jsonify({'message': 'Transaction deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@portfolio_bp.route('/summary', methods=['GET'])
def get_portfolio_summary():
    """Get portfolio summary with total value, gains, etc."""
    try:
        env_base = os.environ.get('BASE_CURRENCY', BASE_CURRENCY)
        requested_base = request.args.get('base', env_base).upper()
        rate = 1.0
        if requested_base != env_base:
            try:
                resp = requests.get(
                    "https://api.exchangerate.host/latest",
                    params={"base": env_base, "symbols": requested_base},
                    timeout=10,
                )
                rate = resp.json()["rates"][requested_base]
            except Exception:
                rate = 1.0

        stocks = Stock.query.all()
        base_currency = os.environ.get("PORTFOLIO_BASE_CCY", PORTFOLIO_BASE_CCY)
        total_value = 0
        total_cost_basis = 0
        portfolio_stocks = []
        
        for stock in stocks:
            # Calculate current holdings
            buy_transactions = Transaction.query.filter_by(
                stock_id=stock.id, 
                transaction_type='buy'
            ).all()
            sell_transactions = Transaction.query.filter_by(
                stock_id=stock.id, 
                transaction_type='sell'
            ).all()
            
            total_bought = sum(t.quantity for t in buy_transactions)
            total_sold = sum(t.quantity for t in sell_transactions)
            current_quantity = total_bought - total_sold
            
            if current_quantity > 0:  # Only include stocks we currently own
                # Calculate cost basis for current holdings
                remaining_quantity = current_quantity
                cost_basis = 0
                
                # FIFO method for cost basis calculation
                for transaction in sorted(buy_transactions, key=lambda x: x.transaction_date):
                    if remaining_quantity <= 0:
                        break
                    
                    shares_to_use = min(remaining_quantity, transaction.quantity)
                    cost_basis += (
                        shares_to_use
                        * transaction.price_per_share
                        * get_fx_rate(
                            transaction.currency.value,
                            base_currency,
                            transaction.transaction_date,
                        )
                    )
                    remaining_quantity -= shares_to_use
                
                current_value = current_quantity * (stock.current_price or 0)
                total_value += current_value
                total_cost_basis += cost_basis

                portfolio_stocks.append({
                    'symbol': stock.symbol,
                    'quantity': current_quantity,
                    'current_value': round(current_value * rate, 2),
                    'cost_basis': round(cost_basis * rate, 2)
                })
        
        total_gain = total_value - total_cost_basis
        total_gain_percent = (total_gain / total_cost_basis * 100) if total_cost_basis > 0 else 0

        return jsonify({
            'base_currency': requested_base,
            'total_value': round(total_value * rate, 2),
            'total_cost_basis': round(total_cost_basis * rate, 2),
            'total_gain': round(total_gain * rate, 2),
            'total_gain_percent': round(total_gain_percent, 2),
            'stocks_count': len(portfolio_stocks),
            'stocks': portfolio_stocks
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@portfolio_bp.route('/stocks/search/<symbol>', methods=['GET'])
def search_stock(symbol):
    """Return stock details or lookup current price for unknown symbols."""
    try:
        stock = Stock.query.filter_by(symbol=symbol.upper()).first()
        if stock:
            return jsonify(stock.to_dict()), 200

        price = fetch_quote(symbol)
        if price is None:
            abort(404, description="symbol not found")

        return jsonify({"symbol": symbol.upper(), "price": price}), 200

    except QuoteAPIError as exc:
        current_app.logger.exception(exc)
        return jsonify(error="quote service down"), 502


@portfolio_bp.route('/history', methods=['GET'])
def get_portfolio_history():
    """Return portfolio value history."""
    try:
        transactions = Transaction.query.order_by(Transaction.transaction_date).all()
        if not transactions:
            return jsonify([])

        start_param = request.args.get('start')
        end_param = request.args.get('end')

        start_date = transactions[0].transaction_date
        if start_param:
            start_date = datetime.strptime(start_param, '%Y-%m-%d').date()

        end_date = date.today()
        if end_param:
            end_date = datetime.strptime(end_param, '%Y-%m-%d').date()

        if start_date > end_date:
            return jsonify({'error': 'start date must be before end date'}), 400

        base_currency = os.environ.get("PORTFOLIO_BASE_CCY", PORTFOLIO_BASE_CCY)
        stocks = {stock.id: stock for stock in Stock.query.all()}

        history = []
        holdings = {sid: 0 for sid in stocks}
        contributions = 0.0

        idx = 0
        current = start_date
        while current <= end_date:
            while idx < len(transactions) and transactions[idx].transaction_date <= current:
                t = transactions[idx]
                if t.transaction_type == 'buy':
                    holdings[t.stock_id] = holdings.get(t.stock_id, 0) + t.quantity
                    contributions += (
                        t.quantity
                        * t.price_per_share
                        * get_fx_rate(t.currency.value, base_currency, t.transaction_date)
                    )
                else:
                    holdings[t.stock_id] = holdings.get(t.stock_id, 0) - t.quantity
                    contributions -= (
                        t.quantity
                        * t.price_per_share
                        * get_fx_rate(t.currency.value, base_currency, t.transaction_date)
                    )
                idx += 1

            market_value = 0.0
            for sid, qty in holdings.items():
                if qty:
                    price = stocks[sid].current_price or 0
                    market_value += qty * price

            history.append({
                'date': current.isoformat(),
                'market_value_only': round(market_value - contributions, 2),
                'with_contributions': round(market_value, 2)
            })

            current += timedelta(days=1)

        return jsonify(history)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

