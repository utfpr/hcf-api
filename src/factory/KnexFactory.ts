import createKnex, { Knex } from 'knex'

const {
  PG_DATABASE,
  PG_USERNAME,
  PG_PASSWORD,
  PG_HOST,
  PG_PORT = '5432',
} = process.env

let instance: Knex | null = null

export function createKnexInstance(): Knex {
  if (!instance) {
    instance = createKnex({
      client: 'postgres',
      connection: {
        database: PG_DATABASE,
        host: PG_HOST,
        port: parseInt(PG_PORT),
        user: PG_USERNAME,
        password: PG_PASSWORD,
      },
      pool: { min: 2, max: 25 },
    })
  }
  return instance
}
