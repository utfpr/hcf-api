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

echo "export DATABASE_HOST='${DATABASE_HOST}'" > /app/env.sh
echo "export DATABASE_PORT='${DATABASE_PORT}'" >> /app/env.sh
echo "export DATABASE_NAME='${DATABASE_NAME}'" >> /app/env.sh
echo "export DATABASE_USERNAME='${DATABASE_USERNAME}'" >> /app/env.sh
echo "export DATABASE_PASSWORD='${DATABASE_PASSWORD}'" >> /app/env.sh

echo "Configuring cron job with schedule: $CRON_SCHEDULE ($TZ)"

echo "$CRON_SCHEDULE /app/run_splinker.sh 1> /proc/1/fd/1 2> /proc/1/fd/2" | crontab -

if ! crontab -l >/dev/null 2>&1; then
  echo "Failed to configure cron job"
  exit 1
fi

crontab -l

exec "$@"
