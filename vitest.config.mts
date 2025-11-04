import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    mockReset: true,
    clearMocks: true,
    include: ['test/**/*.test.ts', 'test/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: [
        'text',
        'json',
        'html'
      ],
      include: ['src/**/*.ts'],
      exclude: ['src/database/migration/']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
