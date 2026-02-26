#!/bin/bash

set -e
set -o pipefail

EXCLUDE_PARAMS=""
if [ -n "$SYNC_EXCLUDE_TABLES" ]; then
  IFS=',' read -ra TABLES <<< "$SYNC_EXCLUDE_TABLES"
  for table in "${TABLES[@]}"; do
    table=$(echo "$table" | xargs)
    if [ -n "$table" ]; then
      EXCLUDE_PARAMS="$EXCLUDE_PARAMS --exclude-table=$table"
    fi
  done
  echo "Excluding tables: $SYNC_EXCLUDE_TABLES"
fi

echo "Starting synchronization process..."

PGPASSWORD="$SYNC_SOURCE_PASSWORD" pg_dump \
  -h "$SYNC_SOURCE_HOST" \
  -p "$SYNC_SOURCE_PORT" \
  -U "$SYNC_SOURCE_USER" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  --format plain \
  $EXCLUDE_PARAMS \
  "$SYNC_SOURCE_DATABASE" | \
PGPASSWORD="$SYNC_DEST_PASSWORD" psql \
  -h "$SYNC_DEST_HOST" \
  -p "$SYNC_DEST_PORT" \
  -U "$SYNC_DEST_USER" \
  -d "$SYNC_DEST_DATABASE" \
  --single-transaction

echo "Synchronization completed successfully: ${SYNC_SOURCE_DATABASE} -> ${SYNC_DEST_DATABASE}"
