import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'integration',
    environment: 'node',
    include: [
      'tests/integration/**/*.test.{ts,tsx}',
      'tests/**/*.integration.test.{ts,tsx}',
      'tests/comprehensive-integration.test.ts',
      'tests/end-to-end-workflows.test.ts'
    ],
    exclude: [
      'tests/unit/**',
      'tests/e2e/**',
      'tests/load/**',
      'tests/playwright/**',
      'src/**/*.test.{ts,tsx}',
      'node_modules/**'
    ],
    setupFiles: ['tests/setup.ts'],
    teardownTimeout: 30000,
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      reporter: ['text', 'json'],
      include: [
        'src/**/*.{ts,tsx}',
        'server/**/*.{js,ts}'
      ],
      exclude: [
        'tests/**',
        '**/*.d.ts',
        '**/*.config.{ts,js}',
        'src/types/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 75,
          lines: 75,
          statements: 75
        }
      }
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        maxWorkers: 2,
        minWorkers: 1
      }
    },
    sequence: {
      hooks: 'parallel',
      concurrent: false
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, './')
    }
  }
});