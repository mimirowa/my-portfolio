#!/usr/bin/env bash
set -e

# Change to the backend directory
cd "$(dirname "$0")/portfolio-api"

# Prevent starting duplicate workers
if pgrep -f "gunicorn.*src.main:create_app" >/dev/null; then
  echo "Gunicorn already running"
  exit 0
fi

# Create virtual environment if needed
if [ ! -d venv ]; then
  python3 -m venv venv
fi
source venv/bin/activate

# Upgrade pip safely
python -m pip install -U pip > /dev/null

# Install requirements only when packages are outdated or on first run
if [ ! -f venv/.deps_installed ] || pip list --outdated --format=columns | grep -q .; then
  pip install -r requirements.txt
  touch venv/.deps_installed
fi

exec gunicorn -w 2 -b 0.0.0.0:${PORT:=8000} "src.main:create_app()"
