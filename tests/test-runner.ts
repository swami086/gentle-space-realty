#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import chalk from 'chalk';

interface TestSuite {
  name: string;
  command: string;
  description: string;
  timeout: number;
  dependencies?: string[];
}

interface TestResults {
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

const testSuites: TestSuite[] = [
  {
    name: 'unit',
    command: 'npm run test:unit',
    description: 'Unit tests for business logic services',
    timeout: 60000, // 1 minute
  },
  {
    name: 'integration-api',
    command: 'npm run test:integration -- --testPathPattern="api"',
    description: 'Integration tests for API endpoints',
    timeout: 300000, // 5 minutes
    dependencies: ['unit'],
  },
  {
    name: 'integration-database',
    command: 'npm run test:integration -- --testPathPattern="database"',
    description: 'Database integration tests with testcontainers',
    timeout: 600000, // 10 minutes
    dependencies: ['unit'],
  },
  {
    name: 'integration-auth',
    command: 'npm run test:integration -- --testPathPattern="auth"',
    description: 'Authentication and authorization flow tests',
    timeout: 300000, // 5 minutes
    dependencies: ['unit', 'integration-database'],
  },
  {
    name: 'integration-uploads',
    command: 'npm run test:integration -- --testPathPattern="uploads"',
    description: 'File upload integration tests',
    timeout: 180000, // 3 minutes
    dependencies: ['unit', 'integration-database'],
  },
  {
    name: 'integration-rate-limiting',
    command: 'npm run test:integration -- --testPathPattern="rate-limiting"',
    description: 'Rate limiting validation tests',
    timeout: 600000, // 10 minutes
    dependencies: ['unit', 'integration-database'],
  },
  {
    name: 'security',
    command: 'npm run test:security',
    description: 'Security tests for SQL injection and XSS prevention',
    timeout: 300000, // 5 minutes
    dependencies: ['unit', 'integration-database'],
  },
  {
    name: 'performance',
    command: 'npm run test:performance',
    description: 'Performance tests with 500+ properties',
    timeout: 1800000, // 30 minutes
    dependencies: ['unit', 'integration-database'],
  },
  {
    name: 'load',
    command: 'npm run test:load',
    description: 'Load tests with k6',
    timeout: 900000, // 15 minutes
    dependencies: ['performance'],
  },
];

class TestRunner {
  private results = new Map<string, TestResults>();
  private startTime: number = 0;

  async run(suiteNames?: string[]): Promise<void> {
    console.log(chalk.blue.bold('🧪 Gentle Space Realty - Comprehensive Test Suite\n'));

    this.startTime = Date.now();

    // Validate environment
    await this.validateEnvironment();

    // Filter test suites if specific ones are requested
    const suitesToRun = suiteNames 
      ? testSuites.filter(suite => suiteNames.includes(suite.name))
      : testSuites;

    if (suitesToRun.length === 0) {
      console.log(chalk.red('❌ No matching test suites found'));
      process.exit(1);
    }

    // Run test suites in dependency order
    const executionOrder = this.resolveDependencies(suitesToRun);
    
    console.log(chalk.cyan('📋 Test Execution Plan:'));
    executionOrder.forEach((suite, index) => {
      console.log(`  ${index + 1}. ${suite.name} - ${suite.description}`);
    });
    console.log();

    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    for (const suite of executionOrder) {
      const result = await this.runSuite(suite);
      this.results.set(suite.name, result);

      totalPassed += result.passed;
      totalFailed += result.failed;
      totalSkipped += result.skipped;

      // Stop on failure unless running in CI mode
      if (result.failed > 0 && !process.env.CI) {
        console.log(chalk.red('\n❌ Stopping execution due to test failures'));
        break;
      }
    }

    // Print summary
    this.printSummary(totalPassed, totalFailed, totalSkipped);

    // Exit with appropriate code
    process.exit(totalFailed > 0 ? 1 : 0);
  }

  private async validateEnvironment(): Promise<void> {
    console.log(chalk.cyan('🔍 Validating test environment...'));

    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`  Node.js version: ${nodeVersion}`);

    // Check required packages
    const requiredPackages = ['jest', 'supertest', 'testcontainers'];
    for (const pkg of requiredPackages) {
      try {
        require.resolve(pkg);
        console.log(`  ✅ ${pkg} is available`);
      } catch {
        console.log(`  ❌ ${pkg} is missing`);
        throw new Error(`Required package ${pkg} is not installed`);
      }
    }

    // Check test directories
    const testDirs = ['unit', 'integration', 'security', 'load', 'fixtures'];
    for (const dir of testDirs) {
      const dirPath = path.join(process.cwd(), 'tests', dir);
      if (existsSync(dirPath)) {
        console.log(`  ✅ tests/${dir}/ directory exists`);
      } else {
        console.log(`  ❌ tests/${dir}/ directory missing`);
      }
    }

    // Check Docker (for testcontainers)
    try {
      execSync('docker --version', { stdio: 'pipe' });
      console.log('  ✅ Docker is available');
    } catch {
      console.log('  ⚠️  Docker not available (testcontainer tests may fail)');
    }

    console.log();
  }

  private resolveDependencies(suites: TestSuite[]): TestSuite[] {
    const resolved: TestSuite[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (suite: TestSuite) => {
      if (visiting.has(suite.name)) {
        throw new Error(`Circular dependency detected: ${suite.name}`);
      }
      
      if (visited.has(suite.name)) {
        return;
      }

      visiting.add(suite.name);

      if (suite.dependencies) {
        for (const depName of suite.dependencies) {
          const dep = suites.find(s => s.name === depName);
          if (dep) {
            visit(dep);
          }
        }
      }

      visiting.delete(suite.name);
      visited.add(suite.name);
      resolved.push(suite);
    };

    for (const suite of suites) {
      visit(suite);
    }

    return resolved;
  }

  private async runSuite(suite: TestSuite): Promise<TestResults> {
    console.log(chalk.yellow.bold(`\n🚀 Running ${suite.name} tests...`));
    console.log(chalk.gray(`   ${suite.description}`));

    const startTime = Date.now();
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    try {
      // Set environment variables for test
      const env = {
        ...process.env,
        NODE_ENV: 'test',
        TEST_SUITE: suite.name,
      };

      const output = execSync(suite.command, {
        stdio: 'pipe',
        timeout: suite.timeout,
        env,
      }).toString();

      // Parse Jest output to extract results
      const results = this.parseJestOutput(output);
      passed = results.passed;
      failed = results.failed;
      skipped = results.skipped;

      if (failed === 0) {
        console.log(chalk.green(`✅ ${suite.name} tests completed successfully`));
        console.log(chalk.green(`   ${passed} passed, ${skipped} skipped`));
      } else {
        console.log(chalk.red(`❌ ${suite.name} tests failed`));
        console.log(chalk.red(`   ${passed} passed, ${failed} failed, ${skipped} skipped`));
      }

    } catch (error: any) {
      failed = 1; // Mark as failed
      console.log(chalk.red(`❌ ${suite.name} tests failed with error:`));
      
      if (error.stdout) {
        const results = this.parseJestOutput(error.stdout.toString());
        passed = results.passed;
        failed = results.failed || 1;
        skipped = results.skipped;
        
        console.log(chalk.red(`   ${passed} passed, ${failed} failed, ${skipped} skipped`));
      } else {
        console.log(chalk.red(`   Error: ${error.message}`));
      }
    }

    const duration = Date.now() - startTime;
    console.log(chalk.gray(`   Duration: ${(duration / 1000).toFixed(2)}s`));

    return { passed, failed, skipped, duration };
  }

  private parseJestOutput(output: string): { passed: number; failed: number; skipped: number } {
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    // Look for Jest test results summary
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    const skippedMatch = output.match(/(\d+) skipped/);

    if (passedMatch) passed = parseInt(passedMatch[1]);
    if (failedMatch) failed = parseInt(failedMatch[1]);
    if (skippedMatch) skipped = parseInt(skippedMatch[1]);

    // Alternative parsing for different Jest output formats
    if (passed === 0 && failed === 0 && skipped === 0) {
      const testMatch = output.match(/Tests:\s+(\d+)\s+passed/);
      if (testMatch) passed = parseInt(testMatch[1]);
    }

    return { passed, failed, skipped };
  }

  private printSummary(totalPassed: number, totalFailed: number, totalSkipped: number): void {
    const totalDuration = Date.now() - this.startTime;
    
    console.log(chalk.blue.bold('\n📊 Test Results Summary'));
    console.log('═'.repeat(50));

    // Suite-by-suite results
    for (const [suiteName, result] of this.results) {
      const status = result.failed === 0 ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
      const duration = chalk.gray(`(${(result.duration / 1000).toFixed(2)}s)`);
      
      console.log(`${status} ${suiteName.padEnd(20)} ${result.passed} passed, ${result.failed} failed, ${result.skipped} skipped ${duration}`);
    }

    console.log('─'.repeat(50));

    // Overall results
    const overallStatus = totalFailed === 0 ? chalk.green.bold('✅ ALL TESTS PASSED') : chalk.red.bold('❌ SOME TESTS FAILED');
    console.log(`${overallStatus}`);
    console.log(`Total: ${totalPassed + totalFailed + totalSkipped} tests`);
    console.log(`${chalk.green(`✅ Passed: ${totalPassed}`)}`);
    
    if (totalFailed > 0) {
      console.log(`${chalk.red(`❌ Failed: ${totalFailed}`)}`);
    }
    
    if (totalSkipped > 0) {
      console.log(`${chalk.yellow(`⏭️  Skipped: ${totalSkipped}`)}`);
    }
    
    console.log(`Duration: ${(totalDuration / 1000).toFixed(2)}s`);

    // Coverage information
    if (existsSync(path.join(process.cwd(), 'coverage'))) {
      console.log(`${chalk.blue('📈 Coverage report:')} file:///${path.join(process.cwd(), 'coverage/lcov-report/index.html')}`);
    }

    console.log('═'.repeat(50));
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new TestRunner();

  if (args.length === 0) {
    // Run all tests
    await runner.run();
  } else {
    // Run specific test suites
    const validSuites = testSuites.map(s => s.name);
    const invalidArgs = args.filter(arg => !validSuites.includes(arg));
    
    if (invalidArgs.length > 0) {
      console.log(chalk.red(`❌ Invalid test suite(s): ${invalidArgs.join(', ')}`));
      console.log(chalk.yellow(`Valid options: ${validSuites.join(', ')}`));
      process.exit(1);
    }

    await runner.run(args);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n⏹️  Test execution interrupted'));
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n⏹️  Test execution terminated'));
  process.exit(143);
});

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('💥 Test runner failed:'), error);
    process.exit(1);
  });
}

export { TestRunner, testSuites };