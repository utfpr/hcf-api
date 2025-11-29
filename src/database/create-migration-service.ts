import { MigrationFileSystem } from './migration-file-system'

interface Dependencies {
  migrationFileSystem: MigrationFileSystem
}

export class CreateMigrationService {
  private readonly migrationFileSystem: MigrationFileSystem

  constructor(readonly dependencies: Dependencies) {
    this.migrationFileSystem = dependencies.migrationFileSystem
  }

  execute(name: string): string {
    return this.migrationFileSystem.createMigrationFile(name)
  }
}
