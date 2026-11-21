# infra

Production hosting for plasvissers.be: Docker Compose with the app, PostgreSQL, Caddy (automatic HTTPS) and nightly backups.

Full guide: [docs/deployment.md](../docs/deployment.md).

```
docker-compose.yml   app, db, caddy, backup (+ media-perms init, restore tool)
Caddyfile            HTTPS, www -> apex, security headers, WordPress redirects
redirects.caddy      old WordPress permalinks -> new URLs
.env.example         settings and secrets template (copy to .env)
backup/              backup sidecar image: pg_dump + media tar, rotation, rclone offsite
scripts/             bootstrap-server.sh, deploy.sh, backup-now.sh, restore.sh
rclone/              rclone.conf for the offsite copy (gitignored except the example)
backups/             local backups (gitignored)
```

Quick start on a prepared server:

```bash
cp .env.example .env && chmod 600 .env && nano .env
docker compose pull && docker compose up -d --build
```
