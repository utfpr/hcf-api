import makeCors from 'cors'
import express from 'express'
import makeHelmet from 'helmet'
import { Knex } from 'knex'
import morgan from 'morgan'

import { ExpressApplication } from '@/infrastructure/ExpressApplication'
import { StatusCode } from '@/library/http/common'
import { Route } from '@/library/http/Router'
import { Logger } from '@/library/logger/Logger'

import legacyErrors from '../middlewares/erros-middleware'
import { generatePreview, reportPreview } from '../reports/controller'
import { routes as createEstadoRoutes } from './estado'
import { routes as createEventoRoutes } from './evento'
import { routes as createEvidenciaRoutes } from './evidencia'
import { routes as createExpedicoesRoutes } from './expedicao'
import { routes as createFaseSucessionalRoutes } from './faseSucessional'
import { routes as createLembreteRoutes } from './lembrete'
import { mountPublicStatic } from './mount-public-static'
import { routes as createPaisRoutes } from './pais'
import { assertCookieSafeOrigins } from './parseCorsOrigins'
import { routes as createRelevoRoutes } from './relevo'
import { routes as createSoloRoutes } from './solo'
import { routes as createUsuarioSessaoRoutes } from './usuarioSessao'
import { routes as createVegetacaoRoutes } from './vegetacao'

interface CorsParameters {
  origins: string | string[]
  methods: string[]
  allowedHeaders: string[]
}

interface Parameters {
  logger: Logger
  cors: CorsParameters
  knex: Knex
  legacyRouter?: unknown
}

const securityConfig = {
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' as const },
  contentSecurityPolicy: {
    directives: {
      /* eslint-disable @stylistic/quotes -- CSP keywords require single quotes inside the string */
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'"
      ],
      scriptSrc: ["'self'"],
      imgSrc: [
        "'self'",
        'data:',
        'https:'
      ]
      /* eslint-enable @stylistic/quotes */
    }
  }
}

export function createApp({
  logger, cors, knex, legacyRouter
}: Parameters) {
  const routes: Route[] = [
    ...createPaisRoutes(knex),
    ...createEstadoRoutes(knex),
    ...createEventoRoutes(knex),
    ...createSoloRoutes(knex),
    ...createRelevoRoutes(knex),
    ...createFaseSucessionalRoutes(knex),
    ...createVegetacaoRoutes(knex),
    ...createEvidenciaRoutes(knex),
    ...createExpedicoesRoutes(knex),
    ...createLembreteRoutes(knex),
    ...createUsuarioSessaoRoutes(knex)
  ]
  const origins = assertCookieSafeOrigins(cors.origins)
  const application = new ExpressApplication({ logger })

  application
    .use(makeHelmet(securityConfig))
    .use(makeCors({
      origin: origins,
      credentials: true,
      methods: cors.methods,
      allowedHeaders: cors.allowedHeaders
    }))
    .use(morgan('dev', {
      skip: req => req.url === '/health'
    }))
    .get('/health', {
      handle() {
        return Promise.resolve({
          statusCode: StatusCode.Ok,
          body: { status: 'OK' }
        })
      }
    })
    // .use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

  // Nginx de prod prefixa /api. O mesmo diretório precisa responder nos dois paths.
  mountPublicStatic(application)

  const reportsRouter = express.Router()
  reportsRouter.get('/:fileName', reportPreview)
  reportsRouter.post('/:fileName', generatePreview)
  application.use('/reports', reportsRouter)
  application.use('/api/reports', reportsRouter)

  for (const route of routes) {
    const sanitizedPath = `/api/${route.path}`.replaceAll(/\/{2,}/g, '/').replaceAll(/\/$/g, '')
    application.endpoint(route.method, sanitizedPath, route.handlers, route.middlewares)
  }

  if (legacyRouter) {
    application.use('/api', legacyRouter)
  }
  application.use(legacyErrors)

  return application
}
