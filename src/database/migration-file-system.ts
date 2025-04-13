import fs from 'node:fs'
import path from 'node:path'

interface Dependencies {
  migrationsPath: string
}

export class MigrationFileSystem {

  private readonly migrationsPath: string

  constructor(readonly dependencies: Dependencies) {
    this.migrationsPath = dependencies.migrationsPath
  }

  async createMigrationFile(name: string): Promise<string> {
    const timestamp = new Date().toISOString()
      .substring(0, 19) // 2025-04-12T16:39:06.000Z => 20250412163906
      .replace(/\D/g, '')
    const fileName = `${timestamp}_${name}`

    const upFilePath = path.join(this.migrationsPath, `${fileName}.sql`)

    fs.writeFileSync(upFilePath, '')

    return upFilePath
  }

  async listMigrationFiles(): Promise<string[]> {
    const files = fs.readdirSync(this.migrationsPath)
    return files
      .filter(file => file.endsWith('.sql'))
      .sort()
      .map(file => path.join(this.migrationsPath, file))
  }

  async getMigrationFileContent(name: string): Promise<string> {
    const filePath = path.join(this.migrationsPath, `${name}.sql`)
    return fs.readFileSync(filePath, 'utf8')
  }

}
