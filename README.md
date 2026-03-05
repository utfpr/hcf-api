# HCF API

## Pré-requisitos

- [NodeJS >= 22](https://nodejs.org/en)
- [Yarn](https://yarnpkg.com)
- [Docker](https://www.docker.com)
- [Docker Compose](https://docs.docker.com/compose)

## Configuração

Após a instalação dos programas necessários, faça uma cópia do arquivo `.env.example` e renomeie como `.env`.

## Banco de dados

Para subir o banco de dados do projeto, execute no terminal:

```shell
$ docker-compose up mysql
```

Os dados de conexão do banco de dados estão dentro do arquivo `.env` criado anteriormente.

## Execução

No terminal, digite os comandos abaixo:

```shell
$ yarn install
$ yarn start
```

Você deve ver uma saída semelhante a demonstração abaixo.

```txt
Using "development" environment
Master 18385 is running
Worker 18385 started on port 3000
```

---

- adicionar busca pelo código de barras da foto
- colocar um alerta no painel quando estiver em ambiente de desenvolvimento
- issue para corrigir o DarwinCore (problema com o botão, quando clica não está funcionando)
- issue para o incremento do hcf na api ao invés do painel
- relatorio de quantidade de tombos por periodo
  - relatorio tem que ter um grafico, mostrando quantos tombos foram cadastrados por periodo, somente quantitativo

- alteração na ficha tombo

nome cientifico = genero, especie, subespecie (se tiver), variedade (se tiver)
um unico tombo tem variedade e subespecie. como devemos exibir no nome cientifico?
inverter a ordem, colocar subespecie e depois variedade
