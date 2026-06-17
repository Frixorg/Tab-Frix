# Tab Frix — Events Backend

A small, self-hosted service that **crawls** the upstream `/date/events` feed,
**stores** the events in **PostgreSQL**, and **serves** them back at
`GET /date/events` — matching the exact contract the Tab Frix extension expects.

Built with **Node + TypeScript (Fastify)**. Deploys with **Docker Compose**
behind **Nginx** with a free **Let's Encrypt** certificate for `tab.frix.me`.

---

## What it does

```
                ┌─────────── crawl (cron, default daily 03:00) ───────────┐
                │                                                          ▼
  api.widgetify.ir/date/events ──────────────────────►  Fastify app  ──►  PostgreSQL
                                                              ▲                │
  extension ──► https://tab.frix.me/date/events ──► Nginx ────┘   reads ◄──────┘
                (other routes pass through to api.widgetify.ir)
```

- `GET /date/events` → `{ shamsiEvents, gregorianEvents, hijriEvents }`
  (each item: `{ isHoliday, title, day, month, icon }`).
- `GET /health` → DB status, event count, and last crawl summary.
- A scheduled crawl refreshes the snapshot; the upstream feed is treated as a
  full snapshot and replaced transactionally (all-or-nothing).
- Nginx serves `/date/events` from this app and **transparently proxies every
  other path to `api.widgetify.ir`**, so `https://tab.frix.me` is a drop-in
  base URL for the extension.

---

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

**Trigger a crawl manually** (otherwise it runs on the cron schedule, and once
on first boot if the table is empty):

```bash
docker compose exec app node dist/crawler/runOnce.js
```

**Update after code changes**

```bash
docker compose up -d --build app
```

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
| `CRAWL_CRON` | `0 3 * * *` | Crawl schedule (cron) |
| `CRAWL_ON_START` | `true` | Crawl on boot if table empty |
| `CORS_ORIGIN` | `*` | `*` or comma-separated allow-list |
| `DOMAIN` / `CERTBOT_EMAIL` | `tab.frix.me` / — | Used by Nginx + cert bootstrap |
