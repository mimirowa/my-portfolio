# Portfolio Tracker

This repository contains a Flask backend (`portfolio-api`) and a React frontend (`portfolio-tracker`).

## Environment Variables

The front-end uses Vite environment variables. Copy `.env.example` in `portfolio-tracker` to `.env` and update the values as needed.

```
VITE_API_URL=http://localhost:5000/api/portfolio
VITE_BASE_CURRENCY=USD
```

`VITE_API_URL` should point to the portfolio API base URL.
`VITE_BASE_CURRENCY` sets the default currency shown in the UI.

## Example setup

Create a virtual environment and install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

The API reads a `SECRET_KEY`, a `DATABASE_URL` and a `BASE_CURRENCY` from the environment. You can
provide them when running the app, e.g.:
```bash
SECRET_KEY=your-secret-key DATABASE_URL=sqlite:///path/to/app.db \
BASE_CURRENCY=USD python portfolio-api/src/main.py
```

If these variables are not set, the app uses default values defined in `main.py`.
`BASE_CURRENCY` defaults to `USD`. When adding transactions in other currencies, the API fetches historical exchange rates. Set `EXCHANGE_API_KEY` if your exchange rate provider requires authentication.

The backend uses a minimal `ApiClient` located in `portfolio-api/src/data_api.py` for fetching stock data. Configure `DATA_API_BASE_URL` and optionally `DATA_API_KEY` if you want to enable live price lookups.

# My Portfolio

This repository contains a Flask API and a React front-end for tracking investment portfolios.

The API stores its data in an SQLite database located at `portfolio-api/src/database/app.db`. This file is created automatically at runtime when the server starts, so it should not be committed to version control.

# Portfolio Tracker

This project combines a Flask-based backend API with a modern React frontend to help track stock investments. It allows you to record buy/sell transactions, fetch current prices, and visualize portfolio performance.

## Features

- Manage stock transactions and holdings
- Update prices from Yahoo Finance
- Overview charts for allocation and performance
- Transaction history with delete confirmation
- Summary cards showing total value and gains

## Technology Stack

**Frontend**

- React 19.1.0
- Vite 6.3.5
- Tailwind CSS 4.1.7
- shadcn/ui
- Recharts 2.15.3
- Lucide React 0.510.0
- PNPM 10 for package management

**Backend**

- Python 3.12
- Flask 3.1.1
- Flask-SQLAlchemy 3.1.1
- SQLAlchemy 2.0
- Flask-CORS 6.0.0
- SQLite

## Directory Structure

```
my-portfolio/
├── portfolio-api/        # Flask backend
│   ├── requirements.txt
│   └── src/
│       ├── main.py       # Application entry
│       ├── models/       # SQLAlchemy models
│       ├── routes/       # API routes
│       └── static/       # Built frontend output
├── portfolio-tracker/    # React frontend (Vite)
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── requirements.txt      # Points to backend requirements
```

## Backend Setup

```bash
cd portfolio-api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python src/main.py
```

The API will start on `http://localhost:5000`.

## Frontend Setup

```bash
cd portfolio-tracker
pnpm install
pnpm run dev
```

The app will be available at the printed Vite dev server address (usually `http://localhost:5173`).

## Key API Endpoints

| Method & Path | Description |
|---------------|-------------|
| `GET /api/users` | List all users |
| `POST /api/users` | Create a new user |
| `GET /api/users/<id>` | Get a specific user |
| `PUT /api/users/<id>` | Update a user |
| `DELETE /api/users/<id>` | Delete a user |
| `GET /api/portfolio/stocks` | Get all portfolio stocks |
| `GET /api/portfolio/stocks/<symbol>` | Get stock details |
| `POST /api/portfolio/stocks/<symbol>/price` | Refresh a stock price |
| `GET /api/portfolio/transactions` | List all transactions |
| `POST /api/portfolio/transactions` | Add a transaction |
| `DELETE /api/portfolio/transactions/<id>` | Delete a transaction |
| `GET /api/portfolio/summary` | Portfolio summary totals |
| `GET /api/portfolio/stocks/search/<symbol>` | Search and add a stock |

### User Management Endpoints

| Method & Path | Description |
|---------------|-------------|
| `GET /api/users` | List all users |
| `POST /api/users` | Create a new user |
| `GET /api/users/<id>` | Retrieve a user by id |
| `PUT /api/users/<id>` | Update user details |
| `DELETE /api/users/<id>` | Remove a user |

The HTML page used for quick testing of these endpoints has been moved to
`docs/examples/user-api-demo.html`.

## Usage

1. Start the backend and frontend using the steps above.
2. Use the web interface to add transactions (choose a currency for each entry) and view holdings.
3. Call the API directly (e.g., using `curl` or Postman) to integrate with other tools.
4. Update prices periodically using the "Update Prices" button or the corresponding API endpoint.

## Running Tests

Install the test requirements and run pytest:

```bash
pip install -r requirements-dev.txt
pytest
```

## License

This project is licensed under the [MIT License](LICENSE).

Happy investing!

