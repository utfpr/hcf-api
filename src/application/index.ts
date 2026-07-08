import cluster from 'node:cluster'
import os from 'node:os'
import { loadEnvFile } from 'node:process'

try {
  loadEnvFile('.env')
} catch {
  // In CI, environment variables are injected directly into the process
}

import { createKnexInstance } from '@/factory/KnexFactory'
import { ConsoleLogger } from '@/infrastructure/ConsoleLogger'

import legacyRoutes from '../routes'
import { createApp } from './create-app'

const environment = process.env.NODE_ENV ?? 'development'

const corsOrigins = process.env.CORS_ORIGINS ?? '*'
const corsMethods = process.env.CORS_METHODS ?? 'HEAD,GET,POST,PUT,PATCH,DELETE'
const corsAllowedHeaders = process.env.CORS_ALLOWED_HEADERS ?? 'Content-Type,Authorization'

const logger = new ConsoleLogger()
const application = createApp({
  logger,
  cors: {
    origins: corsOrigins.split(','),
    methods: corsMethods.split(','),
    allowedHeaders: corsAllowedHeaders.split(',')
  },
  knex: createKnexInstance(),
  legacyRouter: legacyRoutes
})

async function startServer() {
  await application.start(Number(process.env.PORT ?? 3000))
}

if (cluster.isPrimary) {
  logger.info(`Using "${environment}" environment`)
  logger.info(`Master ${process.pid} is running`)

  function forkCluster() {
    cluster.on('exit', (worker, code, signal) => {
      logger.warn(`Worker ${worker.process.pid} died with ${code} code and ${signal} signal.`)
      process.exit(1)
    })

    for (const _ of os.cpus()) {
      cluster.fork()
    }
  }

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
