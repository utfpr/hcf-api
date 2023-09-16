# HCF API

## Pré-requisitos

- [NodeJS >= 18.16](https://nodejs.org/en)
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
