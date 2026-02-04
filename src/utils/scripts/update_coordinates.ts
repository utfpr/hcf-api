import dotenv from 'dotenv'
import path from 'path'
import { Client } from 'pg'
import { fileURLToPath } from 'url'

const currentFilename = fileURLToPath(import.meta.url)
const currentDirname = path.dirname(currentFilename)
const projectRoot = path.resolve(currentDirname, '..', '..', '..')

dotenv.config({ path: path.join(projectRoot, '.env') })

const {
  PG_DATABASE,
  PG_USERNAME,
  PG_PASSWORD,
  PG_HOST,
  PG_PORT,
  DATABASE_URL
} = process.env

const connectionString
  = DATABASE_URL
    || `postgresql://${PG_USERNAME}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${PG_DATABASE}`

function isValidConnectionString(cs: string | undefined): boolean {
  return typeof cs === 'string' && cs.length > 0 && !/undefined/.test(cs)
}

if (!isValidConnectionString(connectionString)) {
  process.exit(1)
}

async function main(): Promise<void> {
  const client = new Client({ connectionString })
  await client.connect()

  try {
    await client.query(`
      UPDATE cidades
      SET 
        latitude = ST_Y(ST_PointOnSurface(poligono)),
        longitude = ST_X(ST_PointOnSurface(poligono)),
        updated_at = NOW()
      WHERE poligono IS NOT NULL
        AND (latitude IS NULL OR longitude IS NULL);
    `)
  } finally {
    await client.end()
  }
}

main().catch(() => process.exit(1))
