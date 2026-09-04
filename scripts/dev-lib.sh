#!/usr/bin/env bash
# Shared helpers for the dev-stack scripts (doctor, seed, smoke).
#
# These target the LOCAL DEV STACK in docker-compose.yml, not the Playwright stack in
# docker-compose.e2e.yml. The e2e stack has its own reset and seed path through /test/*, which
# only exists under the `e2e` Spring profile; the dev stack runs real Entra auth, so anything
# that writes has to go through the database rather than the admin API.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/docker-compose.yml"

BACKEND_URL="${DEV_BACKEND_URL:-http://localhost:8080}"
ADMIN_URL="${DEV_ADMIN_URL:-http://localhost:5173}"
HUBBLE_URL="${DEV_HUBBLE_URL:-http://localhost:5174}"
METEOR_URL="${DEV_METEOR_URL:-http://localhost:5175}"

DB_USER="${DEV_DB_USER:-cafeweb}"
DB_PASSWORD="${DEV_DB_PASSWORD:-local_dev_password}"
DB_NAME="${DEV_DB_NAME:-cafeweb}"

PASS_COUNT=0
FAIL_COUNT=0

pass() { printf '  \033[32mok\033[0m    %s\n' "$1"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail() {
  printf '  \033[31mFAIL\033[0m  %s\n' "$1"
  [ $# -gt 1 ] && printf '        fix: %s\n' "$2"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}
info() { printf '  \033[90m%s\033[0m\n' "$1"; }
heading() { printf '\n\033[1m%s\033[0m\n' "$1"; }

compose() { docker compose -f "$COMPOSE_FILE" "$@"; }

# Container id of a compose service, empty only when it was never created. Uses -a so a stopped
# container is still found and can be reported as stopped rather than as missing.
service_id() { compose ps -aq "$1" 2>/dev/null || true; }

# Run SQL in the dev database container. Reads from stdin when no argument is given.
db_exec() {
  local id
  id="$(service_id db)"
  if [ -z "$id" ]; then
    echo "The dev db container is not running. Start it with: docker compose up -d db" >&2
    return 1
  fi
  if [ $# -gt 0 ]; then
    docker exec -i "$id" mariadb -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -N -B -e "$1" 2>/dev/null
  else
    docker exec -i "$id" mariadb -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" 2>&1 | grep -v 'Using a password' || true
  fi
}

# curl already prints 000 when it cannot connect, so guard only against it printing nothing at all;
# appending a fallback to its output instead would produce "000000".
http_status() {
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$1" 2>/dev/null)" || true
  echo "${code:-000}"
}

summary() {
  printf '\n'
  if [ "$FAIL_COUNT" -eq 0 ]; then
    printf '\033[32m%s passed, nothing to fix.\033[0m\n' "$PASS_COUNT"
    return 0
  fi
  printf '\033[31m%s failed\033[0m (%s passed).\n' "$FAIL_COUNT" "$PASS_COUNT"
  return 1
}
