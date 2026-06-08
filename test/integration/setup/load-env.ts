import { config } from 'dotenv'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

config({ path: path.resolve(process.cwd(), '.env.test') })

if (process.env.TEST_DB_MODE === undefined) {
  process.env.TEST_DB_MODE = 'docker'
}

mkdirSync(path.resolve(process.cwd(), 'uploads'), { recursive: true })
