#!/bin/sh

echo "Configurando rclone..."
mkdir -p /root/.config/rclone
cat <<EOF > /root/.config/rclone/rclone.conf
[gdrive]
type = drive
scope = drive.file
token = ${GDRIVE_TOKEN}
root_folder_id = ${GDRIVE_FOLDER_ID}
EOF

echo "Configuring cron job with schedule: $CRON_SCHEDULE ($TZ)"

printenv | grep -E "^(DATABASE_|GDRIVE_|RETENTION_|CRON_SCHEDULE|TZ)" >> /etc/environment

echo "$CRON_SCHEDULE /backup.sh 1> /proc/1/fd/1 2> /proc/1/fd/2" | crontab -

if ! crontab -l >/dev/null 2>&1; then
  echo "Failed to configure cron job"
  exit 1
fi

crontab -l

exec "$@"
