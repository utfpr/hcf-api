#!/bin/bash

set -euo pipefail

TIMESTAMP=$(date +%s)
FILE_NAME="${DATABASE_NAME}_${TIMESTAMP}.sql.gz"
TMP_FILE="/tmp/${FILE_NAME}"

echo "Iniciando processo de backup: ${FILE_NAME}"

echo "Dumping e comprimindo database..."
PGPASSWORD="${DATABASE_PASSWORD}" pg_dump \
  --host "${DATABASE_HOST}" \
  --port "${DATABASE_PORT}" \
  --username "${DATABASE_USER}" \
  --dbname "${DATABASE_NAME}" \
  --clean \
  --if-exists \
  --format plain \
  --encoding UTF-8 \
  --no-privileges \
  --no-owner \
  --verbose | gzip > "${TMP_FILE}"

echo "Enviando para o Google Drive..."
rclone copy "${TMP_FILE}" gdrive:

echo "Limpando arquivo local..."
rm -f "${TMP_FILE}"

echo "Aplicando política de retenção..."
FILES=()
INDEX_FILE=$(mktemp)

while IFS= read -r file; do
  file="${file%$'\r'}"

  ts="${file##*_}"
  ts="${ts%.sql.gz}"
  ts="${ts%$'\r'}"

  if [[ "$ts" =~ ^[0-9]{10,}$ ]]; then
    printf '%s\t%s\n' "$ts" "$file" >> "$INDEX_FILE"
  fi
done < <(rclone lsf gdrive: --files-only)

if [ -s "$INDEX_FILE" ]; then
  mapfile -t FILES < <(sort -rn "$INDEX_FILE" | cut -f2-)
fi

echo " -> Arquivos elegiveis para retenção: ${#FILES[@]}"

rm -f "$INDEX_FILE"

if [ "${#FILES[@]}" -eq 0 ]; then
  echo " -> Nenhum arquivo elegivel para retenção foi encontrado em gdrive:."
fi

DAILY_KEPT=0
WEEKLY_KEPT=0
WEEKLY_SEEN_WEEKS=""
MAX_DAILY=${RETENTION_DAILY:-5}
MAX_WEEKLY=${RETENTION_WEEKLY:-4}

for FILE in "${FILES[@]}"; do
  FILE_TS="${FILE##*_}"
  FILE_TS="${FILE_TS%.sql.gz}"

  if [[ ! "$FILE_TS" =~ ^[0-9]{10,}$ ]]; then
    continue
  fi

  ISO_WEEK=$(date -d "@$FILE_TS" +%G-W%V)

  if [ "$DAILY_KEPT" -lt "$MAX_DAILY" ]; then
    echo " -> [DIÁRIO] Mantendo backup recente: $FILE (Semana: $ISO_WEEK)"
    DAILY_KEPT=$((DAILY_KEPT + 1))

  else
    if [[ ! "$WEEKLY_SEEN_WEEKS" =~ " $ISO_WEEK " ]] && [ "$WEEKLY_KEPT" -lt "$MAX_WEEKLY" ]; then
      echo " -> [SEMANAL] Mantendo primeiro da semana: $FILE (Semana: $ISO_WEEK)"
      WEEKLY_KEPT=$((WEEKLY_KEPT + 1))
      WEEKLY_SEEN_WEEKS="$WEEKLY_SEEN_WEEKS $ISO_WEEK "
    else
      echo " -> Deletando backup antigo: $FILE"
      rclone deletefile gdrive:"$FILE"
    fi
  fi
done

echo "Processo de backup concluído com sucesso: ${FILE_NAME}"
