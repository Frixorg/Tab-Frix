# Tab Frix — Events Backend

A small, self-hosted service that **crawls** the upstream `/date/events` feed,
**stores** the events in **PostgreSQL**, and **serves** them back at
`GET /date/events` — matching the exact contract the Tab Frix extension expects.

Built with **Node + TypeScript (Fastify)**. Deploys with **Docker Compose**
behind **Nginx** with a free **Let's Encrypt** certificate for `tab.frix.me`.

---

## What it does

```
                ┌──────── one-time crawl (first deploy / manual) ──────────┐
                │                                                          ▼
  api.widgetify.ir/date/events ──────────────────────►  Fastify app  ──►  PostgreSQL
                                                              ▲                │
  extension ──► https://tab.frix.me/date/events ──► Nginx ────┘   reads ◄──────┘
                (other routes pass through to api.widgetify.ir)
```

- `GET /date/events` → `{ shamsiEvents, gregorianEvents, hijriEvents }`
  (each item: `{ isHoliday, title, day, month, icon }`).
- `GET /searchbox` → `{ search_engines, recommendedSites, explorer, selected_engine }`
  (the global search-engine list + recommended sites, mirrored verbatim).
- `GET /health` → DB status, event count, mirrored snapshots, last crawl summary.
- The upstream feed is a **static full-year dataset** (events keyed by month/day,
  no year), so it's crawled **once** on first deploy and stored transactionally
  (all-or-nothing). There is **no recurring cron** — re-run the crawl manually
  only if the upstream list ever changes.
- Nginx serves `/date/events` from this app and **transparently proxies every
  other path to `api.widgetify.ir`**, so `https://tab.frix.me` is a drop-in
  base URL for the extension.

---

## Endpoints: self-hosted vs passthrough

Only **static, global** data is worth mirroring. Dynamic and per-user endpoints
stay proxied to the upstream API by the nginx vhost.

| Endpoint | Mode | Why |
| --- | --- | --- |
| `GET /date/events` | **self-hosted** | Static yearly events, crawled + stored |
| `GET /searchbox` | **self-hosted** | Global search engines + recommended sites |
| `GET /health` | **self-hosted** | This service's status |
| `/searchbox/suggest-search` | passthrough | Live query autocomplete |
| `/weather/*`, `/currency/*` | passthrough | Dynamic (location / live prices) |
| `/wallpapers*` | passthrough | Large media catalog hosted on the CDN |
| `/auth/*`, `/users/@me/*`, `/extension/@me/*` | passthrough | Auth / per-user |
| `/bookmarks`, `/todos`, `/notes`, `/friends`, `/market`, `/notifications` | passthrough | Per-user; need auth + an account DB |

To self-host another static endpoint later: crawl it into a `snapshots` row (see
`src/crawler/crawl.ts`), add a route that reads it (like `searchbox.route.ts`),
and add an exact-match `location = /your-path` to the nginx vhost. Everything
else keeps passing through to `api.widgetify.ir`.

## Project layout

```
backend/
├── src/
│   ├── index.ts            # boot: migrate → seed-if-empty → schedule cron → listen
│   ├── server.ts           # Fastify app (CORS + routes)
│   ├── config.ts           # env-driven config
│   ├── types.ts            # FetchedEvent / FetchedAllEvents contract
│   ├── db/
│   │   ├── pool.ts         # pg connection pool
│   │   ├── schema.ts       # table DDL (inline SQL)
│   │   ├── migrate.ts      # idempotent schema apply
│   │   └── events.repo.ts  # read / replace events, crawl log
│   ├── crawler/
│   │   ├── crawl.ts        # fetch upstream + sanitize + store
│   │   └── runOnce.ts      # CLI: one crawl then exit
│   └── routes/
│       ├── events.route.ts # GET /date/events
│       └── health.route.ts # GET /health
├── nginx/conf.d/tab.frix.me.conf
├── docker-compose.yml      # app + postgres + nginx + certbot
├── Dockerfile
├── init-letsencrypt.sh     # one-time TLS bootstrap
└── .env.example
```

---

## Deploy on your VPS (`tab.frix.me`)

**Prerequisites**

1. Docker + Docker Compose installed on the VPS.
2. A DNS **A record**: `tab.frix.me` → your VPS public IP.
3. Ports **80** and **443** open in the firewall.

**Steps**

```bash
# 1. Get the code onto the VPS, then:
cd backend
cp .env.example .env
nano .env                # set POSTGRES_PASSWORD, [email protected], DOMAIN=tab.frix.me

# 2. One-time: obtain the TLS certificate and start the stack
chmod +x init-letsencrypt.sh
./init-letsencrypt.sh

# 3. (init script already runs `docker compose up -d --build`)
#    Verify:
curl https://tab.frix.me/health
curl https://tab.frix.me/date/events
```

**Re-crawl manually** (the app already crawls once on first boot if the table is
empty; run this only to refresh after the upstream list changes — e.g. yearly):

```bash
docker compose exec app node dist/crawler/runOnce.js
```

**Update after code changes**

```bash
docker compose up -d --build app
```

---

## Deploy behind an existing reverse proxy (host Nginx)

Use this when your VPS already serves other sites on :80/:443. This stack then
runs only the DB + app on `127.0.0.1:${APP_HOST_PORT}` (default 7110); your host
Nginx routes `tab.frix.me` to it. You do **not** use `init-letsencrypt.sh`, the
bundled `nginx/`, or the nginx/certbot services in `docker-compose.yml`.

```bash
cd backend
cp .env.example .env        # set POSTGRES_PASSWORD; APP_HOST_PORT defaults to 7110
docker compose -f docker-compose.behind-proxy.yml up -d --build
curl http://127.0.0.1:7110/health          # app is up
curl http://127.0.0.1:7110/date/events     # populated after the first boot crawl
```

Then add the vhost and issue the certificate with your existing Certbot:

```bash
sudo cp host-nginx.tab.frix.me.conf /etc/nginx/sites-available/tab.frix.me.conf
sudo ln -s /etc/nginx/sites-available/tab.frix.me.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d tab.frix.me        # adds HTTPS automatically
curl https://tab.frix.me/date/events
```

`host-nginx.tab.frix.me.conf` serves `/date/events` + `/health` from the app and
passes everything else through to `api.widgetify.ir`.

---

## Local development

```bash
cd backend
cp .env.example .env       # set DATABASE_URL to a local Postgres
npm install
npm run migrate:dev        # create tables
npm run crawl:dev          # pull a snapshot from the upstream
npm run dev                # start with hot reload on http://localhost:3000
```

A quick Postgres for local dev:

```bash
docker run --name tabfrix-pg -e POSTGRES_USER=tabfrix \
  -e POSTGRES_PASSWORD=tabfrix -e POSTGRES_DB=tabfrix \
  -p 5432:5432 -d postgres:16-alpine
```

---

## Point the extension at this backend

Set the extension's API base URL (it reads `import.meta.env.VITE_API`):

```
# Tab-Frix/.env
VITE_API=https://tab.frix.me
```

Rebuild the extension. Because Nginx proxies non-events routes upstream, only
the events feed changes its source — everything else keeps working.

---

## Configuration reference

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` / `HOST` | `3000` / `0.0.0.0` | App listen address |
| `DATABASE_URL` | (from compose) | PostgreSQL connection string |
| `POSTGRES_USER/PASSWORD/DB` | `tabfrix` | DB container creds + compose `DATABASE_URL` |
| `UPSTREAM_API` | `https://api.widgetify.ir` | Source crawled for events |
| `UPSTREAM_CLIENT_HEADER` | `widgetify-extension` | `client` header sent upstream |
| `CRAWL_ON_START` | `true` | One-time seed crawl on boot if table empty |
| `CORS_ORIGIN` | `*` | `*` or comma-separated allow-list |
| `DOMAIN` / `CERTBOT_EMAIL` | `tab.frix.me` / — | Used by Nginx + cert bootstrap |
