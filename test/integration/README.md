# Testes de integração

Os testes de integração rodam contra um banco PostgreSQL real. **Você é responsável por
iniciar o container e aplicar as migrations antes de executar os testes.**

## Pré-requisitos

- Docker instalado e em execução
- Dependências do Node.js instaladas (`yarn install`)

## Configuração inicial

### 1. Inicie o banco de testes

```bash
docker compose -f compose.integration.yml up -d
```

Isso sobe um container PostgreSQL na porta **5433** usando as credenciais do `.env`.

### 2. Aplique as migrations

```bash
npm run migration:apply
```

Isso executa o stack completo de migrations no banco definido no `.env`. Você só precisa
rodar de novo quando novas migrations forem adicionadas.

## Executando os testes

```bash
npm run test:integration
```

A suíte de testes conecta ao banco já em execução e roda todos os testes
em `test/integration/`. Nenhuma alteração de schema é feita no momento do teste.

Para o modo watch (reexecuta ao mudar arquivos):

```bash
npm run test:integration:watch
```

## Parando o banco

```bash
docker compose -f compose.integration.yml down
```

Como o container usa `tmpfs`, todos os dados são perdidos ao parar. Na próxima vez,
comece do zero com `docker compose up -d` seguido de `migration:apply`.

---

## Escrevendo novos testes de integração

Cada teste deve ser dono dos seus dados:

- Insira as linhas necessárias **dentro do próprio teste**, usando um prefixo único em qualquer
  coluna identificadora (sigla, nome, etc.) que distinga suas linhas das de outros arquivos de teste.
- Limpe os dados inseridos em um bloco `finally`, para que a limpeza rode mesmo se a asserção falhar.
- **`afterAll`** — chame `knex.destroy()` para liberar o pool de conexões.
- Nunca use `TRUNCATE` — isso apagaria dados de outros arquivos de teste que rodam em paralelo.

Veja `test/integration/pais/lista-paises.test.ts` para um exemplo concreto.

### Convenção de namespace

Use um prefixo curto e único nos identificadores para evitar colisões entre arquivos de teste:

| Arquivo de teste | Prefixo usado |
|---|---|
| `lista-paises.test.ts` | `XPBR`/`XPAR`/`XPCB` (sigla do país), `XPAI`/`XPCI` (prefixo do nome) |
| `lista-estados.test.ts` | `XEBR` (sigla do país), `XEPR`/`XESP` (sigla do estado) |
