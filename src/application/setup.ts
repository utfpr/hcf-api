import dotenv from 'dotenv'
import path from 'node:path'

dotenv.config({
  path: path.join(process.cwd(), '.env')
})
