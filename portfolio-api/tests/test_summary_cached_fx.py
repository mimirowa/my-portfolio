from datetime import date

from src.models.user import db
from src.models.portfolio import Stock, Transaction, ExchangeRate


def test_summary_uses_cached_fx(client, app, monkeypatch):
    with app.app_context():
        stock = Stock(symbol="AAPL")
        db.session.add(stock)
        db.session.add(Transaction(
            stock=stock,
            transaction_type="buy",
            quantity=1,
            price_per_share=100.0,
            currency="EUR",
            transaction_date=date(2025, 5, 14),
        ))
        db.session.add(ExchangeRate(
            base="EUR",
            quote="USD",
            date=date(2025, 5, 14),
            rate=1.1,
        ))
        db.session.commit()

    def fail_fetch(*args, **kwargs):
        raise AssertionError("external FX called")

    monkeypatch.setattr("src.routes.portfolio.get_fx_rate", fail_fetch)
    monkeypatch.setattr("src.services.fx._fetch_rates", fail_fetch)

    resp = client.get("/api/portfolio/summary")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["base_currency"] == "USD"
    assert data["total_cost_basis"] == 110.0
