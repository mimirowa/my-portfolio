from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.portfolio import Stock, Transaction
from datetime import datetime, date
import sys
import os

# Add the API client path
sys.path.append('/opt/.manus/.sandbox-runtime')
from data_api import ApiClient

portfolio_bp = Blueprint('portfolio', __name__)
client = ApiClient()

@portfolio_bp.route('/stocks', methods=['GET'])
def get_all_stocks():
    """Get all stocks in the portfolio with current holdings"""
    try:
        stocks = Stock.query.all()
        portfolio_data = []
        
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
                # Calculate average cost basis
                total_cost = sum(t.quantity * t.price_per_share for t in buy_transactions)
                avg_cost_basis = total_cost / total_bought if total_bought > 0 else 0
                
                # Calculate current value and gains
                current_value = current_quantity * (stock.current_price or 0)
                cost_basis = current_quantity * avg_cost_basis
                total_gain = current_value - cost_basis
                total_gain_percent = (total_gain / cost_basis * 100) if cost_basis > 0 else 0
                
                stock_data = stock.to_dict()
                stock_data.update({
                    'quantity': current_quantity,
                    'avg_cost_basis': round(avg_cost_basis, 2),
                    'current_value': round(current_value, 2),
                    'cost_basis': round(cost_basis, 2),
                    'total_gain': round(total_gain, 2),
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
        
        # Create transaction
        transaction = Transaction(
            stock_id=stock.id,
            transaction_type=data['transaction_type'].lower(),
            quantity=int(data['quantity']),
            price_per_share=float(data['price_per_share']),
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

@portfolio_bp.route('/portfolio/summary', methods=['GET'])
def get_portfolio_summary():
    """Get portfolio summary with total value, gains, etc."""
    try:
        stocks = Stock.query.all()
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
                    cost_basis += shares_to_use * transaction.price_per_share
                    remaining_quantity -= shares_to_use
                
                current_value = current_quantity * (stock.current_price or 0)
                total_value += current_value
                total_cost_basis += cost_basis
                
                portfolio_stocks.append({
                    'symbol': stock.symbol,
                    'quantity': current_quantity,
                    'current_value': current_value,
                    'cost_basis': cost_basis
                })
        
        total_gain = total_value - total_cost_basis
        total_gain_percent = (total_gain / total_cost_basis * 100) if total_cost_basis > 0 else 0
        
        return jsonify({
            'total_value': round(total_value, 2),
            'total_cost_basis': round(total_cost_basis, 2),
            'total_gain': round(total_gain, 2),
            'total_gain_percent': round(total_gain_percent, 2),
            'stocks_count': len(portfolio_stocks),
            'stocks': portfolio_stocks
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@portfolio_bp.route('/stocks/search/<symbol>', methods=['GET'])
def search_stock(symbol):
    """Search for stock information and add to database if not exists"""
    try:
        symbol = symbol.upper()
        
        # Check if stock already exists
        existing_stock = Stock.query.filter_by(symbol=symbol).first()
        if existing_stock:
            return jsonify(existing_stock.to_dict())
        
        # Fetch from Yahoo Finance
        try:
            chart_data = client.call_api('YahooFinance/get_stock_chart', query={
                'symbol': symbol,
                'interval': '1d',
                'range': '1d'
            })
            
            if chart_data and 'chart' in chart_data and 'result' in chart_data['chart']:
                result = chart_data['chart']['result'][0]
                if 'meta' in result:
                    meta = result['meta']
                    current_price = meta.get('regularMarketPrice')
                    company_name = meta.get('longName', meta.get('shortName', ''))
                    
                    # Create new stock entry
                    stock = Stock(
                        symbol=symbol,
                        company_name=company_name,
                        current_price=current_price,
                        last_updated=datetime.utcnow()
                    )
                    
                    db.session.add(stock)
                    db.session.commit()
                    
                    return jsonify(stock.to_dict())
                else:
                    return jsonify({'error': 'Stock data not available'}), 404
            else:
                return jsonify({'error': 'Stock not found'}), 404
                
        except Exception as api_error:
            return jsonify({'error': f'API error: {str(api_error)}'}), 500
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

