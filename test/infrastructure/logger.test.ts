import {
  vi, describe, expect, test, beforeEach, afterEach
} from 'vitest'
import type { MockInstance } from 'vitest'

import { ConsoleLogger } from '@/infrastructure/logger'

describe('Infrastructure > ConsoleLogger', () => {
  let consoleDebugSpy: MockInstance
  let consoleInfoSpy: MockInstance
  let consoleWarnSpy: MockInstance
  let consoleErrorSpy: MockInstance

  beforeEach(() => {
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('should log debug message without extra input', () => {
    // arrange
    const logger = new ConsoleLogger()
    const message = 'Debug message'

    // act
    logger.debug(message)

    // assert
    expect(consoleDebugSpy).toHaveBeenCalledWith(message)
  })

  test('should log debug message with extra input', () => {
    // arrange
    const logger = new ConsoleLogger()
    const message = 'Debug message'
    const extraInput = { userId: 123, action: 'test' }

    // act
    logger.debug(message, extraInput)

    // assert
    expect(consoleDebugSpy).toHaveBeenCalledWith(`${message} ${JSON.stringify(extraInput)}`)
  })

  test('should log info message without extra input', () => {
    // arrange
    const logger = new ConsoleLogger()
    const message = 'Info message'

    // act
    logger.info(message)

    // assert
    expect(consoleInfoSpy).toHaveBeenCalledWith(message)
  })

  test('should log info message with extra input', () => {
    // arrange
    const logger = new ConsoleLogger()
    const message = 'Info message'
    const extraInput = { status: 'success' }

    // act
    logger.info(message, extraInput)

    // assert
    expect(consoleInfoSpy).toHaveBeenCalledWith(`${message} ${JSON.stringify(extraInput)}`)
  })

  test('should log warn message without extra input', () => {
    // arrange
    const logger = new ConsoleLogger()
    const message = 'Warning message'

    // act
    logger.warn(message)

    // assert
    expect(consoleWarnSpy).toHaveBeenCalledWith(message)
  })

  test('should log warn message with extra input', () => {
    // arrange
    const logger = new ConsoleLogger()
    const message = 'Warning message'
    const extraInput = { warning: 'deprecated method' }

    // act
    logger.warn(message, extraInput)

    // assert
    expect(consoleWarnSpy).toHaveBeenCalledWith(`${message} ${JSON.stringify(extraInput)}`)
  })

  test('should log error message without extra input', () => {
    // arrange
    const logger = new ConsoleLogger()
    const message = 'Error message'

    // act
    logger.error(message)

    // assert
    expect(consoleErrorSpy).toHaveBeenCalledWith(message)
  })

  test('should log error message with extra input', () => {
    // arrange
    const logger = new ConsoleLogger()
    const message = 'Error message'
    const extraInput = { error: 'Connection failed', code: 500 }

    // act
    logger.error(message, extraInput)

    // assert
    expect(consoleErrorSpy).toHaveBeenCalledWith(`${message} ${JSON.stringify(extraInput)}`)
  })

  test('should format message correctly with null extra input', () => {
    // arrange
    const logger = new ConsoleLogger()
    const message = 'Test message'

    // act
    logger.info(message, null)

    // assert
    expect(consoleInfoSpy).toHaveBeenCalledWith(message)
  })

  test('should format message correctly with undefined extra input', () => {
    // arrange
    const logger = new ConsoleLogger()
    const message = 'Test message'

    // act
    logger.info(message, undefined)

    // assert
    expect(consoleInfoSpy).toHaveBeenCalledWith(message)
  })

  test('should format message correctly with complex object', () => {
    // arrange
    const logger = new ConsoleLogger()
    const message = 'Complex object'
    const extraInput = {
      user: { id: 1, name: 'John' },
      metadata: { timestamp: '2025-11-01', nested: { value: 42 } }
    }

    // act
    logger.debug(message, extraInput)

    // assert
    expect(consoleDebugSpy).toHaveBeenCalledWith(`${message} ${JSON.stringify(extraInput)}`)
  })

  test('should format message correctly with array', () => {
    // arrange
    const logger = new ConsoleLogger()
    const message = 'Array data'
    const extraInput = [
      1,
      2,
      3,
      4,
      5
    ]

    // act
    logger.info(message, extraInput)

    // assert
    expect(consoleInfoSpy).toHaveBeenCalledWith(`${message} ${JSON.stringify(extraInput)}`)
  })
})
