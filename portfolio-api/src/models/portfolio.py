from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date
from src.models.user import db
from src.config import PORTFOLIO_BASE_CCY
import enum

BASE_CURRENCY = PORTFOLIO_BASE_CCY

class CurrencyEnum(enum.Enum):
    USD = "USD"
    EUR = "EUR"
    SEK = "SEK"
    GBP = "GBP"
    JPY = "JPY"
    PLN = "PLN"

class Stock(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(10), nullable=False)
    company_name = db.Column(db.String(128), nullable=True)
    current_price = db.Column(db.Float, nullable=True)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship with transactions
    transactions = db.relationship('Transaction', backref='stock', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Stock {self.symbol}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'symbol': self.symbol,
            'company_name': self.company_name,
            'current_price': self.current_price,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    stock_id = db.Column(db.Integer, db.ForeignKey('stock.id'), nullable=False)
    transaction_type = db.Column(db.String(10), nullable=False)  # 'buy' or 'sell'
    quantity = db.Column(db.Integer, nullable=False)
    price_per_share = db.Column(db.Float, nullable=False)
    currency = db.Column(db.Enum(CurrencyEnum), nullable=False, default=BASE_CURRENCY)
    fx_rate = db.Column(db.Float, nullable=False, default=1.0)  # rate to convert to base currency
    transaction_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Transaction {self.transaction_type} {self.quantity} shares of {self.stock.symbol}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'stock_id': self.stock_id,
            'stock_symbol': self.stock.symbol if self.stock else None,
            'transaction_type': self.transaction_type,
            'quantity': self.quantity,
            'price_per_share': self.price_per_share,
            'currency': self.currency.value,
            'fx_rate': self.fx_rate,
            'total_value': self.quantity * self.price_per_share,
            'total_value_base': self.total_value_base,
            'transaction_date': self.transaction_date.isoformat() if self.transaction_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @property
    def total_value(self):
        return self.quantity * self.price_per_share

    @property
    def total_value_base(self):
        return self.quantity * self.price_per_share * self.fx_rate


class PriceCache(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(10), nullable=False)
    price = db.Column(db.Float, nullable=False)
    currency = db.Column(db.Enum(CurrencyEnum), nullable=False, default=BASE_CURRENCY)
    fetched_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<PriceCache {self.symbol} {self.price} {self.currency.value}>"


class FxRate(db.Model):
    __tablename__ = "fx_rates"

    id = db.Column(db.Integer, primary_key=True)
    base = db.Column(db.String(3), nullable=False)
    target = db.Column(db.String(3), nullable=False)
    date = db.Column(db.Date, nullable=False)
    rate = db.Column(db.Float, nullable=False)

    __table_args__ = (db.UniqueConstraint("base", "target", "date", name="uix_fx"),)

    def __repr__(self):
        return f"<FxRate {self.base}->{self.target} {self.date} {self.rate}>"

