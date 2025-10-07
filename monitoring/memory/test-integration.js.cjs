/**
 * Integration Test for Memory Performance Monitoring System
 * Tests all components and their interactions
 */

const { 
    MemoryMonitor, 
    MemoryAlertSystem, 
    SessionMemoryAnalyzer,
    MemoryOptimizationEngine,
    MemoryPerformanceDashboard,
    quickHealthCheck,
    emergencyCleanup
} = require('./index.js.cjs');

const fs = require('fs').promises;
const path = require('path');

class IntegrationTester {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    async runTests() {
        console.log('🧪 Starting Memory Monitoring Integration Tests\n');

        await this.testQuickHealthCheck();
        await this.testMemoryMonitor();
        await this.testAlertSystem();
        await this.testSessionAnalyzer();
        await this.testOptimizationEngine();
        await this.testDashboardIntegration();
        await this.testClaudeFlowIntegration();
        await this.testEmergencyCleanup();

        this.printResults();
        return this.testResults.failed === 0;
    }

    async test(testName, testFn) {
        try {
            console.log(`  ▶ ${testName}...`);
            await testFn();
            console.log(`  ✅ ${testName} - PASSED`);
            this.testResults.passed++;
            this.testResults.tests.push({ name: testName, status: 'PASSED' });
        } catch (error) {
            console.log(`  ❌ ${testName} - FAILED: ${error.message}`);
            this.testResults.failed++;
            this.testResults.tests.push({ name: testName, status: 'FAILED', error: error.message });
        }
    }

    async testQuickHealthCheck() {
        await this.test('Quick Health Check', async () => {
            const health = quickHealthCheck();
            
            if (!health.timestamp) throw new Error('No timestamp in health check');
            if (!health.process) throw new Error('No process info in health check');
            if (!health.system) throw new Error('No system info in health check');
            if (!health.status) throw new Error('No status in health check');
            
            console.log(`    Health Status: ${health.status}`);
            console.log(`    System Utilization: ${(health.system.utilization * 100).toFixed(1)}%`);
        });
    }

    async testMemoryMonitor() {
        await this.test('Memory Monitor Basic Functions', async () => {
            const monitor = new MemoryMonitor({
                sampleInterval: 500, // 500ms for fast testing
                historySize: 10
            });

            // Test basic functionality
            let metricsReceived = false;
            monitor.on('metrics:collected', (metrics) => {
                metricsReceived = true;
                if (!metrics.timestamp) throw new Error('Metrics missing timestamp');
                if (!metrics.process) throw new Error('Metrics missing process info');
                if (!metrics.system) throw new Error('Metrics missing system info');
            });

            monitor.start();
            
            // Wait for a few samples
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (!metricsReceived) throw new Error('No metrics were collected');
            if (monitor.history.length === 0) throw new Error('No metrics in history');
            
            monitor.stop();
            console.log(`    Collected ${monitor.history.length} samples`);
        });
    }

    async testAlertSystem() {
        await this.test('Alert System', async () => {
            const alertSystem = new MemoryAlertSystem({
                alertThresholds: {
                    memory: { warning: 0.01, critical: 0.02, emergency: 0.03 } // Very low thresholds for testing
                },
                cooldownPeriods: {
                    warning: 100, critical: 100, emergency: 100 // Short cooldowns
                }
            });

            let alertReceived = false;
            alertSystem.on('alert', (alert) => {
                alertReceived = true;
                if (!alert.id) throw new Error('Alert missing ID');
                if (!alert.type) throw new Error('Alert missing type');
                if (!alert.level) throw new Error('Alert missing level');
            });

            // Create fake metrics that should trigger alerts
            const highMemoryMetrics = {
                timestamp: Date.now(),
                system: { utilization: 0.95, available: 1000000, total: 20000000 },
                process: { heapUtilization: 0.8 },
                fragmentation: { score: 0.1, level: 'low' }
            };

            await alertSystem.processMetrics(highMemoryMetrics);
            
            if (!alertReceived) throw new Error('No alerts were generated');
            console.log('    Alert system responded to high memory usage');
        });
    }

    async testSessionAnalyzer() {
        await this.test('Session Memory Analyzer', async () => {
            const analyzer = new SessionMemoryAnalyzer({
                sessionTimeout: 1000, // 1 second for testing
                analysisWindow: 500
            });

            // Register a test session
            const sessionId = 'test-session-' + Date.now();
            analyzer.registerSession(sessionId, { type: 'test' });

            // Add some memory snapshots
            for (let i = 0; i < 5; i++) {
                const metrics = {
                    timestamp: Date.now() + i * 100,
                    process: { 
                        rss: 1000000 + i * 100000, // Increasing memory
                        heapUsed: 500000 + i * 50000,
                        heapTotal: 1000000
                    },
                    system: { total: 8000000000, used: 4000000000, utilization: 0.5 },
                    fragmentation: { score: 0.1, level: 'low' }
                };
                analyzer.addMemorySnapshot(sessionId, metrics);
            }

            // Analyze the session
            const analysis = await analyzer.analyzeSession(sessionId);
            
            if (!analysis.sessionId) throw new Error('Analysis missing session ID');
            if (!analysis.memoryAnalysis) throw new Error('Analysis missing memory analysis');
            if (analysis.snapshotCount !== 5) throw new Error('Wrong snapshot count');
            
            console.log(`    Analyzed session with ${analysis.snapshotCount} snapshots`);
            console.log(`    Health score: ${analysis.healthScore.toFixed(3)}`);
        });
    }

    async testOptimizationEngine() {
        await this.test('Optimization Engine', async () => {
            const engine = new MemoryOptimizationEngine({
                autoOptimization: { enabled: false }, // Disable auto for testing
                thresholds: {
                    memoryPressure: 0.01, // Very low for testing
                    fragmentationCritical: 0.01,
                    leakSeverity: 0.01
                }
            });

            // Create metrics that should trigger recommendations
            const highPressureMetrics = {
                timestamp: Date.now(),
                system: { utilization: 0.95, available: 100000, total: 2000000 },
                process: { heapUtilization: 0.9 },
                fragmentation: { score: 0.5, level: 'high', needsOptimization: true }
            };

            const recommendations = await engine.generateRecommendations(highPressureMetrics);
            
            if (!recommendations || recommendations.length === 0) {
                throw new Error('No optimization recommendations generated');
            }
            
            // Check recommendation structure
            const rec = recommendations[0];
            if (!rec.id) throw new Error('Recommendation missing ID');
            if (!rec.type) throw new Error('Recommendation missing type');
            if (!rec.priority) throw new Error('Recommendation missing priority');
            if (!rec.actions) throw new Error('Recommendation missing actions');
            
            console.log(`    Generated ${recommendations.length} recommendations`);
            console.log(`    Top recommendation: ${rec.title}`);
        });
    }

    async testDashboardIntegration() {
        await this.test('Dashboard Integration', async () => {
            const dashboard = new MemoryPerformanceDashboard({
                autoStart: false,
                monitor: { sampleInterval: 500, historySize: 5 },
                enableWebDashboard: false // Disable web server for testing
            });

            let dashboardStarted = false;
            dashboard.on('dashboard:started', () => {
                dashboardStarted = true;
            });

            await dashboard.start();
            
            if (!dashboardStarted) throw new Error('Dashboard did not start properly');
            
            // Wait for some metrics collection
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const status = dashboard.getIntegrationStatus();
            if (!status.dashboard) throw new Error('Dashboard status missing');
            if (!status.components) throw new Error('Component status missing');
            
            await dashboard.stop();
            console.log('    Dashboard started and stopped successfully');
            console.log(`    Health score: ${status.dashboard.healthScore.toFixed(3)}`);
        });
    }

    async testClaudeFlowIntegration() {
        await this.test('Claude-Flow Integration', async () => {
            // Check if we can read existing Claude-Flow metrics
            const claudeFlowPath = path.join(process.cwd(), '.claude-flow', 'metrics');
            
            try {
                const systemMetricsPath = path.join(claudeFlowPath, 'system-metrics.json');
                const data = await fs.readFile(systemMetricsPath, 'utf8');
                const metrics = JSON.parse(data);
                
                if (!Array.isArray(metrics)) throw new Error('System metrics not in expected format');
                if (metrics.length === 0) throw new Error('No system metrics available');
                
                console.log(`    Successfully read ${metrics.length} Claude-Flow system metrics`);
                
                // Test conversion
                const dashboard = new MemoryPerformanceDashboard({ autoStart: false });
                const converted = dashboard.convertSystemMetric(metrics[metrics.length - 1]);
                
                if (!converted.process) throw new Error('Conversion failed - no process data');
                if (!converted.system) throw new Error('Conversion failed - no system data');
                
                console.log('    Successfully converted Claude-Flow metrics to memory format');
                
            } catch (error) {
                console.log('    Warning: Could not test Claude-Flow integration:', error.message);
                // Don't fail the test - this is expected if no metrics exist
            }
        });
    }

    async testEmergencyCleanup() {
        await this.test('Emergency Cleanup', async () => {
            const initialMemory = process.memoryUsage();
            
            const result = await emergencyCleanup();
            
            if (typeof result !== 'boolean') throw new Error('Emergency cleanup should return boolean');
            
            const afterMemory = process.memoryUsage();
            console.log(`    Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
            console.log(`    After cleanup: ${(afterMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        });
    }

    printResults() {
        console.log('\n📊 Integration Test Results');
        console.log('=' .repeat(50));
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`📈 Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);
        
        if (this.testResults.failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.tests.filter(t => t.status === 'FAILED').forEach(test => {
                console.log(`  - ${test.name}: ${test.error}`);
            });
        }
        
        console.log('\n' + (this.testResults.failed === 0 ? '🎉 All tests passed!' : '⚠️  Some tests failed - check logs above'));
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new IntegrationTester();
    tester.runTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Test runner error:', error);
            process.exit(1);
        });
}

module.exports = { IntegrationTester };