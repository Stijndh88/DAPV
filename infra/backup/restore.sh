#!/bin/sh
# Restore a backup made by backup.sh.  Run via infra/scripts/restore.sh on the host.
#   restore.sh <backup-dir> [--db-only|--media-only]
set -eu
SRC="${1:?usage: restore.sh /backups/daily/YYYY-MM-DD_HHMM [--db-only|--media-only]}"
MODE="${2:-all}"
cd "$SRC"
sha256sum -c SHA256SUMS

if [ "$MODE" != "--media-only" ]; then
  echo "[restore] restoring database $PGDATABASE from $SRC/db.dump"
  # --clean drops existing objects first, so the db matches the backup exactly.
  pg_restore --clean --if-exists --no-owner --no-privileges --single-transaction -d "$PGDATABASE" db.dump
fi

if [ "$MODE" != "--db-only" ]; then
  echo "[restore] restoring media into /media"
  find /media -mindepth 1 -delete
  tar -C /media -xzf media.tar.gz
fi
echo "[restore] done"
