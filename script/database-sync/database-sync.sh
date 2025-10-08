#!/bin/bash

set -e
set -o pipefail

EXCLUDE_PARAMS=""
if [ -n "$SYNC_EXCLUDE_TABLES" ]; then
  IFS=',' read -ra TABLES <<< "$SYNC_EXCLUDE_TABLES"
  for table in "${TABLES[@]}"; do
    table=$(echo "$table" | xargs)  # trim whitespace
    if [ -n "$table" ]; then
      EXCLUDE_PARAMS="$EXCLUDE_PARAMS --ignore-table=${SYNC_SOURCE_DATABASE}.${table}"
    fi
  done
  echo "Excluding tables: $SYNC_EXCLUDE_TABLES"
fi

echo "Starting synchronization process..."

mysqldump \
  -h "$SYNC_SOURCE_HOST" \
  -P "$SYNC_SOURCE_PORT" \
  -u "$SYNC_SOURCE_USER" \
  ${SYNC_SOURCE_PASSWORD:+-p"$SYNC_SOURCE_PASSWORD"} \
  $EXCLUDE_PARAMS \
  --single-transaction \
  "$SYNC_SOURCE_DATABASE" | \
mysql \
  -h "$SYNC_DEST_HOST" \
  -P "$SYNC_DEST_PORT" \
  -u "$SYNC_DEST_USER" \
  ${SYNC_DEST_PASSWORD:+-p"$SYNC_DEST_PASSWORD"} \
  "$SYNC_DEST_DATABASE"


echo "Synchronization completed successfully: ${SYNC_SOURCE_DATABASE} -> ${SYNC_DEST_DATABASE}"
