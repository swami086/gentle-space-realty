/**
 * Memory Performance Monitoring System - Main Entry Point
 * Comprehensive memory monitoring, alerting, and optimization system for hive mind operations
 */

const MemoryMonitor = require('./MemoryMonitor.js.cjs');
const MemoryAlertSystem = require('./MemoryAlertSystem.js.cjs');
const SessionMemoryAnalyzer = require('./SessionMemoryAnalyzer.js.cjs');
const MemoryOptimizationEngine = require('./MemoryOptimizationEngine.js.cjs');
const MemoryPerformanceDashboard = require('./MemoryPerformanceDashboard.js.cjs');

/**
 * Initialize and start comprehensive memory monitoring
 */
async function initializeMemoryMonitoring(options = {}) {
    const dashboard = new MemoryPerformanceDashboard(options);
    
    try {
        await dashboard.start();
        return dashboard;
    } catch (error) {
        console.error('Failed to initialize memory monitoring:', error);
        throw error;
    }
}

/**
 * Quick setup for basic memory monitoring
 */
function quickSetup(options = {}) {
    const monitor = new MemoryMonitor(options);
    const alertSystem = new MemoryAlertSystem(options);
    
    // Connect monitor to alert system
    monitor.on('metrics:collected', (metrics) => {
        alertSystem.processMetrics(metrics);
    });
    
    monitor.on('leak:detected', (leakDetection) => {
        alertSystem.processLeakDetection(leakDetection);
    });
    
    monitor.start();
    
    return { monitor, alertSystem };
}

/**
 * Integration with existing Claude-Flow monitoring
 */
function integrateWithClaudeFlow(claudeFlowMetrics) {
    const dashboard = new MemoryPerformanceDashboard({
        autoStart: false,
        integrationMode: 'monitor'
    });
    
    // Process existing metrics
    if (Array.isArray(claudeFlowMetrics)) {
        for (const metric of claudeFlowMetrics) {
            const convertedMetric = dashboard.convertSystemMetric(metric);
            dashboard.memoryMonitor.addToHistory(convertedMetric);
        }
    }
    
    return dashboard.start();
}

/**
 * Emergency memory cleanup
 */
async function emergencyCleanup() {
    console.log('🚨 Performing emergency memory cleanup...');
    
    try {
        // Force garbage collection if available
        if (global.gc) {
            const beforeMemory = process.memoryUsage();
            global.gc();
            const afterMemory = process.memoryUsage();
            const freedMemory = beforeMemory.heapUsed - afterMemory.heapUsed;
            
            console.log(`🧹 GC freed ${(freedMemory / 1024 / 1024).toFixed(2)} MB`);
        }
        
        // Clear caches if available
        if (global.applicationCache) {
            global.applicationCache.clear();
        }
        
        console.log('✅ Emergency cleanup completed');
        return true;
        
    } catch (error) {
        console.error('❌ Emergency cleanup failed:', error);
        return false;
    }
}

/**
 * Generate quick memory health check
 */
function quickHealthCheck() {
    const memory = process.memoryUsage();
    const systemMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    const systemUtilization = (systemMemory - freeMemory) / systemMemory;
    
    const health = {
        timestamp: Date.now(),
        process: {
            heapUtilization: memory.heapUsed / memory.heapTotal,
            rssGB: (memory.rss / 1024 / 1024 / 1024).toFixed(2)
        },
        system: {
            utilization: systemUtilization,
            availableGB: (freeMemory / 1024 / 1024 / 1024).toFixed(2),
            totalGB: (systemMemory / 1024 / 1024 / 1024).toFixed(2)
        },
        status: systemUtilization > 0.9 ? 'critical' :
                systemUtilization > 0.8 ? 'warning' :
                systemUtilization > 0.7 ? 'caution' : 'healthy'
    };
    
    console.log(`📊 Memory Health: ${health.status.toUpperCase()}`);
    console.log(`   System: ${(health.system.utilization * 100).toFixed(1)}% used`);
    console.log(`   Heap: ${(health.process.heapUtilization * 100).toFixed(1)}% used`);
    console.log(`   Available: ${health.system.availableGB} GB`);
    
    return health;
}

/**
 * CLI interface for memory monitoring
 */
function cli() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'start':
            console.log('🚀 Starting memory monitoring...');
            initializeMemoryMonitoring({
                enableWebDashboard: true,
                dashboardPort: args[1] || 3001
            });
            break;
            
        case 'quick':
            console.log('⚡ Starting quick monitoring...');
            quickSetup();
            break;
            
        case 'health':
            quickHealthCheck();
            break;
            
        case 'cleanup':
            emergencyCleanup();
            break;
            
        default:
            console.log(`
Memory Performance Monitoring System

Usage:
  node index.js start [port]     - Start full dashboard (default port: 3001)
  node index.js quick            - Start basic monitoring
  node index.js health           - Quick health check
  node index.js cleanup          - Emergency memory cleanup

Examples:
  node index.js start 3002       - Start dashboard on port 3002
  node index.js health           - Show current memory status
            `);
    }
}

// Export all components
module.exports = {
    MemoryMonitor,
    MemoryAlertSystem,
    SessionMemoryAnalyzer,
    MemoryOptimizationEngine,
    MemoryPerformanceDashboard,
    
    // Convenience functions
    initializeMemoryMonitoring,
    quickSetup,
    integrateWithClaudeFlow,
    emergencyCleanup,
    quickHealthCheck,
    cli
};

// Auto-start if called directly
if (require.main === module) {
    const autoStartMode = process.env.MEMORY_MONITOR_AUTO_START;
    
    if (autoStartMode === 'full') {
        initializeMemoryMonitoring();
    } else if (autoStartMode === 'quick') {
        quickSetup();
    } else if (process.argv.length > 2) {
        cli();
    } else {
        console.log('💡 Tip: Set MEMORY_MONITOR_AUTO_START=full or use node index.js --help');
    }
}