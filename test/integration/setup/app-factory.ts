import knex, { type Knex } from 'knex'
import supertest from 'supertest'

import { ListaEstadosController } from '@/application/estado/ListaEstadosController'
import { Kernel, type Route } from '@/application/Kernel'
import { ListaPaisesController } from '@/application/pais/ListaPaisesController'
import { ListaEstadosUseCase } from '@/domain/estado/ListaEstadosUseCase'
import { ListaPaisesUseCase } from '@/domain/pais/ListaPaisesUseCase'
import { ConsoleLogger } from '@/infrastructure/ConsoleLogger'
import { EstadoCollectionKnexAdapter } from '@/infrastructure/EstadoCollectionKnexAdapter'
import { ExpressApplication } from '@/infrastructure/ExpressApplication'
import { PaisCollectionKnexAdapter } from '@/infrastructure/PaisCollectionKnexAdapter'
import { Method } from '@/library/http/common'

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

  const paisCollection = new PaisCollectionKnexAdapter({ knex: knexInstance })
  const estadoCollection = new EstadoCollectionKnexAdapter({ knex: knexInstance })

  const routes: Route[] = [
    {
      method: Method.Get,
      path: '/paises',
      handlers: [
        new ListaPaisesController({
          listaPaisesUseCase: new ListaPaisesUseCase({ paisCollection })
        })
      ]
    },
    {
      method: Method.Get,
      path: '/paises/:paisSigla/estados',
      handlers: [
        new ListaEstadosController({
          listaEstadosUseCase: new ListaEstadosUseCase({ estadoCollection })
        })
      ]
    }
  ]

  const logger = new ConsoleLogger()
  const application = new ExpressApplication({ logger })

  const kernel = new Kernel({
    application,
    routes,
    cors: {
      origins: ['*'],
      methods: ['GET'],
      allowedHeaders: ['Content-Type']
    }
  })

  return {
    agent: supertest(kernel.application.server),
    knex: knexInstance
  }
}
