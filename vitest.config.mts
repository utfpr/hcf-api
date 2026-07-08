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
          name: 'integration',
          globals: true,
          environment: 'node',
          include: ['test/integration/**/*.test.ts', 'test/integration/**/*.spec.ts'],
          setupFiles: ['test/integration/setup/load-env.ts'],
          globalSetup: ['test/integration/setup/global-setup.ts']
        }
      }
    ]
  }
})
