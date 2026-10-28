#!/usr/bin/env bash
#
# Check the local dev stack and say what to do about anything broken.
#
#   npm run dev:doctor
#
# Every check names its own fix, so a broken stack is one command away from working instead of a
# dig through `docker logs`. Exits non-zero when something is wrong, so CI or a shell chain can
# rely on it.

# shellcheck source=scripts/dev-lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/dev-lib.sh"

printf '\033[1mDev stack doctor\033[0m  (%s)\n' "$COMPOSE_FILE"

# ── Containers ────────────────────────────────────────────────────────────────
heading 'Containers'

for svc in db backend admin public-hubble public-meteor; do
  id="$(service_id "$svc")"
  if [ -z "$id" ]; then
    fail "$svc is not created" "docker compose up -d $svc"
    continue
  fi
  state="$(docker inspect "$id" --format '{{.State.Status}}')"
  case "$state" in
    running) pass "$svc is running" ;;
    restarting)
      fail "$svc is restarting (crash loop)" "docker compose logs --tail 50 $svc"
      ;;
    exited|created|paused) fail "$svc is $state" "docker compose start $svc" ;;
    *) fail "$svc is $state" "docker compose up -d $svc" ;;
  esac
done

# ── Database ──────────────────────────────────────────────────────────────────
heading 'Database'

db_id="$(service_id db)"
if [ -n "$db_id" ]; then
  health="$(docker inspect "$db_id" --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}')"
  [ "$health" = healthy ] \
    && pass 'db reports healthy' \
    || fail "db health is $health" 'docker compose logs --tail 50 db'

  # A container detached from the compose network stays healthy while the backend cannot resolve
  # it by name, which surfaces only as UnknownHostException deep in the backend log. Check it
  # directly, since it is the failure that is hardest to read backwards from the symptom.
  networks="$(docker inspect "$db_id" --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}')"
  if [ -z "${networks// /}" ]; then
    fail 'db is attached to no docker network, so the backend cannot resolve host "db"' \
         'docker compose up -d --force-recreate db backend'
  else
    pass "db is on network:${networks% }"
  fi

  if db_exec 'SELECT 1' >/dev/null 2>&1; then
    pass 'db accepts queries'
  else
    fail 'db refuses queries' 'check MARIADB_* credentials in docker-compose.yml'
  fi
fi

# ── Services answering ────────────────────────────────────────────────────────
heading 'Endpoints'

check_url() {
  local label="$1" url="$2" want="${3:-200}"
  local code
  code="$(http_status "$url")"
  [ "$code" = "$want" ] \
    && pass "$label answers $code  ($url)" \
    || fail "$label answers $code, wanted $want  ($url)" "${4:-docker compose up -d}"
}

check_url 'backend' "$BACKEND_URL/api/menu/HUBBLE" 200 'docker compose logs --tail 50 backend'
check_url 'admin' "$ADMIN_URL" 200
check_url 'Hubble' "$HUBBLE_URL" 200
check_url 'Meteor' "$METEOR_URL" 200

# ── Content ───────────────────────────────────────────────────────────────────
heading 'Seeded content'

if db_exec 'SELECT 1' >/dev/null 2>&1; then
  counts="$(db_exec 'SELECT
      (SELECT COUNT(*) FROM menu_category),
      (SELECT COUNT(*) FROM menu_item),
      (SELECT COUNT(*) FROM board_term),
      (SELECT COUNT(*) FROM vacancy);')"
  read -r cats items terms vacancies <<<"$counts"

  [ "${cats:-0}" -gt 0 ] \
    && pass "menu: $cats categories, $items items" \
    || fail 'no menu content' 'npm run dev:seed'
  [ "${terms:-0}" -gt 0 ] \
    && pass "board: $terms terms" \
    || fail 'no board content' 'npm run dev:seed'
  [ "${vacancies:-0}" -gt 0 ] \
    && pass "vacancies: $vacancies" \
    || fail 'no vacancies' 'npm run dev:seed'
fi

# ── Admin users and their access ──────────────────────────────────────────────
heading 'Admin users'

if db_exec 'SELECT 1' >/dev/null 2>&1; then
  # Staff access is stored per tab in admin_user_permission (one row per tab they may open).
  users="$(db_exec 'SELECT u.email, u.role, COUNT(p.module) FROM admin_user u
    LEFT JOIN admin_user_permission p ON p.admin_user_id = u.id GROUP BY u.id, u.email, u.role ORDER BY u.id;')"
  if [ -z "$users" ]; then
    info 'No admin users yet. Sign in once at the admin; that first sign-in is provisioned as'
    info 'ADMIN only when INITIAL_ADMIN_OID in .env matches your Entra object id.'
  else
    # Staff with few or no tabs are legitimate, not faults, so list everyone and only complain
    # when there is no admin, because then nobody can give anyone access.
    while IFS=$'\t' read -r email role tabs; do
      [ -z "$email" ] && continue
      if [ "$role" = 'ADMIN' ]; then
        info "$email: admin (full access)"
      else
        info "$email: staff, may open $tabs of the tabs"
      fi
    done <<<"$users"

    if echo "$users" | cut -f2 | grep -qx 'ADMIN'; then
      pass 'at least one admin can give others access'
    else
      first_email="$(echo "$users" | head -1 | cut -f1)"
      fail 'no account is admin, so nobody can give anyone access' \
           "docker compose exec db mariadb -u$DB_USER -p$DB_PASSWORD $DB_NAME -e \"UPDATE admin_user SET role='ADMIN' WHERE email='$first_email'; DELETE FROM admin_user_permission WHERE admin_user_id = (SELECT id FROM admin_user WHERE email='$first_email');\""
      info 'INITIAL_ADMIN_OID only applies when a user row is first created, so setting it now'
      info 'does not promote an account that has already signed in. Use the fix above.'
    fi
  fi
fi

summary
