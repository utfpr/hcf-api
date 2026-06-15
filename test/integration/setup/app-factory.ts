import knex, { type Knex } from 'knex'
import supertest from 'supertest'

import { createApp } from '@/application/create-app'
import { ConsoleLogger } from '@/infrastructure/ConsoleLogger'

function createTestKnex(): Knex {
  return knex({
    client: 'postgres',
    connection: {
      host: process.env.PG_HOST,
      port: Number(process.env.PG_PORT),
      database: process.env.PG_DATABASE,
      user: process.env.PG_USERNAME,
      password: process.env.PG_PASSWORD
    }
  })
}

export function createTestApp() {
  const knexInstance = createTestKnex()
  const application = createApp({
    knex: knexInstance,
    logger: new ConsoleLogger(),
    cors: {
      origins: ['*'],
      methods: ['GET'],
      allowedHeaders: ['Content-Type']
    }
  })

  return {
    agent: supertest(application.server),
    knex: knexInstance
  }
}
