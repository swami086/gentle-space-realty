import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'unit',
    environment: 'jsdom',
    include: [
      'src/**/*.test.{ts,tsx}',
      'tests/unit/**/*.test.{ts,tsx}',
      'tests/services/**/*.test.{ts,tsx}'
    ],
    exclude: [
      'tests/integration/**',
      'tests/e2e/**',
      'tests/load/**',
      'tests/security/**',
      'tests/**/*.integration.test.{ts,tsx}',
      'tests/**/*.e2e.test.{ts,tsx}',
      'node_modules/**'
    ],
    setupFiles: ['tests/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'tests/**',
        '**/*.d.ts',
        '**/*.config.{ts,js}',
        'src/types/**',
        'src/**/*.stories.{ts,tsx}',
        'src/**/*.test.{ts,tsx}'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        maxWorkers: 4,
        minWorkers: 1
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, './')
    }
  }
});