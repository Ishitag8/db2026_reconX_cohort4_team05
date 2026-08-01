#!/usr/bin/env bash
set -euo pipefail

DIR=$(cd "$(dirname "$0")" && pwd)
BASE_URL=${BASE_URL:-http://localhost:8081}
EMAIL=${USER_EMAIL:-trader@db.com}
PASSWORD=${USER_PASSWORD:-trader123}

if [ -z "${TOKEN:-}" ]; then
  if ! command -v jq >/dev/null 2>&1; then
    echo "ERROR: jq is required to parse the login response. Install jq or set TOKEN manually."
    exit 1
  fi
  TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
  TOKEN=$(printf '%s' "$TOKEN" | jq -r .token)
  if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "ERROR: failed to obtain JWT token from login response."
    exit 1
  fi
fi

MODE=${1:-k6}

if [ "$MODE" = "ab" ]; then
  if ! command -v ab >/dev/null 2>&1; then
    echo "ERROR: Apache Bench (ab) is not installed. Install it or use k6 mode."
    exit 1
  fi
  echo "Running ADV097 with ab against $BASE_URL..."
  ab -n 100 -c 10 \
     -H "Authorization: Bearer $TOKEN" \
     -T application/json \
     -p "$DIR/trade.json" \
     "$BASE_URL/api/v1/trades"
else
  if ! command -v k6 >/dev/null 2>&1; then
    echo "ERROR: k6 is not installed. Install k6 or run in ab mode if available."
    exit 1
  fi
  echo "Running ADV097 with k6 against $BASE_URL..."
  BASE_URL="$BASE_URL" TOKEN="$TOKEN" k6 run "$DIR/perf.js"
fi
