#!/bin/sh
# Installs the cron schedule and runs crond in the foreground.
set -eu
: "${BACKUP_CRON:=30 3 * * *}"
mkdir -p /backups/daily /backups/weekly /backups/monthly
# Make the container env visible to cron jobs.
env | grep -E '^(PG|KEEP_|RCLONE_|HEALTHCHECK_|TZ)' | sed 's/^/export /; s/=\(.*\)$/="\1"/' > /etc/backup.env
echo "$BACKUP_CRON . /etc/backup.env && /usr/local/bin/backup.sh >> /proc/1/fd/1 2>&1" > /etc/crontabs/root
echo "[backup] schedule: $BACKUP_CRON ($TZ)"
exec crond -f -l 8
