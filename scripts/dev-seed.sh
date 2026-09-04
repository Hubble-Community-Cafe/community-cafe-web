#!/usr/bin/env bash
#
# Load demo content into the local dev database.
#
#   npm run dev:seed
#
# The dev stack authenticates against real Entra, so there is no header bridge to seed through the
# admin API the way the Playwright fixtures do. Seeding therefore goes straight into MariaDB.
#
# Both files truncate their own tables first, so this is safe to re-run and always lands on a known
# baseline. It does not touch admin_user, media, audit, or opening hours, so your own account and
# uploads survive.

# shellcheck source=scripts/dev-lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/dev-lib.sh"

FILES=(
  "$REPO_ROOT/docs/seed-menu.sql"
  "$REPO_ROOT/docs/seed-board-vacancies.sql"
)

if [ -z "$(service_id db)" ]; then
  echo 'The dev db container is not running. Start the stack first:' >&2
  echo '  docker compose up -d' >&2
  exit 1
fi

# Hibernate creates the schema when the backend boots, so an empty database means the backend has
# never come up and every insert below would fail on a missing table.
if ! db_exec 'SELECT 1 FROM menu_category LIMIT 1' >/dev/null 2>&1; then
  echo 'The schema does not exist yet. Start the backend once so Hibernate can create it:' >&2
  echo '  docker compose up -d backend && npm run dev:doctor' >&2
  exit 1
fi

printf '\033[1mSeeding the dev database\033[0m\n'

for file in "${FILES[@]}"; do
  name="$(basename "$file")"
  if [ ! -f "$file" ]; then
    fail "$name is missing"
    continue
  fi
  output="$(db_exec < "$file")"
  if echo "$output" | grep -qiE '^ERROR'; then
    fail "$name failed"
    echo "$output" | grep -iE '^ERROR' | head -3 | sed 's/^/        /'
  else
    pass "$name"
  fi
done

if [ "$FAIL_COUNT" -eq 0 ]; then
  counts="$(db_exec 'SELECT
      (SELECT COUNT(*) FROM menu_category),
      (SELECT COUNT(*) FROM menu_item),
      (SELECT COUNT(*) FROM board_term),
      (SELECT COUNT(*) FROM board_member),
      (SELECT COUNT(*) FROM vacancy);')"
  read -r cats items terms members vacancies <<<"$counts"
  printf '\n  %s menu categories, %s items, %s board terms, %s members, %s vacancies\n' \
    "$cats" "$items" "$terms" "$members" "$vacancies"
  printf '  Admin: %s\n' "$ADMIN_URL"
fi

summary
