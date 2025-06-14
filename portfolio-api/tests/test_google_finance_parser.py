import textwrap
from src.services.google_finance import parse_raw

SAMPLE = textwrap.dedent("""
SMCI sale
€1,080.82
27/05/2025 · 26 shares at €41.57
Gain
9.39%, +92.82
Invested 85 days
universal_currency_alt
GOOG purchase
€6,720.00
14/05/2025 · 42 shares at €160.00
MSFT sale
€2,246.25
13/05/2025 · 5 shares at €449.25
Gain
17.09%, +327.90
Invested 53 days
MSFT sale
€2,245.70
13/05/2025 · 5 shares at €449.14
Gain
10.04%, +204.95
Invested 78 days
MSFT sale
€2,245.70
13/05/2025 · 5 shares at €449.14
Gain
9.99%, +204.00
Invested 90 days
universal_currency_alt
AMZN purchase
€2,805.00
25/04/2025 · 15 shares at €187.00
TSLA sale
€895.04
07/04/2025 · 4 shares at €223.76
Returns
33.70%, -454.96
Invested 42 days
TSLA sale
€1,342.56
07/04/2025 · 6 shares at €223.76
Returns
37.15%, -793.44
Invested 56 days
universal_currency_alt
GOOG purchase
€5,917.08
07/04/2025 · 39 shares at €151.72
UBI sale
€5,835.00
31/03/2025 · 500 shares at €11.67
Gain
7.56%, +410.00
Invested 46 days
universal_currency_alt
MSFT purchase
€1,918.35
21/03/2025 · 5 shares at €383.67
universal_currency_alt
GOOG purchase
€1,612.80
21/03/2025 · 10 shares at €161.28
universal_currency_alt
NVDA purchase
€4,836.30
12/03/2025 · 42 shares at €115.15
universal_currency_alt
SMCI purchase
€988.00
03/03/2025 · 26 shares at €38.00
universal_currency_alt
NVDA purchase
€8,845.50
28/02/2025 · 75 shares at €117.94
universal_currency_alt
TSLA purchase
€1,350.00
24/02/2025 · 4 shares at €337.50
universal_currency_alt
NVDA purchase
€1,350.00
24/02/2025 · 10 shares at €135.00
universal_currency_alt
MSFT purchase
€2,040.75
24/02/2025 · 5 shares at €408.15
universal_currency_alt
GOOG purchase
€1,796.50
24/02/2025 · 10 shares at €179.65
universal_currency_alt
UBI purchase
€5,425.00
13/02/2025 · 500 shares at €10.85
universal_currency_alt
UBER purchase
€2,226.00
12/02/2025 · 28 shares at €79.50
universal_currency_alt
NVDA purchase
€13,115.00
12/02/2025 · 100 shares at €131.15
universal_currency_alt
MSFT purchase
€2,041.70
12/02/2025 · 5 shares at €408.34
universal_currency_alt
AMZN purchase
€2,301.40
12/02/2025 · 10 shares at €230.14
universal_currency_alt
GOOG purchase
€2,204.76
12/02/2025 · 12 shares at €183.73
universal_currency_alt
TSLA purchase
€2,136.00
10/02/2025 · 6 shares at €356.00
""")


def test_parse_activity_sample():
    rows, invalid = parse_raw(SAMPLE)
    assert not invalid
    assert len(rows) == 20
    first = rows[0]
    assert first["ticker"] == "SMCI"
    assert first["action"] == "sale"
    assert first["currency"] == "€"
    assert first["shares"] == 26
    assert first["price"] == 41.57
    assert first["date"] == "2025-05-27"
