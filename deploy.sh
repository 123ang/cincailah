#!/usr/bin/env bash
# Cincailah production deploy (typical VPS: clone in e.g. /root/projects/cincailah, PM2 name cincailah).
# Run from the repo root: ./deploy.sh
#
# Steps: git pull → npm install → prisma generate → prisma db push → next build → pm2 restart
#
# Options:
#   --no-git       Skip git pull (already updated tree)
#   --no-db        Skip prisma db push (code-only; no schema change)
#   --no-install   Skip npm install
#
# Environment:
#   PM2_APP_NAME   PM2 process name (default: cincailah)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

PM2_APP_NAME="${PM2_APP_NAME:-cincailah}"
DO_GIT=1
DO_DB=1
DO_INSTALL=1

usage() {
  cat <<'EOF'
Usage: ./deploy.sh [options]

  git pull → npm install → prisma generate → prisma db push → npm run build → pm2 restart

Options:
  --no-git       Skip git pull
  --no-db        Skip prisma db push
  --no-install   Skip npm install

Environment:
  PM2_APP_NAME   PM2 process name (default: cincailah)
EOF
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-git) DO_GIT=0 ;;
    --no-db) DO_DB=0 ;;
    --no-install) DO_INSTALL=0 ;;
    -h|--help) usage ;;
    *)
      echo "Unknown option: $1 (try --help)" >&2
      exit 1
      ;;
  esac
  shift
done

echo "==> Deploy from $ROOT"

if [[ "$DO_GIT" -eq 1 ]]; then
  if [[ -d .git ]]; then
    echo "==> git pull --ff-only"
    git pull --ff-only
  else
    echo "==> WARN: not a git repository, skipping git pull"
  fi
fi

if [[ "$DO_INSTALL" -eq 1 ]]; then
  echo "==> npm install"
  npm install
fi

echo "==> npx prisma generate"
npx prisma generate

if [[ "$DO_DB" -eq 1 ]]; then
  echo "==> npx prisma db push"
  npx prisma db push
fi

echo "==> npm run build"
npm run build

if ! command -v pm2 >/dev/null 2>&1; then
  echo "ERROR: pm2 not in PATH. Install globally: npm install -g pm2" >&2
  exit 1
fi

echo "==> pm2 restart $PM2_APP_NAME"
pm2 restart "$PM2_APP_NAME"

PORT="3015"
if [[ -f .env ]]; then
  PORT_LINE="$(grep -E '^[[:space:]]*PORT=' .env | tail -n1 || true)"
  if [[ -n "$PORT_LINE" ]]; then
    PORT="${PORT_LINE#*=}"
    PORT="${PORT//\"/}"
    PORT="${PORT//\'/}"
    PORT="${PORT//[[:space:]]/}"
  fi
fi

echo "==> Health check (/api/health on port ${PORT})"
sleep 2
HEALTH_OK=0
HEALTH_BODY=""
for HEALTH_HOST in "localhost" "127.0.0.1" "[::1]"; do
  HEALTH_URL="http://${HEALTH_HOST}:${PORT}/api/health"
  echo "==> Trying ${HEALTH_URL}"
  HTTP_CODE="$(curl -g -sS -m 10 -o /tmp/cincailah-health.$$ "-w%{http_code}" "$HEALTH_URL" || true)"
  HEALTH_BODY="$(cat /tmp/cincailah-health.$$ 2>/dev/null || true)"
  rm -f /tmp/cincailah-health.$$
  if [[ "$HTTP_CODE" == "200" ]] && echo "$HEALTH_BODY" | grep -q '"status":"ok"'; then
    echo "==> OK: /api/health responded from ${HEALTH_HOST}"
    HEALTH_OK=1
    break
  fi
  echo "==> WARN: ${HEALTH_HOST} returned HTTP ${HTTP_CODE:-000}: ${HEALTH_BODY:0:300}"
done

if [[ "$HEALTH_OK" -ne 1 ]]; then
  echo "==> WARN: health check failed on localhost/127.0.0.1/[::1]"
  echo "==> Inspect: pm2 logs $PM2_APP_NAME --lines 80"
  echo "==> Also confirm .env PORT, DATABASE_URL, and SESSION_SECRET on the server."
fi

echo "==> Done."
