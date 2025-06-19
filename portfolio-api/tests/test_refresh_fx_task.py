from datetime import date

def test_refresh_fx_calls_service(monkeypatch):
    called = {}
    def fake_ensure(dt, base):
        called['dt'] = dt
        called['base'] = base
    monkeypatch.setattr('src.services.fx.ensure_fx_rates', fake_ensure)
    monkeypatch.setenv('DATABASE_URL', 'sqlite:///:memory:')
    monkeypatch.setenv('PORTFOLIO_BASE_CCY', 'USD')

    from src.tasks.refresh_fx import refresh_fx
    refresh_fx(date(2024, 1, 2))
    assert called == {'dt': date(2024, 1, 2), 'base': 'USD'}
