export class CorruptedDirectoryError extends Error {

  override readonly message: string
  readonly missingFiles: string[]

  constructor(message: string, missingFiles: string[]) {
    super(message)
    this.message = message
    this.name = 'CorruptedDirectoryError'
    this.missingFiles = missingFiles
  }

}
