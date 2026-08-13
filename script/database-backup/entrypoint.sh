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

echo "Configurando msmtp..."
cat <<EOF > /etc/msmtprc
defaults
auth           on
tls            on
tls_trust_file /etc/ssl/certs/ca-certificates.crt
logfile        /var/log/msmtp.log

account        default
host           ${SMTP_HOST}
port           ${SMTP_PORT}
from           ${SMTP_USER}
user           ${SMTP_USER}
password       ${SMTP_PASS}
EOF
chmod 600 /etc/msmtprc

echo "Configuring cron job with schedule: $CRON_SCHEDULE ($TZ)"

printenv | grep -E "^(DATABASE_|GDRIVE_|RETENTION_|CRON_SCHEDULE|TZ|SMTP_|NOTIFY_)" >> /etc/environment

echo "$CRON_SCHEDULE /backup.sh 1> /proc/1/fd/1 2> /proc/1/fd/2" | crontab -

if ! crontab -l >/dev/null 2>&1; then
  echo "Failed to configure cron job"
  exit 1
fi

crontab -l

exec "$@"
