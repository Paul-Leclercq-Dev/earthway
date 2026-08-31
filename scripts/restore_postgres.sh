#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"
DB_SERVICE="${DB_SERVICE:-db}"
BACKUP_FILE=""
TARGET_DB=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backup-file)
      BACKUP_FILE="$2"
      shift 2
      ;;
    --target-db)
      TARGET_DB="$2"
      shift 2
      ;;
    --compose-file)
      COMPOSE_FILE="$2"
      shift 2
      ;;
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    --db-service)
      DB_SERVICE="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$BACKUP_FILE" ]]; then
  echo "Usage: $0 --backup-file ./backups/postgres/file.dump [--target-db db_name] [--compose-file ...] [--env-file ...]" >&2
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

# Load DB credentials from env file.
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ -z "${POSTGRES_USER:-}" || -z "${POSTGRES_DB:-}" ]]; then
  echo "POSTGRES_USER and POSTGRES_DB must be set in $ENV_FILE" >&2
  exit 1
fi

if [[ -z "$TARGET_DB" ]]; then
  TARGET_DB="${POSTGRES_DB}_restore_test"
fi

if [[ ! "$TARGET_DB" =~ ^[a-zA-Z0-9_]+$ ]]; then
  echo "Invalid --target-db value. Use only letters, numbers and underscore." >&2
  exit 1
fi

COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")

echo "Verifying checksum if available"
if [[ -f "$BACKUP_FILE.sha256" ]]; then
  shasum -a 256 -c "$BACKUP_FILE.sha256"
else
  echo "No checksum file found at $BACKUP_FILE.sha256, continuing"
fi

echo "Recreating target database: $TARGET_DB"
"${COMPOSE[@]}" exec -T "$DB_SERVICE" psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d postgres <<SQL
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '${TARGET_DB}' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS ${TARGET_DB};
CREATE DATABASE ${TARGET_DB};
SQL

echo "Restoring dump into $TARGET_DB"
cat "$BACKUP_FILE" | "${COMPOSE[@]}" exec -T "$DB_SERVICE" pg_restore \
  -U "$POSTGRES_USER" \
  -d "$TARGET_DB" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges

TABLE_COUNT="$("${COMPOSE[@]}" exec -T "$DB_SERVICE" psql -tA -U "$POSTGRES_USER" -d "$TARGET_DB" -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")"

echo "Restore complete"
echo "Public tables in $TARGET_DB: ${TABLE_COUNT:-0}"
