/**
 * Basic Usage Example - Memory Performance Monitoring System
 */

const path = require('path');
const { initializeMemoryMonitoring, quickHealthCheck } = require('../index');

async function basicExample() {
    console.log('🚀 Memory Monitoring Basic Example\n');

    // 1. Quick health check
    console.log('1. Performing quick health check:');
    const health = quickHealthCheck();
    console.log();

    // 2. Initialize full monitoring system
    console.log('2. Initializing comprehensive memory monitoring...');
    try {
        const dashboard = await initializeMemoryMonitoring({
            monitor: {
                sampleInterval: 2000,        // Sample every 2 seconds
                historySize: 100,           // Keep 100 samples
                memoryThresholds: {
                    warning: 0.7,           // 70% threshold
                    critical: 0.85,         // 85% threshold
                    emergency: 0.95         // 95% threshold
                }
            },
            alerts: {
                actionTriggers: {
                    autoGC: true,           // Auto garbage collection
                    memoryDump: false,      // Disable auto dumps for example
                    alertNotifications: true
                },
                notifications: {
                    console: true,          // Console notifications
                    file: true             // File logging
                }
            },
            optimization: {
                autoOptimization: {
                    enabled: true,
                    aggressiveness: 'moderate', // Conservative for example
                    maxAutomations: 3          // Limit automations
                }
            },
            enableWebDashboard: true,
            dashboardPort: 3001,
            retentionDays: 1                   // Short retention for example
        });

        // 3. Set up event listeners
        console.log('3. Setting up event listeners...');
        
        dashboard.on('dashboard:started', () => {
            console.log('✅ Memory monitoring dashboard started successfully');
            console.log('🌐 Web dashboard available at http://localhost:3001');
        });

        dashboard.on('alert:generated', (alert) => {
            console.log(`🚨 Alert: ${alert.level.toUpperCase()} - ${alert.message}`);
        });

        dashboard.on('optimization:automated', (data) => {
            console.log(`🤖 Automated optimization: ${data.recommendation.title}`);
        });

        dashboard.on('session:completed', (session) => {
            console.log(`📊 Session completed: ${session.id}`);
        });

        // 4. Generate some memory usage for demonstration
        console.log('4. Generating memory usage patterns...');
        await simulateMemoryUsage();

        // 5. Wait and then generate a report
        setTimeout(async () => {
            console.log('\n5. Generating memory report...');
            const { report, filepath } = await dashboard.generateMemoryReport();
            console.log(`📄 Report generated: ${filepath}`);
            console.log(`📊 Health Score: ${report.healthScore.toFixed(3)}`);
            console.log(`📈 Status: ${report.healthStatus}`);
        }, 15000); // Wait 15 seconds

        // Keep running for demonstration
        console.log('\n⏱️  Monitoring will run for 30 seconds...');
        setTimeout(() => {
            console.log('\n🛑 Stopping monitoring...');
            dashboard.stop();
        }, 30000);

    } catch (error) {
        console.error('❌ Failed to initialize memory monitoring:', error);
    }
}

/**
 * Simulate memory usage patterns for demonstration
 */
async function simulateMemoryUsage() {
    const data = [];
    
    // Create some memory pressure
    for (let i = 0; i < 1000; i++) {
        data.push(new Array(1000).fill(`memory-test-${i}`));
        
        if (i % 100 === 0) {
            console.log(`   Creating memory pressure: ${i}/1000`);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    console.log('   Memory simulation completed');
    return data; // Keep reference to prevent immediate GC
}

// Run example if called directly
if (require.main === module) {
    basicExample().catch(console.error);
}

module.exports = { basicExample };