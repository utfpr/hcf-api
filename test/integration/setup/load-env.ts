import { mkdirSync } from 'node:fs'
import path from 'node:path'

mkdirSync(path.resolve(process.cwd(), 'uploads'), { recursive: true })
