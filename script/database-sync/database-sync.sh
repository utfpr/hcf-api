#!/bin/bash

set -euo pipefail

echo "Starting synchronization process..."

exclude_args=()
if [[ -n "${SYNC_EXCLUDE_TABLES:-}" ]]; then
  IFS=$' \t\n,' read -r -a exclude_tables <<< "$SYNC_EXCLUDE_TABLES"
  for table in "${exclude_tables[@]}"; do
    [[ -z "$table" ]] && continue
    exclude_args+=(--exclude-table="$table" --exclude-table="${table}_id_seq")
  done
  echo "Excluding tables: ${exclude_tables[*]}"
fi

# Plain SQL so we can CASCADE drops. Destination excluded tables keep their
# rows; CASCADE only removes leftover FKs that would block --clean.
PGPASSWORD="$SYNC_SOURCE_PASSWORD" pg_dump \
  -h "$SYNC_SOURCE_HOST" \
  -p "$SYNC_SOURCE_PORT" \
  -U "$SYNC_SOURCE_USER" \
  -d "$SYNC_SOURCE_DATABASE" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  "${exclude_args[@]}" | \
sed -E \
  -e 's/^(DROP TABLE IF EXISTS .+);$/\1 CASCADE;/' \
  -e 's/^(ALTER TABLE .+ DROP CONSTRAINT IF EXISTS .+);$/\1 CASCADE;/' | \
PGPASSWORD="$SYNC_DEST_PASSWORD" psql \
  -h "$SYNC_DEST_HOST" \
  -p "$SYNC_DEST_PORT" \
  -U "$SYNC_DEST_USER" \
  -d "$SYNC_DEST_DATABASE" \
  -v ON_ERROR_STOP=1

echo "Synchronization completed successfully: ${SYNC_SOURCE_DATABASE} -> ${SYNC_DEST_DATABASE}"
