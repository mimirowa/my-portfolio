from pathlib import Path
from src.services.providers import stooq


def test_fetch_stooq(monkeypatch):
    sample = Path('portfolio-api/tests/stubs/stooq_cig.csv').read_text()

    def fake_get(url, timeout=10):
        class R:
            text = sample
            def raise_for_status(self):
                pass
        return R()

    monkeypatch.setattr(stooq.requests, 'get', fake_get)

    price = stooq.fetch_quote('CIG.WA')
    assert price == 4.50
