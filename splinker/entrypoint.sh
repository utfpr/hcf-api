#!/bin/sh

# Export container environment variables to /etc/environment so cron can read them
printenv | grep -v "^\(HOME\|USER\|LOGNAME\|SHELL\|PATH\)=" >> /etc/environment

echo "Generating config from environment variables..."

# Expect DATABASE_* variables to be provided by the environment/container
: "${DATABASE_HOST:?DATABASE_HOST is required}"
: "${DATABASE_PORT:?DATABASE_PORT is required}"
: "${DATABASE_NAME:?DATABASE_NAME is required}"
: "${DATABASE_USERNAME:?DATABASE_USERNAME is required}"
: "${DATABASE_PASSWORD:?DATABASE_PASSWORD is required}"

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

echo "$CRON_SCHEDULE /app/run_splinker.sh 1> /proc/1/fd/1 2> /proc/1/fd/2" | crontab -

if ! crontab -l >/dev/null 2>&1; then
  echo "Failed to configure cron job"
  exit 1
fi

crontab -l

exec "$@"
