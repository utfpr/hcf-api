# Testes de integração

Os testes de integração sobem o Express in-process (via `supertest`) e falam com
um PostgreSQL/PostGIS real. **Você é responsável por iniciar o container antes
de executar os testes.** O schema é aplicado automaticamente na primeira
inicialização do banco (`schema.sql` montado em `docker-entrypoint-initdb.d`).

## Pré-requisitos

- Docker instalado e em execução
- Dependências do Node.js instaladas (`yarn install`)

## Configuração inicial

### 1. Inicie o banco de testes

```bash
docker compose -f compose.integration.yml up -d
```

Isso sobe um PostgreSQL na porta **5433** (`herbario_test` / `postgres` / `secret`),
os mesmos valores de `.env.test`. O arquivo Compose já fixa `POSTGRES_*` e a porta;
não depende do `.env` da aplicação.

### 2. Schema (sem migrations)

A suíte **não** executa `migration:apply`. Muitos arquivos em
`src/database/migration/` são incrementais, dependem de dados reais ou ainda
usam SQL de MySQL — não dá para replayar o histórico no Postgres de teste.

O contrato é: `schema.sql` é um dump do schema **já migrado**. Quando uma
migration alterar o schema que os testes usam, regenere o dump e commite junto.

## Executando os testes

```bash
yarn test:integration
```

A suíte conecta ao banco já em execução e roda os arquivos em
`test/integration/**/*.test.ts`. Nenhuma alteração de schema é feita no momento
do teste. O `globalSetup` apenas verifica a conexão e faz `TRUNCATE` das tabelas
usadas pelos testes.

Para o modo watch (reexecuta ao mudar arquivos):

```bash
yarn test:integration:watch
```

## Parando o banco

```bash
docker compose -f compose.integration.yml down
```

Como o container usa `tmpfs`, todos os dados (e o schema) são perdidos ao parar.
Na próxima vez, comece do zero com `docker compose -f compose.integration.yml up -d`.

---

## Escrevendo novos testes de integração

Cada teste deve ser dono dos seus dados:

- Insira as linhas necessárias **dentro do próprio teste**, usando um prefixo único em qualquer
  coluna identificadora (sigla, nome, etc.) que distinga suas linhas das de outros arquivos de teste.
- Limpe os dados inseridos em um bloco `finally`, para que a limpeza rode mesmo se a asserção falhar.
- **`afterAll`** — chame `knex.destroy()` para liberar o pool de conexões.
- Nunca use `TRUNCATE` no arquivo de teste — isso apagaria dados de outros arquivos que rodam em paralelo.

Veja `test/integration/pais/lista-paises.test.ts` para um exemplo concreto.
