# database-backup

Serviço de backup automatizado do PostgreSQL para o Google Drive.

---

## Restore de backup do PostgreSQL

### Formato do arquivo de backup

Os arquivos gerados pelo serviço seguem o padrão:

```
{DATABASE_NAME}_{unix_timestamp}.sql.gz
```

Exemplo: `herbario_prod_1748469600.sql.gz`

O conteúdo é um dump plain SQL (`pg_dump -Fp`) comprimido com `gzip`.
Para restaurar, o comando é `psql` (não `pg_restore`).

---

### Pré-requisitos

- `psql` instalado na máquina de destino (`postgresql-client`)
- Banco de destino já criado no PostgreSQL alvo
- **Nunca restaurar diretamente sobre o banco de produção sem validação prévia**

---

### Comando de restore

```bash
gunzip -c herbario_prod_1748469600.sql.gz | \
  PGPASSWORD="SENHA" psql \
    -h 10.0.10.80 \
    -p 5432 \
    -U postgres \
    -d herbario_restore
```

| Parâmetro     | Descrição                                      |
|---------------|------------------------------------------------|
| `-h`          | Host do PostgreSQL                             |
| `-p`          | Porta do PostgreSQL                            |
| `-U`          | Usuário do banco                               |
| `-d`          | Banco de destino (deve existir previamente)    |
| `PGPASSWORD`  | Senha do usuário                               |

---

### Fluxo recomendado para validação

1. Baixar o arquivo `.sql.gz` da pasta do Google Drive.
2. Criar um banco temporário para o restore:
   ```bash
   PGPASSWORD="SENHA" psql -h 10.0.10.80 -U postgres -c "CREATE DATABASE herbario_restore;"
   ```
3. Restaurar o backup no banco temporário.
4. Validar a integridade:
   ```bash
   PGPASSWORD="SENHA" psql -h 10.0.10.80 -U postgres -d herbario_restore -c "\dt"
   ```
5. Confirmar contagem de registros em tabelas críticas.
6. Remover o banco temporário após validação:
   ```bash
   PGPASSWORD="SENHA" psql -h 10.0.10.80 -U postgres -c "DROP DATABASE herbario_restore;"
   ```

---

### Observações de segurança

- O `access_token` no `.env` expira em ~1 hora; o `refresh_token` é o que mantém o serviço funcionando a longo prazo.
- Em caso de comprometimento do token, revogue-o em [Google Account Security](https://myaccount.google.com/permissions) e gere um novo via `rclone config reconnect gdrive:`.
