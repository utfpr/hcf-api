/* eslint-disable no-console */

import { Client } from 'pg'

const DATABASE_HOST = process.env.DATABASE_HOST ?? process.env.PG_HOST ?? 'hcf_postgres'
const DATABASE_PORT = process.env.DATABASE_PORT ?? process.env.PG_PORT ?? '5432'
const DATABASE_NAME = process.env.DATABASE_NAME ?? process.env.PG_DATABASE
const DATABASE_USERNAME = process.env.DATABASE_USERNAME ?? process.env.PG_USERNAME
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD ?? process.env.PG_PASSWORD

async function readStdin(): Promise<string> {
  let result = ''
  process.stdin.setEncoding('utf8')

  for await (const chunk of process.stdin) {
    result += chunk
  }

  return result
}

function parseSuccess(logData: string): boolean {
  return (
    logData.includes('Transmission completed successfully')
    || /Success:\s*[1-9]/.test(logData)
  )
}

function createClient(): Client {
  if (!DATABASE_NAME || !DATABASE_USERNAME || !DATABASE_PASSWORD) {
    throw new Error('Database connection variables are not fully provided.')
  }

  return new Client({
    host: DATABASE_HOST,
    port: parseInt(DATABASE_PORT, 10),
    database: DATABASE_NAME,
    user: DATABASE_USERNAME,
    password: DATABASE_PASSWORD
  })
}

async function main(): Promise<void> {
  const logData = await readStdin()
  const sucesso = parseSuccess(logData)
  const client = createClient()

  try {
    await client.connect()

    const res = await client.query<{ max_hcf: number | null }>(
      'SELECT MAX(hcf) as max_hcf FROM tombos'
    )
    const maxTomboHcf = res.rows[0]?.max_hcf ?? null

    const insertQuery = `
      INSERT INTO splinker_logs (max_tombo_hcf, sucesso, log_saida)
      VALUES ($1, $2, $3)
    `

    await client.query(
      insertQuery,
      [
        maxTomboHcf,
        sucesso,
        logData
      ]
    )

    console.log('Logs salvos com sucesso na tabela splinker_logs.')
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Erro ao salvar os logs:', error.message)
    } else {
      console.error('Erro ao salvar os logs:', error)
    }

    process.exit(1)
  } finally {
    await client.end()
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message)
  } else {
    console.error(error)
  }

  process.exit(1)
})
