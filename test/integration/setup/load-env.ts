import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { loadEnvFile } from 'node:process'

try {
  loadEnvFile('.env.test')
} catch {
  // In CI, environment variables are injected directly into the process
}

mkdirSync(path.resolve(process.cwd(), 'uploads'), { recursive: true })
