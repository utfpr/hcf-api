import createKnex, { Knex } from 'knex'

import { singleton } from '@/library/singleton'

const {
  PG_DATABASE,
  PG_HOST,
  PG_PASSWORD,
  PG_PORT = '5432',
  PG_USERNAME
} = process.env

export const createKnexInstance = singleton((): Knex => {
  return createKnex({
    client: 'postgres',
    connection: {
      database: PG_DATABASE,
      host: PG_HOST,
      password: PG_PASSWORD,
      port: parseInt(PG_PORT),
      user: PG_USERNAME
    },
    pool: { max: 25, min: 2 }
  })
})
