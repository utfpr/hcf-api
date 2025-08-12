import { Knex } from 'knex'
import fs from 'node:fs'
import path from 'node:path'

interface Dependencies {
  knex: Knex
  migrationsPath: string
}

const MIGRATION_TEMPLATE = `import { Knex } from 'knex'

export async function run(knex: Knex): Promise<void> {
  await knex.raw('')
}
`

export class MigrationFileSystem {

  private readonly knex: Knex
  private readonly migrationsPath: string

  constructor(readonly dependencies: Dependencies) {
    this.knex = dependencies.knex
    this.migrationsPath = dependencies.migrationsPath
  }

  async createMigrationFile(name: string): Promise<string> {
    const timestamp = new Date().toISOString()
      .substring(0, 19) // 2025-04-12T16:39:06.000Z => 20250412163906
      .replace(/\D/g, '')
    const fileName = `${timestamp}_${name}`

    const upFilePath = path.join(this.migrationsPath, `${fileName}.ts`)

    fs.writeFileSync(upFilePath, MIGRATION_TEMPLATE)

    return upFilePath
  }

  async listMigrationFiles(): Promise<string[]> {
    const files = fs.readdirSync(this.migrationsPath)
    return files
      .filter(file => /\.[jt]s$/.test(file))
      .sort()
      .map(file => path.join(this.migrationsPath, file))
  }

  private async importMigrationModule(name: string): Promise<{ run: (knex: Knex) => Promise<void> }> {
    const filePathWithoutExtension = path.join(this.migrationsPath, name)

    let migrationModule: { run: (knex: Knex) => Promise<void> }
    if (fs.existsSync(`${filePathWithoutExtension}.ts`)) {
      migrationModule = await import(`${filePathWithoutExtension}.ts`)
    } else if (fs.existsSync(`${filePathWithoutExtension}.js`)) {
      migrationModule = await import(`${filePathWithoutExtension}.js`)
    } else {
      throw new Error(`Migration file ${name} not found`)
    }

    return migrationModule
  }

  async runMigrationFile(name: string): Promise<void> {
    const migration = await this.importMigrationModule(name)
    await migration.run(this.knex)
  }

}
