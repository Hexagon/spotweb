# Deploying spotweb 2

The recommended production setup is the static Linux binary run by systemd as an unprivileged user, behind a TLS terminating
reverse proxy, with daily database backups. Everything below uses files from the `deploy/` directory (also included in every
release archive).

```
Internet ──TLS──> Caddy / nginx ──HTTP──> 127.0.0.1:6000 spotweb ──> /var/lib/spotweb/spotweb.db (SQLite, WAL)
                                                │
                                                └── built-in scheduler ──> ENTSO-e, ECB
```

## Requirements

- Any 64-bit Linux (x86_64 or aarch64) with systemd 245 or newer. The binary is static, no runtime libraries needed.
- ~256 MB RAM is plenty. The database grows by roughly 100–200 MB per year with all countries.
- Outbound HTTPS to `web-api.tp.entsoe.eu` and `www.ecb.europa.eu`.
- An ENTSO-e API token: register at <https://transparency.entsoe.eu/>, then email `transparency@entsoe.eu` with the subject
  "Restful API access" and generate the token under *My Account Settings*.

## 1. Install the binary

```sh
VERSION=v2.0.0
TARGET=x86_64-unknown-linux-musl      # or aarch64-unknown-linux-musl
BASE=https://github.com/Hexagon/spotweb/releases/download/$VERSION
curl -LO $BASE/spotweb-$VERSION-$TARGET.tar.gz
curl -LO $BASE/spotweb-$VERSION-$TARGET.tar.gz.sigstore.json
curl -LO $BASE/SHA256SUMS

sha256sum --ignore-missing -c SHA256SUMS
cosign verify-blob --bundle spotweb-$VERSION-$TARGET.tar.gz.sigstore.json \
  --certificate-identity-regexp '^https://github.com/Hexagon/spotweb/\.github/workflows/release\.yml@refs/tags/v' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  spotweb-$VERSION-$TARGET.tar.gz

tar xzf spotweb-$VERSION-$TARGET.tar.gz
cd spotweb-$VERSION-$TARGET
sudo install -m 755 spotweb /usr/local/bin/spotweb
spotweb --version
```

## 2. User, configuration and service

```sh
sudo useradd --system --home /var/lib/spotweb --shell /usr/sbin/nologin spotweb
sudo install -d -m 750 -o root -g spotweb /etc/spotweb
sudo install -m 640 -o root -g spotweb deploy/spotweb.env.example /etc/spotweb/spotweb.env
sudoedit /etc/spotweb/spotweb.env        # set API_TOKEN and SPOTWEB_PUBLIC_URL

sudo cp deploy/systemd/spotweb.service deploy/systemd/spotweb-backup.service deploy/systemd/spotweb-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now spotweb spotweb-backup.timer
journalctl -u spotweb -f
```

The unit runs with a strict sandbox (`ProtectSystem=strict`, no capabilities, syscall filter, only `/var/lib/spotweb`
writable). `systemd-analyze security spotweb` should report a low exposure score.

The unit needs systemd 245 or newer (Ubuntu 20.04, Debian 11, RHEL 9). On systemd 247 or newer (Ubuntu 22.04, Debian 12)
you can also hide other processes' `/proc` entries with the drop-in in `deploy/systemd/spotweb.service.d/proc.conf`;
older versions would log "Unknown key name" warnings for those settings, which is why they are not in the main unit:

```sh
systemctl --version | head -1          # 247 or newer?
sudo install -D -m 644 deploy/systemd/spotweb.service.d/proc.conf /etc/systemd/system/spotweb.service.d/proc.conf
sudo systemctl daemon-reload && sudo systemctl restart spotweb
```

## 3. Reverse proxy with TLS

**Caddy** (automatic Let's Encrypt): copy `deploy/caddy/Caddyfile` to `/etc/caddy/Caddyfile`, replace the host name and
`systemctl reload caddy`.

**nginx**: copy `deploy/nginx/spotweb.conf` to `/etc/nginx/sites-available/`, enable it, then `certbot --nginx -d your.host`.

spotweb compresses responses (brotli/gzip) and sets cache headers itself; static assets are served with ETags.

## 4. Upgrading from 1.x

```sh
# Stop 1.x
pup stop            # or: systemctl stop pup-spotweb / pup uninstall --name spotweb

# Import history (read-only access to the old database)
sudo -u spotweb spotweb --db /var/lib/spotweb/spotweb.db import-v1 /path/to/spotweb-1/db/main.db

sudo systemctl start spotweb
```

The import keeps the newest row on duplicates (same rule as 1.x clean-ups) and can be repeated. Point the reverse proxy at
port 6000 as before – the urls and API are the same.

## 5. Upgrading spotweb 2

Download and verify the new release as in step 1, then:

```sh
sudo install -m 755 spotweb /usr/local/bin/spotweb
sudo systemctl restart spotweb
```

Database migrations run automatically at start. Take a backup first (`sudo systemctl start spotweb-backup`).

## Backups

`spotweb-backup.timer` writes a consistent copy every night to `/var/lib/spotweb/backup/spotweb-<weekday>.db` (seven rotating
files) using SQLite's online backup API. Copy that directory off the machine (restic, borg, rsync…).

Restore: stop the service, copy a backup to `/var/lib/spotweb/spotweb.db`, remove any `spotweb.db-wal`/`-shm` files,
`chown spotweb:spotweb`, start.

Everything except the database can be re-created, and even the database can be rebuilt from ENTSO-e (set
`SPOTWEB_HISTORY_START` and start with an empty file) – it just takes a few hours.

## Monitoring

- `GET /healthz` returns `200 ok` when the process and database are fine.
- `GET /api/v2/status` lists the newest price/generation/load timestamps and the last run of each job. Alert if
  `latest_price` is less than ~12 hours ahead of now after 14:00 CET, or if a job keeps reporting `"status": "failed"`.
  Each job run has a `status`: `ok`, `partial` (finished, but some areas failed; they are listed in `failures` with the
  reason), `failed` or `running`. `ok` stays `true` for `partial` runs, for compatibility with 2.0.0.
- Each ENTSO-e request is retried twice after 15 s on timeouts, connection errors and 5xx (60 s on 429/503). HTTP 599
  is logged as "upstream timeout": it is a non-standard code from ENTSO-e's gateway when its backend is slow, not from
  spotweb. spotweb's own per-request timeout is logged as "spotweb timeout".
- Logs go to the journal; set `RUST_LOG=spotweb=debug` for detail.

## Several instances

SQLite is local, so scale up rather than out; one instance handles thousands of requests per second from cache. If you
still want a second node, run it with `--no-scheduler` on a periodically copied database.

## Docker

```sh
docker compose up -d --build      # uses Dockerfile, data in the spotweb-data volume
docker compose exec spotweb spotweb import-v1 /data/main.db   # after copying the 1.x db into the volume
```
