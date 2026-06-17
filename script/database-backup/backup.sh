#!/bin/bash

set -euo pipefail

TIMESTAMP=$(date +%s)
FILE_NAME="${POSTGRES_DATABASE}_${TIMESTAMP}.sql.gz"
TMP_FILE="/tmp/${FILE_NAME}"

echo "Iniciando processo de backup: ${FILE_NAME}"

echo "Dumping e comprimindo database..."
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${POSTGRES_HOST}" \
  -p "${POSTGRES_PORT}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DATABASE}" \
  -Fp | gzip > "${TMP_FILE}"

echo "Enviando para o Google Drive..."
rclone copy "${TMP_FILE}" gdrive:

echo "Limpando arquivo local..."
rm -f "${TMP_FILE}"

echo "Aplicando política de retenção..."
# Lista e ordena do mais novo para o mais antigo
FILES=$(rclone lsf gdrive: | grep '\.sql\.gz$' | sort -t_ -k3 -rn)

DAILY_KEPT=0
WEEKLY_KEPT=0
WEEKLY_SEEN_WEEKS=""
MAX_DAILY=${RETENTION_DAILY:-5}
MAX_WEEKLY=${RETENTION_WEEKLY:-4}

for FILE in $FILES; do
    FILE_TS=$(echo "$FILE" | grep -oP '\d{10,}')
    
    if [ -z "$FILE_TS" ]; then continue; fi
    
    ISO_WEEK=$(date -d "@$FILE_TS" +%G-W%V)
    
    if [ "$DAILY_KEPT" -lt "$MAX_DAILY" ]; then
        echo " -> [DIÁRIO] Mantendo backup recente: $FILE (Semana: $ISO_WEEK)"
        DAILY_KEPT=$((DAILY_KEPT + 1))
    
    else
        # Se a semana deste arquivo restante ainda não foi guardada nesta fase
        # e ainda temos vagas para backups semanais, nós o mantemos
        if [[ ! "$WEEKLY_SEEN_WEEKS" =~ " $ISO_WEEK " ]] && [ "$WEEKLY_KEPT" -lt "$MAX_WEEKLY" ]; then
            echo " -> [SEMANAL] Mantendo primeiro da semana: $FILE (Semana: $ISO_WEEK)"
            WEEKLY_KEPT=$((WEEKLY_KEPT + 1))
            WEEKLY_SEEN_WEEKS="$WEEKLY_SEEN_WEEKS $ISO_WEEK "
        else
            # Não passou em nenhum critério das sobras: exclusão segura
            echo " -> Deletando backup antigo: $FILE"
            rclone deletefile gdrive:"$FILE"
        fi
    fi
done

echo "Processo de backup concluído com sucesso: ${FILE_NAME}"