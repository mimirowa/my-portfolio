# Portfolio Tracker

This repository contains a Flask backend (`portfolio-api`) and a React frontend (`portfolio-tracker`).

## Example setup

Create a virtual environment and install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

The API reads a `SECRET_KEY` and a `DATABASE_URL` from the environment. You can provide them when running the app, e.g.:

```bash
SECRET_KEY=your-secret-key DATABASE_URL=sqlite:///path/to/app.db python portfolio-api/src/main.py
```

If these variables are not set, the app uses default values defined in `main.py`.
