import { mkdirSync, writeFileSync, unlinkSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  afterAll, beforeAll, describe, expect, test
} from 'vitest'
import type { Knex } from 'knex'
import supertest from 'supertest'

const ARQUIVO = 'dual-mount-prova.txt'
const RELATIVO = `evidencias/${ARQUIVO}`
const DISCO = resolve('uploads', RELATIVO)

describe('static uploads dual mount', () => {
  let agent: ReturnType<typeof supertest>

  beforeAll(async () => {
    process.env.JWT_SECRET ??= 'test-dual-mount-secret'
    const { createApp } = await import('@/application/create-app')
    const { ConsoleLogger } = await import('@/infrastructure/ConsoleLogger')
    const application = createApp({
      knex: {} as Knex,
      logger: new ConsoleLogger(),
      cors: {
        origins: ['http://localhost:5173'],
        methods: ['GET'],
        allowedHeaders: ['Content-Type']
      }
    })
    agent = supertest(application.server)
    mkdirSync(resolve('uploads', 'evidencias'), { recursive: true })
    writeFileSync(DISCO, 'prova dual-mount')
  })

  afterAll(() => {
    if (existsSync(DISCO)) unlinkSync(DISCO)
  })

  test('GET /uploads and GET /api/uploads serve the same file', async () => {
    const semPrefixo = await agent.get(`/uploads/${RELATIVO}`).expect(200)
    const comPrefixo = await agent.get(`/api/uploads/${RELATIVO}`).expect(200)
    expect(semPrefixo.text).toBe('prova dual-mount')
    expect(comPrefixo.text).toBe(semPrefixo.text)
  })
})
