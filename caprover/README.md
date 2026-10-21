# CapRover pre-deploy (migrations)

Paste [`caprover-pre-deploy.js`](./caprover-pre-deploy.js) **once** into the API app:

1. CapRover → the API app → **App Configs** → **Pre-Deploy Function**
2. Paste the file contents
3. Save

Confirm these env vars exist on the app (same names as the CLI): `PG_DATABASE`, `PG_HOST`, `PG_PORT`, `PG_MIGRATION_USERNAME`, `PG_MIGRATION_PASSWORD`. `PG_HOST` is the host machine running Postgres (the same value the API already uses).

After that, every deploy runs `node dist/database/cli.js migration:apply` from the **new** image before the API service is updated. If apply fails, the deploy stops and the previous container stays up.

Schema-only changes do not need another paste. If this wrapper script changes, paste it again.

Pre-deploy logs: `docker service logs captain-captain --follow`.
