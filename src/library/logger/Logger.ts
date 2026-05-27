export interface Logger {
  debug(message: string, extraInput?: unknown): void
  info(message: string, extraInput?: unknown): void
  warn(message: string, extraInput?: unknown): void
  error(message: string, extraInput?: unknown): void
}
