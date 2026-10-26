#!/usr/bin/env bash
# Retry only the known transient Chrome startup failure; never hide a real Lighthouse failure.
set -uo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: bash scripts/run-lighthouse-with-retry.sh <url> <output-json-path>" >&2
  exit 2
fi

url="$1"
output_path="$2"
max_attempts="${LIGHTHOUSE_MAX_ATTEMPTS:-3}"
retry_delay="${LIGHTHOUSE_RETRY_DELAY_SECONDS:-2}"
known_transient="waiting for dynamic debugging port in chrome-err.log"

if [[ ! "$max_attempts" =~ ^[1-5]$ ]]; then
  echo "LIGHTHOUSE_MAX_ATTEMPTS must be an integer from 1 to 5" >&2
  exit 2
fi

for ((attempt = 1; attempt <= max_attempts; attempt++)); do
  log_file="$(mktemp)"
  rm -f "$output_path"

  if lighthouse "$url" \
    --output=json \
    --output-path="$output_path" \
    --chrome-flags='--headless --no-sandbox --disable-dev-shm-usage' \
    --quiet 2>&1 | tee "$log_file"; then
    status=0
  else
    status=$?
  fi

  if [[ "$status" -eq 0 ]]; then
    if [[ ! -s "$output_path" ]]; then
      echo "Lighthouse exited successfully but did not create a non-empty report: $output_path" >&2
      rm -f "$log_file"
      exit 1
    fi
    rm -f "$log_file"
    exit 0
  fi

  if grep -Fq "$known_transient" "$log_file"; then
    if [[ "$attempt" -lt "$max_attempts" ]]; then
      echo "Transient Chrome startup failure (attempt $attempt/$max_attempts); retrying after ${retry_delay}s." >&2
      rm -f "$log_file"
      sleep "$retry_delay"
      continue
    fi
    echo "Lighthouse Chrome startup retry limit reached ($max_attempts attempts)." >&2
    rm -f "$log_file"
    exit "$status"
  fi

  echo "Lighthouse failed with a non-retryable error (exit $status); not retrying." >&2
  rm -f "$log_file"
  exit "$status"
done

exit 1
