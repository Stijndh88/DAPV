#!/usr/bin/env bash
# Run a backup immediately (same as the nightly job).
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -z "$(docker compose ps -q db 2>/dev/null)" ]; then
  echo "db not running yet, nothing to back up"; exit 0
fi
docker compose up -d backup >/dev/null
docker compose exec -T backup sh -c '. /etc/backup.env && /usr/local/bin/backup.sh'
