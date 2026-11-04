import { mkdirSync, writeFileSync, unlinkSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  afterAll, beforeAll, describe, expect, test
} from 'vitest'
import express from 'express'
import supertest from 'supertest'

import { mountPublicStatic } from '@/application/mount-public-static'
import { upload } from '@/config/directory'

const ARQUIVO = 'dual-mount-prova.txt'
const RELATIVO = `evidencias/${ARQUIVO}`
const DISCO = resolve(upload, RELATIVO)

describe('static uploads dual mount', () => {
  let agent: ReturnType<typeof supertest>

  beforeAll(() => {
    const application = express()
    mountPublicStatic(application)
    agent = supertest(application)
    mkdirSync(resolve(upload, 'evidencias'), { recursive: true })
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
