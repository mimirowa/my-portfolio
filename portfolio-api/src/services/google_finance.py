import re
from datetime import datetime

HEADER_RE = re.compile(r"^(?P<ticker>\S+)\s+(?P<action>purchase|sale)$", re.I)
DETAIL_RE = re.compile(
    "(?P<shares>[\\d.,\\u202f ]+) shares (?:@|at) (?P<symbol>[€$]?)(?P<price>[\\d.,\\u202f ]+)",
    re.I,
)
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
    date_m = DATE_RE.search(detail)
    if not date_m:
        return None
    rest = detail[date_m.end():]
    m_detail = DETAIL_RE.search(rest)
    if not m_detail:
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
    cleaned: list[str] = []
    skip_extra = 0
    for ln in lines:
        stripped = ln.replace("\u202f", "").strip()
        if not stripped or stripped == "universal_currency_alt":
            continue
        if skip_extra:
            skip_extra -= 1
            continue
        if stripped in ("Gain", "Returns"):
            # skip this line and the following two summary lines
            skip_extra = 2
            continue
        cleaned.append(stripped)

    groups: list[list[str]] = []
    current: list[str] = []
    skip = 0
    i = 0
    while i < len(cleaned):
        ln = cleaned[i]
        if skip:
            skip -= 1
            i += 1
            continue
        if HEADER_RE.match(ln):
            if current:
                groups.append(current)
                current = []
            current.append(ln)
            if i + 2 < len(cleaned):
                current.append(cleaned[i + 1])
                current.append(cleaned[i + 2])
                skip = 2
            i += 1
            continue
        current.append(ln)
        i += 1
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


def parse_google_finance_import(raw: str):
    rows, invalid_rows = parse_raw(raw)
    print("INVALID:", invalid_rows, flush=True)
    return rows, invalid_rows
