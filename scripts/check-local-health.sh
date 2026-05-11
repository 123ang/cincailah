#!/usr/bin/env bash
# Local pre-deploy health helper. Checks env, Prisma DB connectivity, then /api/health.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-3000}"
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
  PORT="${PORT:-3000}"
fi

missing=0
for key in DATABASE_URL SESSION_SECRET; do
  if [[ -z "${!key:-}" ]]; then
    echo "ERROR: missing $key (create .env from .env.example for local checks)" >&2
    missing=1
  fi
done
[[ "$missing" -eq 0 ]] || exit 1

npx prisma validate >/dev/null
npx prisma db push --skip-generate >/dev/null

echo "OK: Prisma can reach the database."

ok=0
for host in localhost 127.0.0.1 '[::1]'; do
  url="http://${host}:${PORT}/api/health"
  body_file="/tmp/cincailah-local-health.$$"
  code="$(curl -g -sS -m 10 -o "$body_file" "-w%{http_code}" "$url" || true)"
  body="$(cat "$body_file" 2>/dev/null || true)"
  rm -f "$body_file"
  if [[ "$code" == "200" ]] && echo "$body" | grep -q '"status":"ok"'; then
    echo "OK: $url -> $body"
    ok=1
  else
    echo "WARN: $url -> HTTP ${code:-000} ${body:0:200}"
  fi
done

if [[ "$ok" -ne 1 ]]; then
  echo "ERROR: no local /api/health endpoint returned status ok." >&2
  echo "Start the app first: npm run dev  (or npm run build && npm start)" >&2
  exit 1
fi
