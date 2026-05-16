#!/usr/bin/env bash
set -euo pipefail

API_URL="${1:-http://localhost:5041}"

echo "Checking API health at $API_URL/health"
curl -i "$API_URL/health"
