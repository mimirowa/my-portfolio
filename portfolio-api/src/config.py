from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SQLALCHEMY_DATABASE_URI = f"sqlite:///{BASE_DIR}/data/portfolio.db"

# Ensure the parent directory for the SQLite file exists
_db_path = Path(SQLALCHEMY_DATABASE_URI.replace("sqlite:///", ""))
_db_path.parent.mkdir(parents=True, exist_ok=True)
