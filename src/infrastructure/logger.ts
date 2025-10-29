import { Logger } from '@/library/logger'

export class ConsoleLogger implements Logger {
  private formatMessage(message: string, extraInput?: unknown): string {
    if (!extraInput) {
      return message
    }

    return `${message} ${JSON.stringify(extraInput)}`
  }

  debug(message: string, extraInput?: unknown): void {
    // eslint-disable-next-line no-console
    console.debug(this.formatMessage(message, extraInput))
  }

  info(message: string, extraInput?: unknown): void {
    // eslint-disable-next-line no-console
    console.info(this.formatMessage(message, extraInput))
  }

  warn(message: string, extraInput?: unknown): void {
    // eslint-disable-next-line no-console
    console.warn(this.formatMessage(message, extraInput))
  }

  error(message: string, extraInput?: unknown): void {
    // eslint-disable-next-line no-console
    console.error(this.formatMessage(message, extraInput))
  }
}
