# database-backup

Serviço standalone de backup automático do PostgreSQL para o Google Drive.

Arquitetura:

- Container Debian slim com `postgresql-client-18`, `rclone`, `cron` e `gzip`
- Deploy como app separado no CapRover
- Container stateless (arquivo temporário em `/tmp`)

Fluxo:

`cron -> backup.sh -> pg_dump -Fp -> gzip -> rclone copy -> retenção`

## Formato do backup

Arquivos seguem o padrão:

```text
{DATABASE_NAME}_{unix_timestamp}.sql.gz
```

Exemplo: `herbario_prod_1748469600.sql.gz`

## Variáveis de ambiente

Veja `.env.example` para o contrato completo.

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`
- `GDRIVE_TOKEN`
- `GDRIVE_FOLDER_ID`
- `RETENTION_DAILY` (default: `5`)
- `RETENTION_WEEKLY` (default: `4`)
- `CRON_SCHEDULE` (ex.: `0 2 * * *`)
- `TZ` (ex.: `America/Sao_Paulo`)

## Política de retenção

Após upload bem-sucedido:

- mantém os `RETENTION_DAILY` backups mais recentes
- entre os restantes, mantém até `RETENTION_WEEKLY` semanas ISO distintas
- exclui o restante com `rclone deletefile`

Com valores padrão: máximo de 9 arquivos.

## Teste local

No diretório `script/database-backup`:

```bash
docker compose build
docker compose run --rm database-backup /backup.sh
```

Para validar remoto configurado no container:

```bash
docker compose run --rm database-backup rclone lsf gdrive:
```

## Restore de backup

O dump é SQL plain comprimido (`.sql.gz`), então restore é via `psql`:

```bash
gunzip -c herbario_prod_1748469600.sql.gz | \
  PGPASSWORD="SENHA" psql \
    -h 10.0.10.80 \
    -p 5432 \
    -U postgres \
    -d herbario_restore
```

Fluxo recomendado:

1. Baixar `.sql.gz` do Google Drive.
2. Criar banco temporário de restore.
3. Restaurar no banco temporário.
4. Validar integridade e tabelas.
5. Remover banco temporário.

## Segurança

- O `access_token` expira; o `refresh_token` mantém o acesso de longo prazo.
- Se houver exposição do token, revogue no Google e gere um novo.
