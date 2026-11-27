import cluster from 'node:cluster'
import os from 'node:os'

import { createKnexInstance } from '@/factory/KnexFactory'
import { ConsoleLogger } from '@/infrastructure/ConsoleLogger'

import legacyRoutes from '../routes'
import { createApp } from './create-app'
import { parseCorsOrigins } from './parseCorsOrigins'

const environment = process.env.NODE_ENV ?? 'development'

const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGINS)
const corsMethods = process.env.CORS_METHODS ?? 'HEAD,GET,POST,PUT,PATCH,DELETE'
const corsAllowedHeaders = process.env.CORS_ALLOWED_HEADERS
  ?? 'Content-Type,Authorization,X-Requested-With'

const logger = new ConsoleLogger()
const application = createApp({
  logger,
  cors: {
    origins: corsOrigins,
    methods: corsMethods.split(','),
    allowedHeaders: corsAllowedHeaders.split(',')
  },
  knex: createKnexInstance(),
  legacyRouter: legacyRoutes
})

/**
 * Inicializa a escuta do servidor HTTP na porta definida por variável de ambiente ou padrão 3000.
 */
async function startServer() {
  await application.start(Number(process.env.PORT ?? 3000))
}

if (cluster.isPrimary) {
  logger.info(`Using "${environment}" environment`)
  logger.info(`Master ${process.pid} is running`)

  /**
   * Distribui instâncias da aplicação criando um processo filho (worker) por núcleo de CPU disponível.
   */
  function forkCluster() {
    cluster.on('exit', (worker, code, signal) => {
      logger.warn(`Worker ${worker.process.pid} died with ${code} code and ${signal} signal.`)
      process.exit(1)
    })

    for (const _ of os.cpus()) {
      cluster.fork()
    }
  }

  /**
   * Inicializa o servidor em modo cluster quando em produção ou em processo único nos demais ambientes.
   */
  async function initServer() {
    if (environment === 'production') {
      forkCluster()
    } else {
      await startServer()
    }
  }

  Promise.resolve()
    .then(initServer)
    .catch(error => {
      logger.error('Failed to start server', error)
      process.exit(1)
    })
} else {
  Promise.resolve()
    .then(startServer)
    .catch(error => {
      logger.error('Failed to start server', error)
      process.exit(1)
    })
}
