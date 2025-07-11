# Portfolio Tracker

This repository contains a Flask backend (`portfolio-api`) and a React frontend (`portfolio-tracker`).

## Environment Variables

The front-end uses Vite environment variables. Copy `.env.local.example` in `portfolio-tracker` to `.env.local` and update the values as needed.

```
VITE_PORTFOLIO_API=http://localhost:8000/api/portfolio
VITE_IMPORT_API=http://localhost:8000/api/import
VITE_BASE_CURRENCY=USD
```

`VITE_PORTFOLIO_API` should point to the portfolio API base URL.
`VITE_IMPORT_API` is used for bulk import endpoints.
`VITE_BASE_CURRENCY` sets the default currency shown in the UI.

### Backend `.env`

The Flask API loads environment variables from a `.env` file in the repository
root. Copy `.env.example` to `.env` and fill in any required keys:

```
ALPHAVANTAGE_API_KEY=your-alpha-key
PORTFOLIO_BASE_CCY=USD
FALLBACK_PROVIDER=stooq
FX_PROVIDER_URL=https://api.exchangerate.host
FX_API_KEY=
DATA_API_BASE_URL=
DATA_API_KEY=
```

`ALPHAVANTAGE_API_KEY` enables live quotes from Alpha Vantage. If omitted the
API relies solely on Manus API Hub and Stooq for prices. `FX_PROVIDER_URL` and
`FX_API_KEY` configure the foreign exchange rates provider. `DATA_API_BASE_URL`
and `DATA_API_KEY` point the helper `ApiClient` to an external data source.
`FALLBACK_PROVIDER` chooses the backup quote service when the primary lookup
fails. All of these values can also be set directly in the environment instead
of the `.env` file.

## Getting Started

This project requires **Node.js 20** and **Python 3.11+**.

```bash
# frontend
cd portfolio-tracker && cp .env.local.example .env.local && npm install && npm run dev

# backend
cd ../portfolio-api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# start the API from the portfolio-api directory (dev only)
flask run --reload
```

If you prefer running from the repository root set `FLASK_APP` to the backend path:

```bash
FLASK_APP=portfolio-api/src/main.py flask run --reload
```

### Production build

To serve the React app from the Flask backend you need to create a production
build. Run the following inside `portfolio-tracker`:

```bash
pnpm run build
```

After building, start the API with Gunicorn:

```bash
gunicorn -b 0.0.0.0:8000 "src.main:create_app()"
```

Because the compiled assets aren't tracked in Git, be sure to run the build
whenever you set up the backend or deploy the app. The output is placed under
`portfolio-api/src/static` and served by Flask.

The compiled files will be written to `portfolio-api/src/static` and served by
Flask at the root URL.

Each build stamps the current commit hash into the app. The footer will display
the version like `v4e96b97` corresponding to the commit used for the build.

The API reads optional environment variables like `SECRET_KEY`, `DATABASE_URL` and `PORTFOLIO_BASE_CCY`. Default values are provided so it will start without extra configuration. Historical price lookups use the minimal `ApiClient` in `portfolio-api/src/data_api.py`. To enable live quote lookups via Alpha Vantage set `ALPHAVANTAGE_API_KEY`.

### Data Providers

Historical prices and company lookups come from Manus API Hub (Yahoo Finance).
When `ALPHAVANTAGE_API_KEY` is set the API will query Alpha Vantage for live
quotes. If a symbol is not available there, it falls back to [Stooq](https://stooq.com).
Set `FALLBACK_PROVIDER=stooq` in your `.env` to enable this behaviour.

This project combines a Flask-based backend API with a modern React frontend to help track stock investments. It allows you to record buy/sell transactions, fetch current prices, and visualize portfolio performance.

The API stores its data in an SQLite database located at `portfolio-api/data/portfolio.db`. This folder is created automatically when the server starts, so it should not be committed to version control.

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

The API will start on `http://localhost:8000`.

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
| `POST /api/portfolio/prices/update?symbol=<symbol>` | Update cached price |
| `GET /api/portfolio/transactions` | List all transactions |
| `POST /api/portfolio/transactions` | Add a transaction |
| `DELETE /api/portfolio/transactions/<id>` | Delete a transaction |
| `GET /api/portfolio/summary` | Portfolio summary totals |
| | Returns `total_fees_paid` and `net_gain_after_fees` fields |
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
5. Refresh foreign exchange rates daily by running `python -m src.tasks.refresh_fx` in a scheduled job.

## Import trades

Paste your Google Finance activity text directly into the app.
Open the **Import ▸ Google Finance** dialog on the Transactions page, preview the
parsed rows and confirm to save them. Save the confirmed rows to your portfolio
with the **Confirm & Save** button.

### Deploying on Raspberry Pi

Copy the systemd unit and enable the service:

```bash
sudo cp deploy/portfolio-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now portfolio-api
```

## Running Tests

Install the test requirements and run pytest:

```bash
pip install -r requirements-dev.txt
pytest
```

## License

This project is licensed under the [MIT License](LICENSE).

Happy investing!

