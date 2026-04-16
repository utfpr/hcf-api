#!/bin/sh

echo "Generating config from environment variables..."
cat > /app/splinker.conf <<EOF
[dataset]
token=${SPLINKER_TOKEN}
host=${SPLINKER_DATABASE_HOST}
port=${SPLINKER_DATABASE_PORT}
dbname=${SPLINKER_DATABASE_NAME}
user=${SPLINKER_DATABASE_USERNAME}
password=${SPLINKER_DATABASE_PASSWORD}
EOF

echo "Configuring cron job with schedule: $CRON_SCHEDULE ($TZ)"

echo "$CRON_SCHEDULE java -jar /app/splinker.jar /app/splinker.conf 1> /proc/1/fd/1 2> /proc/1/fd/2" | crontab -

if ! crontab -l >/dev/null 2>&1; then
  echo "Failed to configure cron job"
  exit 1
fi

crontab -l

exec "$@"
