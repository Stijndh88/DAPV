# Backup sidecar: same Postgres major as the db service so pg_dump matches.
FROM postgres:17-alpine
RUN apk add --no-cache rclone tzdata curl \
 && rm -rf /media/*   # alpine ships /media/cdrom etc; keep the mountpoint empty
COPY backup.sh restore.sh entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/*.sh
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
