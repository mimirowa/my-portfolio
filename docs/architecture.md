# Architecture Overview

This document outlines how the backend manages currency conversion and market data.

## exchange_rates cache strategy

Exchange rates are stored in the `exchange_rates` table. Each row is unique on
`base`, `quote` and `date` so rates for the same day are only inserted once.
When `services.fx.get_rate()` is called it first checks this table. If the
requested pair for that date is missing, `_fetch_rates()` downloads the full set
of rates for the base currency from the provider defined by `FX_PROVIDER_URL`
(default `exchangerate.host`). All returned rates for supported currencies are
written to the database before the desired pair is returned. Subsequent lookups
for the same day are therefore served from the cache without additional API
requests.

## provider fallback

Quote lookups are handled by `services.market_data.fetch_quote`. When an
`ALPHAVANTAGE_API_KEY` is configured the function queries Alpha Vantage. If the
API returns no data (or the symbol is unsupported), the implementation falls
back to the Stooq provider. Results are cached in memory for 60&nbsp;seconds to
avoid hitting the APIs repeatedly.

### Configuration & API keys

The backend reads its provider settings from environment variables (or a `.env`
file loaded via *python-dotenv*). Important variables include:

* `ALPHAVANTAGE_API_KEY` – optional key enabling Alpha Vantage quotes.
* `FALLBACK_PROVIDER` – provider to query when the main service fails.
* `FX_PROVIDER_URL` – endpoint for currency rates, defaults to
  `https://api.exchangerate.host`.
* `FX_API_KEY` – authentication token for the FX provider (if required).
* `DATA_API_BASE_URL` / `DATA_API_KEY` – base URL and token for the external data
  API used by `ApiClient`.

## manual override route

The `/api/fx/override` endpoint accepts a JSON body containing `date`, `base`,
`quote` and `rate`. It stores the supplied rate in the `exchange_rates` table
with the source marked as `manual`, overwriting any existing value for that day.
This allows corrections when external FX services fail or supply wrong data.

## nightly refresh job

`portfolio-api/src/tasks/update_prices.py` provides a script that fetches the
latest price for every known symbol and writes the result to `PriceCache`. It
mirrors the `/prices/refresh` API endpoint but can be scheduled separately
(e.g. via cron) to refresh cached prices overnight.
