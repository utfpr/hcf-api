import { Client } from 'pg'

const DATABASE_HOST = process.env.DATABASE_HOST
const DATABASE_PORT = process.env.DATABASE_PORT
const DATABASE_NAME = process.env.DATABASE_NAME
const DATABASE_USERNAME = process.env.DATABASE_USERNAME
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD

async function readStdin() {
  let result = ''
  process.stdin.setEncoding('utf8')

  for await (const chunk of process.stdin) {
    result += chunk
  }

  return result
}

function parseSuccess(logData) {
  return (
    logData.includes('Transmission completed successfully')
    || /Success:\s*[1-9]/.test(logData)
  )
}

function createClient() {
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

async function main() {
  const logData = await readStdin()
  const sucesso = parseSuccess(logData)
  const client = createClient()

  try {
    await client.connect()
    await client.query("SET timezone TO 'America/Sao_Paulo'")

    const res = await client.query(
      'SELECT MAX("CatalogNumber") as ultimo_tombo_hcf FROM vw_splinker'
    )
    const ultimoTomboHcf = res.rows[0]?.ultimo_tombo_hcf ?? null

    const insertQuery = `
      INSERT INTO splinker_execucoes (ultimo_tombo_hcf, sucesso, log_saida)
      VALUES ($1, $2, $3)
    `

    await client.query(
      insertQuery,
      [
        ultimoTomboHcf,
        sucesso,
        logData
      ]
    )

    console.log('Execução do Splinker registrada em splinker_execucoes.')
  } catch (error) {
    console.error('Erro ao salvar os logs:', error instanceof Error ? error.message : error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
