import re
import unicodedata
from datetime import datetime
from typing import Tuple, List

from src.services.google_finance import _parse_number

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

ACTION_MAP = {
    "sälj": "sale",
    "köp": "purchase",
    "utdelning": "dividend",
    "utdelning värdepapper": "dividend",
    "utlåningsränta": "interest",
    "inlåningsränta": "interest",
}

SKIP_TERMS = ["kreditsettling", "överföring", "intern överföring"]


def _clean_ticker(text: str) -> str:
    text = text.strip()
    norm = unicodedata.normalize("NFKD", text)
    return "".join(c for c in norm if not unicodedata.combining(c))


def detect_avanza_text(raw: str) -> bool:
    if "Genomförda transaktioner" not in raw:
        return False
    for line in raw.splitlines():
        if DATE_RE.match(line.strip()):
            return True
    return False


def _parse_block(lines: List[str]):
    if len(lines) < 5:
        return None
    date = lines[0]
    nota = lines[1]  # unused
    action_raw = lines[2]
    rest = lines[3:]

    # action may contain tab-separated description
    action = action_raw.split("\t")[0].strip().lower()
    if any(term in action for term in SKIP_TERMS):
        return None
    action_key = ACTION_MAP.get(action, action)

    # remove blank tokens
    tokens = [t.strip() for t in rest if t.strip()]
    if len(tokens) < 3:
        return None
    shares_token = tokens[-3]
    price_token = tokens[-2]
    amount_token = tokens[-1]
    ticker = " ".join(tokens[:-3])

    shares = _parse_number(shares_token.replace("−", "-"))
    price = _parse_number(price_token.replace("−", "-"))
    amount = _parse_number(amount_token.replace("−", "-"))

    try:
        date_obj = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        return None

    row = {
        "ticker": _clean_ticker(ticker),
        "action": action_key,
        "date": date_obj.isoformat(),
        "shares": shares,
        "price": price,
        "amount": amount,
        "currency": "SEK",
        "fee_amount": None,
    }
    return row


def parse_avanza_text(raw: str) -> Tuple[List[dict], List[str]]:
    lines = [ln.strip() for ln in raw.splitlines()]
    # drop header lines
    while lines and not DATE_RE.match(lines[0]):
        lines.pop(0)
    blocks = []
    current: List[str] = []
    for ln in lines:
        if DATE_RE.match(ln):
            if current:
                blocks.append(current)
                current = []
            current.append(ln)
        else:
            current.append(ln)
    if current:
        blocks.append(current)

    rows = []
    invalid = []
    for blk in blocks:
        if any(term in blk[2].lower() for term in SKIP_TERMS if len(blk) > 2):
            continue
        row = _parse_block(blk)
        if row:
            rows.append(row)
        else:
            invalid.append(" ".join(blk))
    return rows, invalid
