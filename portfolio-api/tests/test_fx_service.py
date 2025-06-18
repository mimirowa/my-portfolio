from datetime import date

import pytest

from src.services import fx
from src.models.portfolio import FxRate


def test_get_rate_cached(monkeypatch, app):
    with app.app_context():
        rec = FxRate(base="USD", target="SEK", date=date(2024, 1, 1), rate=10.0)
        from src.models.user import db
        db.session.add(rec)
        db.session.commit()

    called = False
    def fail_request(*a, **k):
        nonlocal called
        called = True
        raise AssertionError("should not call provider")
    monkeypatch.setattr(fx, "_fetch_rates", fail_request)

    with app.app_context():
        rate = fx.get_rate(date(2024, 1, 1), "USD", "SEK")
        assert rate == 10.0
        assert not called


def test_get_rate_fetch(monkeypatch, app):
    def fake_fetch(dt, base):
        return {"SEK": 10.5, "EUR": 0.9}
    monkeypatch.setattr(fx, "_fetch_rates", fake_fetch)
    with app.app_context():
        rate = fx.get_rate(date(2024, 1, 1), "USD", "SEK")
        from src.models.user import db
        rows = FxRate.query.filter_by(base="USD", date=date(2024, 1, 1)).all()
        assert len(rows) >= 2
        assert rate == 10.5
        db.session.rollback()


def test_ensure_fx_rates(monkeypatch, app):
    called = []
    def fake_get_rate(dt, base, quote):
        called.append(quote)
        return 1.0
    monkeypatch.setattr(fx, "get_rate", fake_get_rate)
    with app.app_context():
        fx.ensure_fx_rates(date(2024, 1, 1), "USD")
    assert set(called) == set(c for c in fx.SUPPORTED_CCY if c != "USD")
