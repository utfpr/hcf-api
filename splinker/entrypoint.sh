#!/bin/sh

echo "Generating config from environment variables..."
cat > /app/splinker.conf <<EOF
[dataset]
token=${SPLINKER_TOKEN}
host=${DATABASE_HOST}
port=${DATABASE_PORT}
dbname=${DATABASE_NAME}
user=${DATABASE_USERNAME}
password=${DATABASE_PASSWORD}
EOF

echo "Configuring cron job with schedule: $CRON_SCHEDULE ($TZ)"

echo "$CRON_SCHEDULE $(which java) -jar /app/splinker.jar /app/splinker.conf 1> /proc/1/fd/1 2> /proc/1/fd/2" | crontab -

if ! crontab -l >/dev/null 2>&1; then
  echo "Failed to configure cron job"
  exit 1
fi

crontab -l

exec "$@"
