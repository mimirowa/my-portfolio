#!/usr/bin/env bash

# Read API base URL from portfolio-tracker/.env.local
ENV_FILE="portfolio-tracker/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Environment file $ENV_FILE not found" >&2
  exit 1
fi

# Extract the VITE_PORTFOLIO_API value
URL=$(grep -E '^VITE_PORTFOLIO_API=' "$ENV_FILE" | cut -d= -f2-)

if [[ -z "$URL" ]]; then
  echo "VITE_PORTFOLIO_API not set in $ENV_FILE" >&2
  exit 1
fi

# Remove trailing slash for consistency
URL=${URL%/}

endpoints=("stocks" "portfolio/summary" "transactions")
all_ok=1

for ep in "${endpoints[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}\n" "$URL/$ep" || echo "000")
  printf "%s: %s\n" "$ep" "$code"
  if [[ "$code" != "200" ]]; then
    all_ok=0
  fi
done

if [[ $all_ok -eq 1 ]]; then
  echo "All endpoints responded with 200. Frontend should use: $URL"
else
  echo "Endpoint down or path wrong"
fi

