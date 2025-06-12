# Portfolio Tracker - Personal Investment Management System

A comprehensive portfolio tracking website similar to Google Finance that allows you to manage your stock investments, track performance, and analyze your portfolio.

---

## Features

### \ud83d\udcca Portfolio Management

* Track stock holdings with purchase details (date, price, quantity)
* Add buy/sell transactions with automatic cost basis calculation
* Real-time stock price updates via Yahoo Finance API
* FIFO (First In, First Out) cost basis calculation

### \ud83d\udcc8 Analytics & Reporting

* Portfolio overview with total value and gains/losses
* Individual stock performance tracking
* Day gain and total gain calculations
* Portfolio allocation visualization (pie charts)
* Performance analysis (bar charts)
* Top performers ranking

### \ud83c\udfa8 User Interface

* Clean, modern design inspired by Google Finance
* Responsive layout for desktop and mobile devices
* Interactive charts and data visualizations
* Tabbed interface (Overview, Holdings, Transactions)
* Modal dialogs for adding transactions
* Stock search with auto-complete

---

## Technology Stack

### Frontend

* React 19.1.0
* Tailwind CSS 4.1.7
* shadcn/ui
* Recharts 2.15.3
* Lucide React 0.510.0
* Vite 6.3.5
* PNPM 10

### Backend

* Flask 3.1.1
* SQLAlchemy 2.0
* SQLite
* Flask-CORS 6.0.0
* Yahoo Finance API
* Python 3.12

---

## Installation & Setup

### Prerequisites

* Node.js 18+ and pnpm
* Python 3.12+ and pip
* Git

### Backend Setup

```bash
cd portfolio-api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python src/main.py  # Backend runs on http://localhost:5000
```

### Frontend Setup

```bash
cd portfolio-tracker
pnpm install
pnpm run dev  # Frontend runs on http://localhost:5173
```

---

## Usage Guide

### Adding Your First Transaction

1. Click "Add Transaction"
2. Enter stock symbol (e.g., AAPL, GOOGL, MSFT)
3. Click search to fetch current info
4. Select transaction type (Buy/Sell)
5. Choose currency (USD, EUR, SEK, GBP, JPY)
6. Enter quantity and price
7. Set date
8. Click "Add Transaction"

### Viewing Portfolio Performance

* **Overview Tab**: Allocation charts and top performers
* **Holdings Tab**: Stock positions
* **Transactions Tab**: Full transaction history

### Updating Stock Prices

* Click "Update Prices" to refresh all
* Use refresh icon for individual stocks

Note: Prices are fetched from Yahoo Finance API

---

## API Endpoints

### Portfolio Management

* `GET /api/portfolio/stocks` - Get holdings
* `GET /api/portfolio/portfolio/summary` - Get summary
* `POST /api/portfolio/stocks/{symbol}/price` - Update price

### Transaction Management

* `GET /api/portfolio/transactions` - List transactions
* `POST /api/portfolio/transactions` - Add transaction
* `DELETE /api/portfolio/transactions/{id}` - Delete transaction

### Stock Search

* `GET /api/portfolio/stocks/search/{symbol}` - Search stock

---

## Database Schema

### Stock Table

* `id` - Primary key
* `symbol` - Ticker
* `company_name` - Company name
* `current_price` - Latest price
* `last_updated` - Timestamp

### Transaction Table

* `id` - Primary key
* `stock_id` - FK to Stock
* `transaction_type` - 'buy' or 'sell'
* `quantity` - Shares
* `price_per_share` - Price per share
* `transaction_date` - Date
* `created_at` - Timestamp

---

## Deployment

### Frontend Deployment

```bash
cd portfolio-tracker
pnpm run build
# Deploy dist/ folder
```

### Backend Deployment

```bash
cd portfolio-api
pip freeze > requirements.txt
# Deploy to Python host (Heroku, Railway, etc.)
```

---

## Configuration

### Environment Variables

* `FLASK_ENV` - Set to 'production'
* `DATABASE_URL` - DB connection string (optional)

### API Configuration

* Uses Manus API Hub (Yahoo Finance)
* No API keys required

---

## Troubleshooting

### Common Issues

1. CORS Errors \u2192 Check Flask-CORS
2. DB Errors \u2192 Verify SQLite permissions
3. API Errors \u2192 Check internet
4. Port Conflicts \u2192 Change config

### Development Tips

* Use browser dev tools for frontend
* Check Flask logs for backend
* Test APIs with curl or Postman
* Ensure both servers are running

---

## Contributing

This is a personal tracker. Customize and extend as needed.

## License

Personal use only. Respect Yahoo Finance API terms.

---

**Happy Investing!**

