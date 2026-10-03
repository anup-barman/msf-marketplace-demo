#!/usr/bin/env bash

set -euo pipefail

cleanup() {
  kill "$api_pid" "$client_pid" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

npm run start --prefix server &
api_pid=$!

npm run dev --prefix client &
client_pid=$!

wait -n "$api_pid" "$client_pid"
