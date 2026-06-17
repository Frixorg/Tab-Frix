#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Tab Frix backend — one-command deploy for the VPS (behind your existing Nginx).
#
#   cd /path/to/Tab-Frix/backend
#   bash deploy.sh
#
# What it does (idempotent — safe to re-run):
#   1. git pull (latest code)
#   2. docker compose build + up -d   (docker-compose.behind-proxy.yml, app on 127.0.0.1:APP_HOST_PORT)
#   3. waits for /health
#   4. loads the en/it translation seed (events + searchbox + contents)
#   5. checks outbound egress to oauth.telegram.org (needed for Telegram login)
#      and, if blocked, prints the exact firewall rule to fix it
#
# Requires backend/.env (copy from .env.example and fill it). Run nginx + TLS
# setup once separately — see host-nginx.tab.frix.me.conf.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")"                       # backend/
REPO_ROOT="$(cd .. && pwd)"
COMPOSE_FILE="docker-compose.behind-proxy.yml"
COMPOSE="docker compose -f $COMPOSE_FILE"

log()  { printf '\033[1;36m▶ %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m! %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# ── 0. Pre-flight ────────────────────────────────────────────────────────────
command -v docker >/dev/null || die "docker is not installed"
docker compose version >/dev/null 2>&1 || die "docker compose v2 is required"
[ -f "$COMPOSE_FILE" ] || die "run this from the backend/ directory ($COMPOSE_FILE not found)"
if [ ! -f .env ]; then
  warn ".env is missing — creating it from .env.example. EDIT IT before continuing."
  cp .env.example .env
  die "Fill in backend/.env (POSTGRES_PASSWORD, TELEGRAM_CLIENT_ID/SECRET, AUTH_JWT_SECRET, PUBLIC_URL, DOMAIN), then re-run."
fi

# Read APP_HOST_PORT from .env (default 7110), ignoring comments.
APP_HOST_PORT="$(grep -E '^APP_HOST_PORT=' .env | tail -1 | cut -d= -f2- | tr -d '"' | tr -d "'" | xargs || true)"
APP_HOST_PORT="${APP_HOST_PORT:-7110}"

# ── 1. Pull latest code ──────────────────────────────────────────────────────
if [ -d "$REPO_ROOT/.git" ]; then
  log "git pull"
  git -C "$REPO_ROOT" pull --ff-only || warn "git pull skipped/failed (continuing with local code)"
else
  warn "no .git found at $REPO_ROOT — skipping git pull"
fi

# ── 2. Build + start ─────────────────────────────────────────────────────────
log "docker compose build"
$COMPOSE build

log "docker compose up -d"
$COMPOSE up -d

# ── 3. Wait for health ───────────────────────────────────────────────────────
log "waiting for the app to become healthy on 127.0.0.1:${APP_HOST_PORT} ..."
healthy=""
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${APP_HOST_PORT}/health" >/dev/null 2>&1; then
    healthy=1; break
  fi
  sleep 2
done
[ -n "$healthy" ] && ok "app is healthy" || { $COMPOSE logs --tail=40 app; die "app did not become healthy — see logs above"; }

# ── 4. Load translation seed (en/it) ─────────────────────────────────────────
# Idempotent: replaces events translations + searchbox/contents snapshots.
log "loading translation seed (fa/en/it) ..."
if $COMPOSE exec -T app node dist/seed/load.js; then
  ok "seed loaded"
else
  warn "seed step failed — events still served untranslated. Check: $COMPOSE logs app"
fi

# ── 5. Telegram egress check ─────────────────────────────────────────────────
# The container must reach oauth.telegram.org to exchange the login code. The
# Docker bridge subnet can change on recreate, and a host nftables 'forward'
# DROP policy will block it — so verify and, if blocked, print the fix.
log "checking outbound egress to oauth.telegram.org (Telegram login) ..."
egress="$($COMPOSE exec -T app node -e "fetch('https://oauth.telegram.org/.well-known/openid-configuration').then(r=>console.log('OK '+r.status)).catch(e=>console.log('FAIL '+((e.cause&&e.cause.code)||e.message)))" 2>/dev/null || echo 'FAIL exec')"
if printf '%s' "$egress" | grep -q '^OK'; then
  ok "egress to Telegram works ($egress)"
else
  warn "egress to oauth.telegram.org is BLOCKED ($egress) — Telegram login code-exchange will fail."
  CID="$($COMPOSE ps -q app | head -1)"
  SUBNET="$(docker inspect "$CID" -f '{{range .NetworkSettings.Networks}}{{.IPAMConfig.IPv4Address}} {{end}}' 2>/dev/null || true)"
  NET="$(docker inspect "$CID" -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}' 2>/dev/null || true)"
  CIDR="$(docker network inspect "$NET" -f '{{range .IPAM.Config}}{{.Subnet}}{{end}}' 2>/dev/null || true)"
  echo
  warn "If you use host nftables with a default-drop 'forward' chain, allow the container subnet:"
  echo "    sudo nft add rule inet filter forward ip saddr ${CIDR:-<container-subnet>} accept"
  echo "    sudo nft add rule inet filter forward ip daddr ${CIDR:-<container-subnet>} ct state related,established accept"
  echo "  (make it persistent in /etc/nftables.conf), then re-run this script."
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo
ok "Deploy complete. Quick checks:"
echo "    curl -s https://tab.frix.me/health"
echo "    curl -s 'https://tab.frix.me/date/events?lang=en' | head -c 300"
echo "    curl -s 'https://tab.frix.me/contents?lang=it'    | head -c 300"
echo
echo "  Telegram login routes (served by the app):"
echo "    POST https://tab.frix.me/auth/telegram/start"
echo "    GET  https://tab.frix.me/auth/telegram/callback   (registered in BotFather → Redirect URIs)"
echo "    GET  https://tab.frix.me/auth/telegram/result"
