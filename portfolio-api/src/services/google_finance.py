import re
from datetime import datetime

HEADER_RE = re.compile(r"^(?P<ticker>\S+)\s+(?P<action>purchase|sale)$", re.I)
DETAIL_RE = re.compile(r"(?P<shares>\d+(?:[.,]\d+)?) shares (?:@|at) (?P<symbol>[€$]?)(?P<price>\d+(?:[.,]\d+)?)", re.I)
DATE_RE = re.compile(r"(?P<date>\d{1,2}/\d{1,2}/\d{4})")


def _parse_number(text: str) -> float | None:
    clean = text.replace("\u202f", "").replace(" ", "")
    clean = clean.replace("€", "").replace("$", "")
    if clean.count(",") > 0 and clean.count(".") > 0:
        if clean.rfind(",") > clean.rfind("."):
            clean = clean.replace(".", "").replace(",", ".")
        else:
            clean = clean.replace(",", "")
    elif clean.count(",") > 0:
        clean = clean.replace(",", ".")
    try:
        return float(clean)
    except ValueError:
        return None


def _parse_group(lines: list[str]):
    if len(lines) < 3:
        return None
    m_header = HEADER_RE.match(lines[0])
    if not m_header:
        return None
    detail = lines[2]
    m_detail = DETAIL_RE.search(detail)
    date_m = DATE_RE.search(detail)
    if not (m_detail and date_m):
        return None
    shares = _parse_number(m_detail.group("shares"))
    price = _parse_number(m_detail.group("price"))
    symbol = m_detail.group("symbol") or lines[1].strip()[:1]
    if symbol not in ("$", "€"):
        symbol = "$"
    try:
        date = datetime.strptime(date_m.group("date"), "%d/%m/%Y").date()
    except ValueError:
        return None
    row = {
        "ticker": m_header.group("ticker").upper(),
        "action": m_header.group("action").lower(),
        "date": date.isoformat(),
        "shares": shares,
        "price": price,
        "amount": round((shares or 0) * (price or 0), 2),
        "currency": symbol,
    }
    if None in row.values():
        return None
    return row


def parse_raw(raw: str):
    lines = raw.splitlines()
    groups: list[list[str]] = []
    current: list[str] = []
    for ln in lines:
        stripped = ln.strip()
        if not stripped or stripped == "universal_currency_alt":
            if current:
                groups.append(current)
                current = []
            continue
        current.append(stripped)
    if current:
        groups.append(current)

    rows = []
    invalid = []
    for g in groups:
        row = _parse_group(g)
        if row:
            rows.append(row)
        else:
            if g:
                invalid.append(g[0])
    return rows, invalid
