#!/usr/bin/env bash
# Restore database and/or media from a backup.
#   ./scripts/restore.sh                       list available backups
#   ./scripts/restore.sh daily/2026-11-21_0330 restore db + media
#   ./scripts/restore.sh daily/2026-11-21_0330 --db-only
#   ./scripts/restore.sh daily/2026-11-21_0330 --media-only
set -euo pipefail
cd "$(dirname "$0")/.."

if [ $# -eq 0 ]; then
  echo "Available backups:"; (cd backups && ls -1d daily/*/ weekly/*/ monthly/*/ 2>/dev/null | sed 's#/$##') || true
  exit 0
fi
NAME="${1%/}"; MODE="${2:-}"
[ -f "backups/$NAME/db.dump" ] || { echo "no such backup: backups/$NAME"; exit 1; }

read -r -p "This OVERWRITES the live site data with backup '$NAME'. Type 'restore' to continue: " ok
[ "$ok" = restore ] || { echo "aborted"; exit 1; }

docker compose stop app
docker compose up -d db
docker compose --profile tools run --rm restore "/backups/$NAME" ${MODE:+"$MODE"}
docker compose up -d app
echo "restored $NAME; app restarted"
