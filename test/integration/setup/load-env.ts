import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { loadEnvFile } from 'node:process'

try {
  loadEnvFile('.env.test')
} catch {
  // In CI, environment variables are injected directly into the process
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-for-auth-sessions'
}

mkdirSync(path.resolve(process.cwd(), 'uploads'), { recursive: true })
