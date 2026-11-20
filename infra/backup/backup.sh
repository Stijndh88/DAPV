#!/bin/sh
# Nightly backup: database dump + media archive, then rotate and (optionally) sync offsite.
#
# Layout:  /backups/daily/YYYY-MM-DD_HHMM/{db.dump,media.tar.gz,SHA256SUMS}
#          /backups/weekly/...   (copy made on Sundays)
#          /backups/monthly/...  (copy made on the 1st)
set -eu

STAMP="$(date +%Y-%m-%d_%H%M)"
DIR="/backups/daily/$STAMP"
KEEP_DAILY="${KEEP_DAILY:-14}"
KEEP_WEEKLY="${KEEP_WEEKLY:-8}"
KEEP_MONTHLY="${KEEP_MONTHLY:-12}"

log() { echo "[backup $(date '+%F %T')] $*"; }
ping_hc() { [ -n "${HEALTHCHECK_URL:-}" ] && curl -fsS -m 10 --retry 3 "${HEALTHCHECK_URL}$1" >/dev/null 2>&1 || true; }

fail() { log "FAILED: $*"; ping_hc /fail; rm -rf "$DIR.partial"; exit 1; }

ping_hc /start
mkdir -p "$DIR.partial"

log "dumping database $PGDATABASE"
pg_dump --format=custom --compress=9 --no-owner --no-privileges -f "$DIR.partial/db.dump" \
  || fail "pg_dump"
pg_restore --list "$DIR.partial/db.dump" >/dev/null || fail "dump is not readable"

log "archiving media"
tar -C /media -czf "$DIR.partial/media.tar.gz" . || fail "tar media"

(cd "$DIR.partial" && sha256sum db.dump media.tar.gz > SHA256SUMS)
mv "$DIR.partial" "$DIR"
log "wrote $DIR ($(du -sh "$DIR" | cut -f1))"

# Promote to weekly (Sunday) and monthly (1st) with hard links: no extra disk used.
[ "$(date +%u)" = "7" ]  && cp -al "$DIR" "/backups/weekly/$STAMP"
[ "$(date +%d)" = "01" ] && cp -al "$DIR" "/backups/monthly/$STAMP"

rotate() { # dir keep
  ls -1d "$1"/*/ 2>/dev/null | sort -r | tail -n +"$(( $2 + 1 ))" | while read -r old; do
    log "pruning $old"; rm -rf "$old"
  done
}
rotate /backups/daily "$KEEP_DAILY"
rotate /backups/weekly "$KEEP_WEEKLY"
rotate /backups/monthly "$KEEP_MONTHLY"

if [ -n "${RCLONE_REMOTE:-}" ]; then
  log "syncing to $RCLONE_REMOTE"
  rclone --config /config/rclone/rclone.conf sync /backups "$RCLONE_REMOTE" --links --transfers 2 \
    || fail "offsite sync"
fi

ping_hc ""
log "done"
