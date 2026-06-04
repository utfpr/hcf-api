import cluster from 'node:cluster'
import os from 'node:os'

import { ConsoleLogger } from '@/infrastructure/ConsoleLogger'

import legacyRoutes from '../routes'
import { routes as estadoRoutes } from './estado'
import { routes as paisRoutes } from './pais'
import { Kernel, Route } from './Kernel'
import { ExpressApplication } from '@/infrastructure/ExpressApplication'

const environment = process.env.NODE_ENV ?? 'development'

const corsOrigins = process.env.CORS_ORIGINS ?? '*'
const corsMethods = process.env.CORS_METHODS ?? 'HEAD,GET,POST,PUT,PATCH,DELETE'
const corsAllowedHeaders = process.env.CORS_ALLOWED_HEADERS ?? 'Content-Type,Authorization'

const routes: Route[] = [
  ...paisRoutes,
  ...estadoRoutes
]

const logger = new ConsoleLogger()
const server = new ExpressApplication({ logger })
const kernel = new Kernel({
  application: server,
  routes,
  legacyRouter: legacyRoutes,
  cors: {
    origins: corsOrigins.split(','),
    methods: corsMethods.split(','),
    allowedHeaders: corsAllowedHeaders.split(',')
  }
})

async function startServer() {
  await kernel.start(Number(process.env.PORT ?? 3000))
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
