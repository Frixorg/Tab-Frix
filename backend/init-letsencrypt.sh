#!/bin/bash
# Bootstrap Let's Encrypt certificates for the domain, then start the stack.
# Run ONCE on the VPS after `cp .env.example .env` and editing DOMAIN/CERTBOT_EMAIL.
# Adapted from https://github.com/wmnnd/nginx-certbot (MIT).
set -e

# Load .env so DOMAIN / CERTBOT_EMAIL are available.
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

domain="${DOMAIN:-tab.frix.me}"
email="${CERTBOT_EMAIL:-}"
rsa_key_size=4096
data_path="./nginx/certbot"
staging=0 # set to 1 to test against Let's Encrypt staging (avoids rate limits)

if ! docker compose version >/dev/null 2>&1; then
  echo "Error: 'docker compose' is required." >&2
  exit 1
fi
compose="docker compose"

if [ -d "$data_path/conf/live/$domain" ]; then
  read -p "Existing certificate found for $domain. Replace it? (y/N) " decision
  case "$decision" in
    y|Y) ;;
    *) echo "Aborted."; exit 0 ;;
  esac
fi

if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  echo "### Downloading recommended TLS parameters ..."
  mkdir -p "$data_path/conf"
  curl -fsSL https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -fsSL https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
fi

echo "### Creating dummy certificate for $domain ..."
live_path="/etc/letsencrypt/live/$domain"
mkdir -p "$data_path/conf/live/$domain"
$compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1 \
    -keyout '$live_path/privkey.pem' \
    -out '$live_path/fullchain.pem' \
    -subj '/CN=localhost'" certbot

echo "### Starting nginx ..."
$compose up --force-recreate -d nginx

echo "### Removing dummy certificate ..."
$compose run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/$domain && \
  rm -Rf /etc/letsencrypt/archive/$domain && \
  rm -Rf /etc/letsencrypt/renewal/$domain.conf" certbot

echo "### Requesting Let's Encrypt certificate for $domain ..."
if [ -z "$email" ]; then
  email_arg="--register-unsafely-without-email"
else
  email_arg="--email $email"
fi
staging_arg=""
if [ "$staging" != "0" ]; then staging_arg="--staging"; fi

$compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg $email_arg \
    -d $domain \
    --rsa-key-size $rsa_key_size \
    --agree-tos --no-eff-email --force-renewal" certbot

echo "### Reloading nginx ..."
$compose exec nginx nginx -s reload

echo "### Done. Bringing the full stack up ..."
$compose up -d --build

echo
echo "✅ Certificate issued and stack is running."
echo "   Test it:  curl https://$domain/date/events"
