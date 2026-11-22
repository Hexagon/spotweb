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
VERSION=v2.2.0
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

Pages are sent with a `Content-Security-Policy` that only runs scripts carrying a fresh nonce (plus what those
scripts load, `'strict-dynamic'`), so AdSense, Google Analytics and the analytics script work without listing their
hosts. Don't add a second CSP in the proxy: browsers enforce both. To try it out first, set `SPOTWEB_CSP=report-only`
and watch the browser console for "Content Security Policy" messages; `SPOTWEB_CSP=off` turns it off.

### Rate limiting

The nginx example limits `/api/` to 60 requests per minute and client IP, with bursts of 60 served at once, and
answers `429` over that. Caddy needs the `rate_limit` plugin for this; the Caddyfile has a commented example.

spotweb can also do it itself, which works with any proxy and without one: `SPOTWEB_API_RATE_LIMIT=60` gives each
client a bucket of 60 requests that refills by one per second. Requests to `/api/` over the limit get `429 Too Many
Requests` with `Retry-After` (seconds) and a JSON error. Pages, static files and `/healthz` are never limited. It is
off by default: with a proxy in front, spotweb sees every visitor as the proxy unless told to trust it, and one shared
bucket would block everyone at once. Normal use is far below any sensible limit: Home Assistant polls about every 3
minutes, and a page view makes a few API requests. Keep the limit at 30 or more so that someone clicking around the
site never sees an error.

The client IP is the address of the connection. `X-Forwarded-For` (the rightmost address that is not a trusted proxy)
or `X-Real-IP` is only used when the connection comes from `SPOTWEB_TRUSTED_PROXIES`, e.g. `127.0.0.1,::1` for a
proxy on the same host or `172.16.0.0/12` for a Docker network. Never trust addresses that clients can connect from
directly: they could then pick any IP. IPv6 clients are counted per /64. Idle clients are forgotten after a minute,
and at most 100 000 are tracked at once.

Rejected requests are counted in `4xx` and in `429` per route in `/api/v2/status` (`http`) and in the log summary.

## 4. Upgrading from 1.x

```sh
# Stop 1.x
pup stop            # or: systemctl stop pup-spotweb / pup uninstall --name spotweb

# Import history (read-only access to the old database)
sudo -u spotweb spotweb --db /var/lib/spotweb/spotweb.db import-v1 /path/to/spotweb-1/db/main.db

sudo systemctl start spotweb

# Refetch the imported days that are incomplete (1.x dropped zero prices); needs API_TOKEN
sudo systemd-run --pipe --wait -p User=spotweb -p EnvironmentFile=/etc/spotweb/spotweb.env \
  /usr/local/bin/spotweb repair-prices
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

`spotweb-backup.timer` writes a consistent copy every night to `/var/lib/spotweb/backup/spotweb-<weekday>.db.zst` (seven
rotating files) using SQLite's online backup API. The `.zst` suffix makes `spotweb backup` compress the copy with zstd,
which shrinks a 1.6 GB database to a fraction of that; name the file `.db` instead to keep it uncompressed. The copy is
written uncompressed next to the destination first, so the backup directory briefly needs room for one full database.
The output is "rsyncable", so restic and borg still deduplicate most of it between nights. Copy that directory off the
machine (restic, borg, rsync…).

Upgrading from a version that wrote `spotweb-<weekday>.db`: install the new unit, `systemctl daemon-reload`, and delete the
old `.db` files from `/var/lib/spotweb/backup` once the first `.zst` backups exist.

### Off-site copy

`deploy/systemd/spotweb-backup.service.d/` has two drop-ins that run right after a successful backup:

- `offsite-restic.conf.example` – encrypted, deduplicated snapshots with restic (7 daily, 4 weekly, 6 monthly; pruned
  on Sundays).
- `offsite-rclone.conf.example` – a plain mirror of the seven files to any rclone remote.

```sh
sudo apt install restic                      # or rclone
sudo install -m 640 -g spotweb /dev/null /etc/spotweb/restic.env
sudoedit /etc/spotweb/restic.env             # RESTIC_REPOSITORY=…, RESTIC_PASSWORD_FILE=… (see the file)
sudo -u spotweb sh -c 'set -a; . /etc/spotweb/restic.env; restic init'
sudo install -D -m 644 deploy/systemd/spotweb-backup.service.d/offsite-restic.conf.example \
  /etc/systemd/system/spotweb-backup.service.d/offsite.conf
sudo systemctl daemon-reload
sudo systemctl start spotweb-backup && journalctl -u spotweb-backup -n 30
```

If the copy fails, the unit fails and `systemctl --failed` shows it; the local backup is still written. Restore from
restic with `restic restore latest --tag spotweb --target /tmp/restore`, then follow the steps below. Test a restore
once, the repository password is the only way back.

Restore: stop the service, unpack a backup to `/var/lib/spotweb/spotweb.db`
(`zstd -d /var/lib/spotweb/backup/spotweb-3.db.zst -o /var/lib/spotweb/spotweb.db`, `apt install zstd` if missing; an
uncompressed `.db` backup is just copied), remove any `spotweb.db-wal`/`-shm` files, `chown spotweb:spotweb`, start.

Everything except the database can be re-created, and even the database can be rebuilt from ENTSO-e (set
`SPOTWEB_HISTORY_START` and start with an empty file) – it just takes a few hours.

## Monitoring

- `GET /healthz` returns `200 ok` when the process and database are fine.
- `GET /healthz/data` returns `200 ok` when the data is current and `503` with one problem per line otherwise. Point an
  external monitor (Uptime Kuma, UptimeRobot, Healthchecks…) at it, every 5–15 minutes. Current means: every area has
  prices for today, and after 14:00 CET for tomorrow too; the newest generation and load are at most 3 hours old.
  Expect an alert if ENTSO-e publishes late, and keep in mind that generation for some areas lags by a few hours.
- `GET /api/v2/status` has the same verdict as `healthy` and `problems`, the newest price/generation/load timestamps and
  the last run of each job. Also alert if a job keeps reporting `"status": "failed"`.
  Each job run has a `status`: `ok`, `partial` (finished, but some areas failed; they are listed in `failures` with the
  reason), `failed`, `running` or `interrupted` (the server stopped or restarted during the run; it runs again at the
  next scheduled time). `ok` stays `true` for `partial` runs, for compatibility with 2.0.0, and is `false` for
  `interrupted` runs. On shutdown spotweb waits up to `SPOTWEB_SHUTDOWN_GRACE_SECS` (15) for running jobs; keep
  systemd's `TimeoutStopSec` above that. A run that panics is recorded as `failed`.
- Each ENTSO-e request is retried twice after 15 s on timeouts, connection errors and 5xx (60 s on 429/503). HTTP 599
  is logged as "upstream timeout": it is a non-standard code from ENTSO-e's gateway when its backend is slow, not from
  spotweb. spotweb's own per-request timeout is logged as "spotweb timeout".
- Logs go to the journal; set `RUST_LOG=spotweb=debug` for detail.
- `http` in `/api/v2/status` counts requests per route since start and for the last summary period: `requests`,
  `p50_ms`/`p95_ms` (upper bound of the bucket: 1, 2, 5, 10, 20, 50 ms … 30 s; `null` above that), `4xx`/`5xx` and `429` (rate limited, also in `4xx`).
  Bad parameters to `/api/v2/spot` and `/api/v2/hass` are answered with 500 as in 1.x and count as `5xx`. Embedded
  files are grouped as `static`, unknown paths as `not found`. The same numbers are logged once a minute
  (`SPOTWEB_HTTP_SUMMARY_SECS`), and `SPOTWEB_ACCESS_LOG=1` logs each request (no IP addresses or query strings).

## Several instances

SQLite is local, so scale up rather than out; one instance handles thousands of requests per second from cache. If you
still want a second node, run it with `--no-scheduler` on a periodically copied database.

## Docker

Each release (from the first one after 2.2.0) publishes a multi-arch image (`linux/amd64`, `linux/arm64`) to
`ghcr.io/hexagon/spotweb`, tagged with the version (`2.3.0`), the minor version (`2.3`) and `latest`. It contains the
same static musl binary as the release archive, is signed with Sigstore (keyless, by the release workflow) and has a
GitHub build provenance attestation.

```sh
docker pull ghcr.io/hexagon/spotweb:2.3.0

# Signature: proves the image was built by this repository's release workflow
cosign verify ghcr.io/hexagon/spotweb:2.3.0 \
  --certificate-identity-regexp '^https://github.com/Hexagon/spotweb/\.github/workflows/release\.yml@refs/tags/v' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com

# Or with the GitHub CLI (build provenance attestation)
gh attestation verify oci://ghcr.io/hexagon/spotweb:2.3.0 --repo Hexagon/spotweb

docker run -d --name spotweb -p 127.0.0.1:6000:6000 -e API_TOKEN=... -v spotweb-data:/data ghcr.io/hexagon/spotweb:2.3.0
```

`docker-compose.yml` uses the image (set a fixed version instead of `latest` in production), or builds it from the
`Dockerfile` with `--build`:

```sh
docker compose up -d              # pulls ghcr.io/hexagon/spotweb, data in the spotweb-data volume
docker compose up -d --build      # builds from source instead
docker compose exec spotweb spotweb import-v1 /data/main.db   # after copying the 1.x db into the volume
```

The `Dockerfile` builds the dependencies in a separate layer, so after a code change only spotweb itself is
recompiled.
