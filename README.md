# HCF API

HTTP API do sistema do Herbário da UTFPR (HCF). O painel web usa, em desenvolvimento, `PAINEL_BASE_URL=http://localhost:5173`.

## Pré-requisitos

- [Node.js 22](https://nodejs.org/) (`.nvmrc` aponta para `lts/jod`; com nvm: `nvm use`)
- [Yarn](https://yarnpkg.com/) (Classic; o repositório usa `yarn.lock`)
- [Docker](https://docs.docker.com/get-docker/) com Compose V2 (`docker compose`)
- Git
- Um cliente para restaurar o dump: [DBeaver](https://dbeaver.io/) ou `psql`

## Variáveis de ambiente

Clone o repositório e copie o arquivo de ambiente:

```shell
cp .env.example .env
```

Os nomes e os valores padrão locais estão em `.env.example`. Ajuste o `.env` se precisar. Não commite segredos.

| Grupo | Variáveis | Uso local |
| --- | --- | --- |
| Runtime | `TZ`, `PORT`, `NODE_ENV`, `STORAGE_PATH` | Os padrões do exemplo bastam. |
| CORS | `CORS_ORIGINS`, `CORS_METHODS`, `CORS_ALLOWED_HEADERS` | Origem explícita do painel (ex. `http://localhost:5173`). `*` não é aceito. |
| Postgres | `PG_DATABASE`, `PG_HOST`, `PG_PORT`, `PG_USERNAME`, `PG_PASSWORD`, `PG_MIGRATION_USERNAME`, `PG_MIGRATION_PASSWORD` | O Compose usa `PG_DATABASE`, `PG_USERNAME`, `PG_PASSWORD` e `PG_PORT`. A API usa `PG_*`. |
| Auth, e-mail, captcha | `JWT_SECRET`, `SMTP_*`, `RECAPTCHA_SECRET_KEY` | Login, troca de senha e reCAPTCHA. |
| Painel | `PAINEL_BASE_URL` | Padrão local: `http://localhost:5173`. |

## Banco de dados

Peça um dump a um colega de time (não há dump neste repositório). Suba o PostgreSQL:

```shell
docker compose up postgres
```

Conecte com os valores de `PG_*` do `.env` (padrões de `.env.example`: host `127.0.0.1`, porta `5432`, usuário `postgres`, senha `masterkey`, banco `herbario_dev`).

Pode usar um cliente gráfico como o DBeaver (importe ou execute o dump na conexão) ou o terminal com `psql`.

Dump compactado (`.sql.gz`):

```shell
gunzip -c caminho/para/dump.sql.gz | \
  PGPASSWORD=masterkey psql \
    -h 127.0.0.1 \
    -p 5432 \
    -U postgres \
    -d herbario_dev
```

Dump em SQL puro:

```shell
PGPASSWORD=masterkey psql \
  -h 127.0.0.1 \
  -p 5432 \
  -U postgres \
  -d herbario_dev \
  -f caminho/para/dump.sql
```

## Execução

```shell
yarn install
yarn start
```

`yarn start` recarrega ao alterar arquivos (`tsx --watch --env-file=.env`). Saída esperada em desenvolvimento:

```txt
Using "development" environment
Master 18385 is running
Server is running on port 3000
```

Confira com `GET http://localhost:3000/health` (`{ "status": "OK" }`).

## Scripts

| Comando | Função |
| --- | --- |
| `yarn start` | Servidor de desenvolvimento com watch |
| `yarn build` | Bundle de produção (`dist/`) |
| `yarn lint` | `tsc --noEmit` e ESLint |
| `yarn test` | Todos os projetos Vitest |
| `yarn test:unit` / `yarn test:unit:watch` | Testes unitários |
| `yarn test:integration` / `yarn test:integration:watch` | Testes de integração (Postgres de teste) |
| `yarn test:coverage` | Cobertura dos testes unitários |
| `yarn migration:create` / `yarn migration:apply` | Autores de mudança de schema |

O `yarn install` configura o Husky. O hook `pre-push` roda os testes unitários.

## Testes

**Unitários:** `yarn test:unit` — não precisa de Docker.

**Integração:** sobe um PostgreSQL separado (porta **5433**, banco `herbario_test`, credenciais iguais às de `.env.test`). O schema vem de `test/integration/setup/schema.sql` na inicialização do container.

```shell
docker compose -f compose.integration.yml up -d
yarn test:integration
```

Mais detalhes em `test/integration/README.md`.
