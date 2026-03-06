#!/bin/bash

set -euo pipefail

echo "Starting synchronization process..."

PGPASSWORD="$SYNC_SOURCE_PASSWORD" pg_dump \
  -h "$SYNC_SOURCE_HOST" \
  -p "$SYNC_SOURCE_PORT" \
  -U "$SYNC_SOURCE_USER" \
  -d "$SYNC_SOURCE_DATABASE" \
  -Fc | \
PGPASSWORD="$SYNC_DEST_PASSWORD" pg_restore \
  -h "$SYNC_DEST_HOST" \
  -p "$SYNC_DEST_PORT" \
  -U "$SYNC_DEST_USER" \
  -d "$SYNC_DEST_DATABASE" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges

echo "Synchronization completed successfully: ${SYNC_SOURCE_DATABASE} -> ${SYNC_DEST_DATABASE}"
