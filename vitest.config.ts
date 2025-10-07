import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
    test: {
      name: 'gentle-space-realty',
      globals: true,
      environment: 'jsdom',
      include: [
        'src/**/*.test.{ts,tsx}',
        'tests/**/*.test.{ts,tsx}',
        'tests/**/*.spec.{ts,tsx}'
      ],
      exclude: [
        'node_modules',
        'dist',
        '.idea',
        '.git',
        '.cache',
        'coverage',
        'build'
      ],
      setupFiles: ['tests/vitest-setup.js'],
      testTimeout: 30000,
      hookTimeout: 30000,
      teardownTimeout: 30000,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        reportsDirectory: './coverage',
        include: [
          'src/**/*.{ts,tsx}'
        ],
        exclude: [
          'tests/**',
          '**/*.d.ts',
          '**/*.config.{ts,js}',
          'src/types/**',
          'src/**/*.stories.{ts,tsx}',
          'src/**/*.test.{ts,tsx}',
          'src/**/*.spec.{ts,tsx}',
          'node_modules/**'
        ],
        thresholds: {
          global: {
            branches: 75,
            functions: 80,
            lines: 80,
            statements: 80
          }
        },
        all: true,
        skipFull: false
      },
      pool: 'threads',
      poolOptions: {
        threads: {
          maxWorkers: '50%',
          minWorkers: 1,
          useAtomics: true
        }
      },
      sequence: {
        hooks: 'parallel',
        concurrent: true
      },
      maxConcurrency: 5,
      logHeapUsage: true,
      passWithNoTests: true,
      watch: {
        exclude: [
          'node_modules/**',
          'dist/**',
          'coverage/**',
          '.git/**'
        ]
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '~': path.resolve(__dirname, './')
      }
    }
});