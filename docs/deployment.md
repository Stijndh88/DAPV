# Deploying plasvissers.be

This guide takes the new site from this repository to a server you own, moves the domain away from the current WordPress hosting at junda.nl, and keeps the club's email working throughout.

It is written so that someone comfortable with a terminal can follow it top to bottom. Expect about two hours of hands-on work, spread over two or three days because of DNS waiting times.

**Contents**

1. [What runs where](#1-what-runs-where)
2. [Pick a server](#2-pick-a-server)
3. [Prepare the server](#3-prepare-the-server)
4. [Configure and start the site](#4-configure-and-start-the-site)
5. [Automatic deploys from GitHub](#5-automatic-deploys-from-github)
6. [Backups and restoring](#6-backups-and-restoring)
7. [Email: keep it working](#7-email-keep-it-working)
8. [DNS cutover from junda.nl](#8-dns-cutover-from-jundanl)
9. [Keep old links working](#9-keep-old-links-working)
10. [Go-live checklist](#10-go-live-checklist)
11. [Day-to-day operations](#11-day-to-day-operations)

---

## 1. What runs where

Everything runs on one small Linux server with Docker. The files are in [`infra/`](../infra).

| Service | What it does | Exposed to the internet |
|---|---|---|
| `caddy` | Web server in front of the app. Gets and renews HTTPS certificates automatically (Let's Encrypt), redirects `www` and old WordPress URLs, adds security headers. | Yes, ports 80 and 443 |
| `app` | The new site and its CMS (Next.js + Payload). Editors log in at `/admin`. Image is built by GitHub Actions. | Only through Caddy |
| `db` | PostgreSQL 17 with all content (news, calendar, results, users). | No |
| `backup` | Every night at 03:30: database dump + all uploaded photos, kept 14 days / 8 weeks / 12 months, optionally copied off the server. | No |
| `media-perms` | Starts, fixes file permissions on the photo volume, exits. | No |

Persistent data lives in Docker volumes `pgdata` (database), `media` (uploaded photos and files), `caddy_data` (certificates), plus the `infra/backups/` folder.

The app container gets these settings from `infra/.env`: `DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `PORT=3000` and optional `SMTP_*`. It stores uploads in `/app/media` and runs database migrations itself on start.

## 2. Pick a server

**Recommendation: a Hetzner Cloud shared-vCPU server with 2 vCPU, 4 GB RAM and 40 GB disk (the "CX" line), in Falkenstein or Nuremberg, Germany, running Ubuntu 24.04.**

Why this one:

- It is in the EU, so the members' data stays under GDPR, and latency to Belgium is about 10 ms.
- It costs roughly 4 to 6 euro a month (check the current price on hetzner.com; it changes now and then). A club site with photo galleries uses a fraction of it.
- Hetzner's own server backups (+20% of the server price) give a whole-machine snapshot every day on top of our own backups. Turn this on.
- For off-server backup copies, a Hetzner **Storage Box** (BX11, 1 TB, about 3 to 4 euro a month) works directly with the backup service.

Reasonable alternatives if you prefer another provider: Scaleway or OVHcloud (France), netcup (Germany), or Combell (Belgium, more expensive). Anything with Ubuntu 24.04, 2 GB RAM minimum (4 GB recommended for building and image processing headroom), and a public IPv4 address works.

When you create the server:

1. Choose **Ubuntu 24.04**.
2. Add **your SSH public key** (no root password).
3. Enable **Backups**.
4. Write down the IPv4 and IPv6 addresses. You will need them for DNS.

## 3. Prepare the server

Copy the bootstrap script to the new server and run it as root. It installs Docker, a firewall (only SSH, HTTP, HTTPS open), automatic security updates with a 04:30 reboot when needed, fail2ban, turns off SSH password login, and creates a `deploy` user.

```bash
scp infra/scripts/bootstrap-server.sh root@SERVER_IP:/root/
ssh root@SERVER_IP 'bash /root/bootstrap-server.sh'
```

Then log in as the deploy user and get the repository:

```bash
ssh deploy@SERVER_IP
git clone https://github.com/Stijndh88/DAPV.git /opt/plasvissers/repo
ln -s /opt/plasvissers/repo/infra /opt/plasvissers/infra
```

If the repository is private, create a [deploy key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys) (read-only) on the server and clone with the `git@github.com:` URL instead.

**Let the server pull the app image.** The image is stored in GitHub Container Registry. If the repository is private, the image is private too. Create a classic personal access token with only the `read:packages` scope, then on the server:

```bash
echo YOUR_TOKEN | docker login ghcr.io -u Stijndh88 --password-stdin
```

## 4. Configure and start the site

```bash
cd /opt/plasvissers/infra
cp .env.example .env
chmod 600 .env
nano .env
```

Fill in at least:

| Setting | Value |
|---|---|
| `POSTGRES_PASSWORD` | output of `openssl rand -hex 32` |
| `PAYLOAD_SECRET` | another `openssl rand -hex 32` (never change it later, it signs logins) |
| `ACME_EMAIL` | an address that is read, for certificate warnings |
| `SMTP_*` | see [section 7](#7-email-keep-it-working) (can be added later) |

**Before DNS points here**, you can test the whole stack on a temporary name. Point a test subdomain you control (for example `nieuw.plasvissers.be`, see section 8, step 2) at the server and set `SITE_DOMAIN=nieuw.plasvissers.be` and `SITE_URL=https://nieuw.plasvissers.be`. Caddy fetches a certificate for it automatically.

Start everything:

```bash
docker compose pull
docker compose up -d --build
docker compose ps          # app and db should say "healthy"
docker compose logs -f app # Ctrl+C to stop following
```

Open `https://<your domain>/admin` and create the first admin account. Then invite the editors from the CMS. They never need to touch the server.

## 5. Automatic deploys from GitHub

Two workflows are in `.github/workflows/`:

- **App image** (`app-image.yml`): on every push to `main` that touches `app/`, builds the image and pushes it to `ghcr.io/stijndh88/dapv` with tags `latest` and `sha-<commit>`. Pull requests only build, to catch errors.
- **Infra checks** (`infra.yml`): validates the compose file and Caddyfile, runs shellcheck, and builds the backup image whenever `infra/` changes.

Deploying is **off by default**. To turn it on:

1. On your own computer, make a key just for deploys: `ssh-keygen -t ed25519 -f plasvissers-deploy -N ""`.
2. Add `plasvissers-deploy.pub` to `/home/deploy/.ssh/authorized_keys` on the server.
3. Run `ssh-keyscan SERVER_IP` and copy the output.
4. In GitHub, go to the repository's **Settings > Secrets and variables > Actions** and add:
   - Secret `DEPLOY_HOST`: the server IP or hostname
   - Secret `DEPLOY_USER`: `deploy`
   - Secret `DEPLOY_SSH_KEY`: the contents of the private key file `plasvissers-deploy`
   - Secret `DEPLOY_KNOWN_HOSTS`: the `ssh-keyscan` output
   - Variable `DEPLOY_ENABLED`: `true`
5. Optional: under **Settings > Environments > production**, add yourself as required reviewer. Every deploy then waits for your click.

Each deploy runs `infra/scripts/deploy.sh <tag>` on the server, which:

1. pulls the latest `infra/` config from git,
2. **makes a backup first** (migrations can change the database),
3. pulls the new image and restarts the app,
4. waits until the app reports healthy, or prints its logs and fails.

**Roll back** to an earlier version: `./scripts/deploy.sh sha-abc1234` with the tag of a previous good build (see the repository's Packages page). If a migration damaged data, also restore the backup made right before the bad deploy (next section).

## 6. Backups and restoring

**What is backed up:** the full database (`db.dump`, PostgreSQL custom format) and every uploaded file (`media.tar.gz`), with a checksum file. Each backup is a folder under `infra/backups/`:

```
backups/daily/2026-11-21_0330/     kept 14 days
backups/weekly/...                 Sunday copies, kept 8 weeks
backups/monthly/...                1st-of-month copies, kept 12 months
```

Weekly and monthly copies are hard links, so they take no extra space unless files differ. Change the schedule or retention in `.env` (`BACKUP_CRON`, `BACKUP_KEEP_*`) and run `docker compose up -d backup`.

**Make a backup now:** `./scripts/backup-now.sh`

**Off-server copy (strongly recommended).** A backup on the same disk does not help if the server is lost. With a Hetzner Storage Box:

1. Order a BX11 Storage Box, enable SSH support in its settings.
2. Copy `infra/rclone/rclone.conf.example` to `infra/rclone/rclone.conf`, fill in host, user and the password (obscured: `docker run --rm rclone/rclone obscure 'the-password'`).
3. Set `BACKUP_RCLONE_REMOTE=storagebox:plasvissers` in `.env`, then `docker compose up -d backup`.
4. Run `./scripts/backup-now.sh` and check that it ends with "syncing to storagebox:plasvissers" and "done".

**Get warned when backups stop.** Create a free check at [healthchecks.io](https://healthchecks.io) with a daily period, and put its ping URL in `BACKUP_HEALTHCHECK_URL`. You get an email if a night is missed or fails.

**Restore:**

```bash
cd /opt/plasvissers/infra
./scripts/restore.sh                                  # list backups
./scripts/restore.sh daily/2026-11-21_0330            # database + photos
./scripts/restore.sh daily/2026-11-21_0330 --db-only  # only the database
```

It checks the checksums, asks you to type `restore`, stops the app, replaces the data, and starts the app again.

**Restore on a brand new server** (server lost): do sections 3 and 4 with the same `.env` (keep a copy of it in your password manager), copy a backup folder from the Storage Box into `infra/backups/daily/`, then run `./scripts/restore.sh daily/<folder>`.

Test a restore on a spare server or your laptop once a quarter. A backup you have never restored is a hope, not a backup.

## 7. Email: keep it working

This is the part most likely to go wrong in a hosting move, so read it before touching DNS.

**Find out where the club's email lives today.** Log in to the junda.nl control panel and look at the DNS zone for plasvissers.be. Write down (or export) every record. Look at:

- the **MX** records (where incoming mail goes),
- the **TXT** records starting with `v=spf1` (who may send mail as @plasvissers.be),
- any `_dmarc` and `*._domainkey` records (DKIM),
- `mail`, `webmail`, `autodiscover`, `autoconfig` records.

If MX points at a junda.nl server, **the mailboxes are part of the hosting package**. Cancelling the hosting will delete them. You have three options:

| Option | Effort | Cost | Notes |
|---|---|---|---|
| A. Keep a mail-only package at junda.nl | Lowest | Ask junda | Nothing changes for mail users. Only the website records change. |
| B. Move mailboxes to a mail provider | Medium | 1 to 5 euro per mailbox per month (free for some nonprofits) | E.g. mailbox.org, Proton, Zoho, Microsoft 365 or Google Workspace (both have nonprofit programmes). Copy old mail with the provider's import tool before switching MX. |
| C. Only forwarding, no mailboxes | Low | Free to a few euro | E.g. `bestuur@plasvissers.be` forwards to personal addresses (ImprovMX, Forward Email, or your registrar). Sending as @plasvissers.be is limited. |

Do **not** run a mail server on the web server. Deliverability is hard and it is a security burden.

**Do the website move and the mail move on different days.** First move the website (only A/AAAA records change, MX untouched). Once that is stable, move mail if you chose option B or C.

**Mail sent by the CMS** (password resets, editor invitations) needs an SMTP account. Use a transactional mail service such as Brevo (free tier, EU based) or Mailjet, or the SMTP login of the club's mailbox from option A or B. The provider tells you which SPF `include:` and DKIM records to add. Add them **to the existing SPF record**, do not create a second `v=spf1` record. Put the login in `SMTP_*` in `.env` and restart: `docker compose up -d app`.

## 8. DNS cutover from junda.nl

There are two separate things: the **registrar** (who registered plasvissers.be with DNS Belgium) and the **DNS hosting** (who answers for the records). At small hosts both are usually junda.nl. You can change the records at junda.nl without moving anything; moving the domain is optional and can be done later.

**Step 1. Inventory (two days before).** Export or screenshot the complete DNS zone in the junda.nl panel. Keep it; it is your rollback plan.

**Step 2. Lower the TTL (at least 24 hours before).** Set the TTL of the `@` and `www` A/AAAA records to 300 seconds (5 minutes). Optionally add a test record now: `nieuw` A -> new server IPv4.

**Step 3. Final content sync (go-live day).** Make sure the last news, results and photos from WordPress are in the new CMS (see the content migration notes from the app work). Put a short "site is moving" notice on the old site, or ask editors not to post on the old site that day.

**Step 4. Switch the website records.** Change only these:

| Name | Type | Value |
|---|---|---|
| `@` (plasvissers.be) | A | new server IPv4 |
| `@` | AAAA | new server IPv6 (delete the old AAAA if you do not have one) |
| `www` | A / AAAA, or CNAME `plasvissers.be.` | new server |

Leave **MX, SPF, DKIM, DMARC, mail, webmail, autodiscover** exactly as they are.

Set `SITE_DOMAIN=plasvissers.be` and `SITE_URL=https://plasvissers.be` in `.env` and run `docker compose up -d`. As soon as DNS answers with the new IP, Caddy gets the certificate by itself (watch `docker compose logs -f caddy`). If there is a `CAA` record in the zone, make sure it allows `letsencrypt.org`.

**Step 5. Check.** From your laptop: `dig +short plasvissers.be` and `dig +short www.plasvissers.be` show the new IP, `dig +short MX plasvissers.be` is unchanged. Open the site on your phone on mobile data (different DNS cache). Send a test mail to a club address and reply from it.

**Step 6. Afterwards.** Keep the WordPress hosting for at least two weeks as a fallback. Make a full export (Tools > Export, plus a copy of `wp-content/uploads`) and store it with the backups. Then raise the TTL back to 3600 and cancel the web hosting (but see section 7 about mail first).

**Optional: move DNS or the domain.** If you later want DNS somewhere else (for example Hetzner DNS or Cloudflare in "DNS only" mode, both free), recreate **every** record from your inventory at the new DNS host first, then change the nameservers at the registrar. To move the registration itself, ask junda.nl for the transfer code of plasvissers.be and start the transfer at the new registrar. The domain keeps working during a .be transfer as long as the nameservers stay the same.

**Rollback** at any time: put the old A/AAAA values from your inventory back. With a TTL of 300 most visitors are back on the old site within minutes.

## 9. Keep old links working

Google results, Facebook posts and members' bookmarks point at old WordPress URLs. Caddy already handles the common WordPress paths:

- `/wp-admin`, `/wp-login.php` -> `/admin`
- `/feed` -> `/nieuws`
- `/xmlrpc.php`, `/wp-json`, plugin and core paths -> `410 Gone` (stops bots hammering the server)

For specific old pages and posts, add lines to `infra/redirects.caddy`, for example:

```
redir /2019/05/12/clubkampioenschap-2019/ /nieuws/clubkampioenschap-2019 permanent
redir /kalender-2024/ /kalender permanent
```

The easiest source of old URLs is the WordPress export or the sitemap (`/wp-sitemap.xml` or `/sitemap_index.xml` on the old site). After editing: `docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile`.

## 10. Go-live checklist

**A week before**

- [ ] Server created in the EU, Ubuntu 24.04, provider backups on
- [ ] `bootstrap-server.sh` run, SSH password login off, `deploy` user works
- [ ] `.env` filled in, copy of `.env` saved in a password manager
- [ ] Site running on the test name (`nieuw.plasvissers.be`) with a valid certificate
- [ ] Admin account created, at least one editor invited and able to log in
- [ ] Content migrated from WordPress and checked by an editor
- [ ] CMS emails work (password reset arrives, not in spam)
- [ ] Off-server backup configured, first sync succeeded
- [ ] A test restore done (`./scripts/restore.sh ... --db-only` on the test site)
- [ ] Healthcheck ping for backups set up
- [ ] Uptime monitor set up for `https://plasvissers.be` (e.g. UptimeRobot or Better Stack, free tier)
- [ ] Old URL redirects added for the most visited pages
- [ ] GitHub deploy secrets set, one deploy run green

**Two days before**

- [ ] Full DNS zone exported from junda.nl
- [ ] Mail situation known and decision made (section 7)
- [ ] TTL of `@` and `www` lowered to 300

**Go-live day**

- [ ] Final content sync from WordPress, editors told to post only in the new CMS
- [ ] `SITE_DOMAIN`/`SITE_URL` switched to `plasvissers.be`, `docker compose up -d`
- [ ] A/AAAA for `@` and `www` changed; MX and mail records untouched
- [ ] `https://plasvissers.be` and `https://www.plasvissers.be` load with a valid certificate
- [ ] `http://` redirects to `https://`, `www` redirects to the bare domain
- [ ] Test mail in and out of a club address works
- [ ] `./scripts/backup-now.sh` succeeds on the live site
- [ ] Announce the new site to members

**Two weeks after**

- [ ] No errors in `docker compose logs app` worth fixing, uptime monitor green
- [ ] WordPress export archived with the backups
- [ ] TTL raised back to 3600
- [ ] Web hosting at junda.nl cancelled (keeping mail if option A)

## 11. Day-to-day operations

All commands run in `/opt/plasvissers/infra` on the server.

| Task | Command |
|---|---|
| Status | `docker compose ps` |
| Logs | `docker compose logs -f app` (or `caddy`, `db`, `backup`) |
| Deploy latest / roll back | `./scripts/deploy.sh` / `./scripts/deploy.sh sha-abc1234` |
| Backup now | `./scripts/backup-now.sh` |
| Restore | `./scripts/restore.sh` |
| Restart the app | `docker compose restart app` |
| Database shell | `docker compose exec db psql -U plasvissers` |
| Disk usage | `df -h /` and `docker system df` |
| Clean old images | `docker image prune -f` (deploys do this already) |

Operating system security updates install automatically. Update the base images (Postgres minor versions, Caddy) every few months with `docker compose pull && docker compose up -d`. A Postgres **major** upgrade (17 to 18) is a dump and restore: back up, change the image tag in both `docker-compose.yml` and `infra/backup/Dockerfile`, start with an empty `pgdata` volume, and restore the backup.
