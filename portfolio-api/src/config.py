from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_DIR = BASE_DIR / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
SQLALCHEMY_DATABASE_URI = f"sqlite:///{DB_DIR / 'portfolio.db'}"
SQLALCHEMY_TRACK_MODIFICATIONS = False
