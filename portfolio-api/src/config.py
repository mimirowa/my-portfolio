from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent
DB_DIR = BASE_DIR / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
SQLALCHEMY_DATABASE_URI = f"sqlite:///{DB_DIR / 'portfolio.db'}"
SQLALCHEMY_TRACK_MODIFICATIONS = False

# Preferred currency used when reporting portfolio totals. Falls back to
# legacy BASE_CURRENCY if set for backwards compatibility.
PORTFOLIO_BASE_CCY = os.environ.get(
    "PORTFOLIO_BASE_CCY",
    os.environ.get("BASE_CURRENCY", "USD"),
)
