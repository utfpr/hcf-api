import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: [
        'text',
        'json',
        'html'
      ],
      include: ['src/**/*.ts'],
      exclude: ['src/database/migration/']
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          globals: true,
          environment: 'node',
          mockReset: true,
          clearMocks: true,
          include: ['test/unit/**/*.test.ts', 'test/unit/**/*.spec.ts']
        }
      },
      {
        extends: true,
        test: {
          name: 'e2e',
          globals: true,
          environment: 'node',
          include: ['test/e2e/**/*.test.ts', 'test/e2e/**/*.spec.ts'],
          setupFiles: ['test/e2e/setup/load-env.ts'],
          globalSetup: ['test/e2e/setup/global-setup.ts']
        }
      }
    ]
  }
})
