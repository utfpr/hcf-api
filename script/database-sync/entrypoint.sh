#!/bin/sh

echo "Configuring cron job with schedule: $CRON_SCHEDULE (timezone: $TZ)"

# ensure environment variables are passed to the cron job
printenv | grep -E "^SYNC_" >> /etc/environment

echo "$CRON_SCHEDULE /database-sync.sh" | crontab -

if ! crontab -l >/dev/null 2>&1; then
  echo "Failed to configure cron job"
  exit 1
fi

crontab -l

exec $@
