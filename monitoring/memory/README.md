# Memory Performance Monitoring System

A comprehensive memory monitoring, alerting, and optimization system designed specifically for hive mind operations and complex distributed workflows.

## 🎯 Features

### Real-time Memory Monitoring
- **System & Process Memory**: Track both system-wide and process-specific memory usage
- **Heap Analysis**: Monitor heap utilization, fragmentation, and garbage collection efficiency
- **Session Tracking**: Analyze memory patterns across different operational sessions
- **Historical Data**: Maintain detailed history with configurable retention periods

### Advanced Leak Detection
- **Sustained Growth Detection**: Identify continuous memory growth patterns
- **Staircase Pattern Detection**: Catch periodic allocation without cleanup
- **GC Inefficiency Detection**: Monitor garbage collection effectiveness
- **Multi-Algorithm Analysis**: Combine multiple detection methods for accuracy

### Intelligent Alerting
- **Tiered Alert System**: Warning, critical, and emergency alert levels
- **Smart Cooldowns**: Prevent alert flooding while maintaining responsiveness
- **Automated Actions**: Trigger garbage collection, cache clearing, memory dumps
- **Multiple Notification Channels**: Console, file, webhook, email support

### Performance Optimization
- **Automated Recommendations**: AI-driven optimization suggestions
- **Pattern Learning**: Learn from successful optimizations
- **Risk Assessment**: Evaluate optimization safety before implementation
- **Auto-Implementation**: Safely apply low-risk optimizations automatically

### Session Analysis
- **Growth Pattern Analysis**: Detect memory growth phases and patterns
- **Cross-Session Correlation**: Identify patterns across multiple sessions
- **Performance Impact Analysis**: Correlate memory usage with performance metrics
- **Health Scoring**: Calculate session and system health scores

## 🚀 Quick Start

### Basic Setup
```javascript
const { initializeMemoryMonitoring } = require('./monitoring/memory');

// Start full monitoring with web dashboard
const dashboard = await initializeMemoryMonitoring({
    enableWebDashboard: true,
    dashboardPort: 3001
});
```

### Quick Monitoring
```javascript
const { quickSetup } = require('./monitoring/memory');

// Basic monitoring without dashboard
const { monitor, alertSystem } = quickSetup({
    sampleInterval: 5000, // 5 seconds
    memoryWarning: 0.8,   // 80% threshold
    memoryEmergency: 0.95 // 95% threshold
});
```

### CLI Usage
```bash
# Start full dashboard
node monitoring/memory/index.js start

# Quick health check
node monitoring/memory/index.js health

# Emergency cleanup
node monitoring/memory/index.js cleanup
```

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 MemoryPerformanceDashboard                  │
│                    (Integration Hub)                        │
├─────────────────────────────────────────────────────────────┤
│  MemoryMonitor  │  AlertSystem  │  SessionAnalyzer  │ OptEngine │
│  - Real-time    │  - Intelligent │  - Pattern       │ - Auto     │
│    monitoring   │    alerting    │    analysis      │   optimize │
│  - Leak detect  │  - Auto actions│  - Health score  │ - Learning │
├─────────────────────────────────────────────────────────────┤
│              Integration Layer                              │
│  - Claude-Flow Metrics  - Monitoring System  - Memory Bank │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Configuration

### Memory Monitor Options
```javascript
{
    sampleInterval: 1000,           // Collection interval (ms)
    historySize: 1000,              // Max samples to keep
    memoryThresholds: {
        warning: 0.75,              // 75% system memory
        critical: 0.85,             // 85% system memory
        emergency: 0.95             // 95% system memory
    },
    leakDetection: {
        enabled: true,
        growthThreshold: 0.1,       // 10% growth threshold
        windowSize: 10              // Analysis window size
    },
    fragmentation: {
        enabled: true,
        threshold: 0.3              // 30% fragmentation threshold
    }
}
```

### Alert System Options
```javascript
{
    alertThresholds: {
        memory: { warning: 0.75, critical: 0.85, emergency: 0.95 },
        heap: { warning: 0.8, critical: 0.9, emergency: 0.95 },
        fragmentation: { warning: 0.3, critical: 0.5, emergency: 0.7 },
        leakScore: { warning: 0.5, critical: 0.7, emergency: 0.9 }
    },
    cooldownPeriods: {
        warning: 60000,             // 1 minute
        critical: 30000,            // 30 seconds
        emergency: 10000            // 10 seconds
    },
    actionTriggers: {
        autoGC: true,               // Auto garbage collection
        alertNotifications: true,
        emergencyShutdown: false,   // Emergency shutdown on critical
        memoryDump: true            // Auto memory dumps
    }
}
```

### Optimization Engine Options
```javascript
{
    autoOptimization: {
        enabled: true,
        aggressiveness: 'moderate', // conservative, moderate, aggressive
        maxAutomations: 5           // Max auto-optimizations per hour
    },
    learningMode: {
        enabled: true,
        patternRecognition: true,
        adaptiveThresholds: true
    }
}
```

## 🔍 Monitoring Capabilities

### Memory Metrics Collected
- **Process Memory**: RSS, heap total/used, external memory, array buffers
- **System Memory**: Total, free, used memory with utilization percentages
- **Garbage Collection**: Collection frequency, duration, efficiency
- **Fragmentation**: Heap and RSS fragmentation scores
- **Session Data**: Session-specific memory growth and patterns

### Leak Detection Algorithms

#### 1. Sustained Growth Detection
```javascript
// Detects continuous memory growth over time
const sustainedLeak = detectSustainedGrowth(recentWindow);
// Returns: { score: 0.8, detected: true, positiveGrowthRatio: 0.85 }
```

#### 2. Staircase Pattern Detection
```javascript
// Detects periodic allocation-hold-allocation patterns
const staircaseLeak = detectStaircasePattern(recentWindow);
// Returns: { score: 0.6, detected: true, jumpCount: 5, plateauCount: 15 }
```

#### 3. GC Inefficiency Detection
```javascript
// Monitors garbage collection effectiveness
const gcLeak = detectGCInefficiency(recentWindow);
// Returns: { score: 0.7, detected: true, averageEfficiency: 0.3 }
```

### Alert Types

#### Memory Pressure Alerts
- **System Memory**: Warning at 75%, critical at 85%, emergency at 95%
- **Heap Pressure**: Warning at 80%, critical at 90%, emergency at 95%
- **Fragmentation**: Warning at 30%, critical at 50%, emergency at 70%

#### Leak Detection Alerts
- **Sustained Growth**: Continuous memory increase over analysis window
- **Staircase Pattern**: Periodic large allocations without cleanup
- **GC Inefficiency**: Garbage collection not reclaiming expected memory

#### Performance Alerts
- **Performance Degradation**: Memory impact on system performance
- **Session Growth**: Excessive memory growth within sessions
- **Cross-Session Patterns**: Problematic patterns across multiple sessions

## 🛠️ Integration

### Claude-Flow Integration
The system automatically integrates with existing Claude-Flow metrics:

```javascript
// Automatic integration with .claude-flow/metrics/
const dashboard = new MemoryPerformanceDashboard({
    integrationMode: 'full'
});

// Syncs with system-metrics.json and performance.json
// Creates memory-integration.json for Claude-Flow consumption
```

### Monitoring System Integration
Integrates with the existing `/monitoring/` directory structure:

```javascript
// Syncs with monitoring/swarm-monitor.json
// Creates monitoring/memory-monitoring.json
// Logs to monitoring/memory/logs/
```

### Memory Bank Integration
Coordinates with the hive mind memory system:

```javascript
// Reads from memory/sessions/
// Analyzes memory/agents/ for agent-specific patterns
// Creates memory checkpoints for optimization
```

## 📈 Optimization Features

### Automated Optimizations
- **Garbage Collection**: Force GC when heap pressure is high
- **Cache Clearing**: Clear application caches during memory pressure
- **Heap Compaction**: Attempt heap defragmentation (engine-dependent)
- **Memory Dumps**: Create snapshots for analysis during critical events

### Intelligent Recommendations
```javascript
// Example optimization recommendation
{
    id: "memory_pressure_1757830101310",
    type: "memory_pressure",
    priority: "critical",
    urgency: "immediate",
    title: "Critical Memory Pressure - Immediate Action Required",
    actions: [
        {
            type: "force_gc",
            description: "Force garbage collection to free heap memory",
            automated: true,
            estimatedImpact: "medium",
            implementationTime: "immediate"
        }
    ],
    estimatedMemorySavings: "10-30%"
}
```

### Learning System
- **Pattern Recognition**: Learn from successful optimizations
- **Adaptive Thresholds**: Adjust alerting thresholds based on patterns
- **Success Tracking**: Monitor optimization success rates
- **Confidence Building**: Build confidence in optimization patterns over time

## 🔊 Alerting & Notifications

### Alert Levels
- **Warning**: Preventive alerts for early intervention
- **Critical**: Issues requiring prompt attention
- **Emergency**: Immediate action required, may trigger auto-shutdown

### Notification Channels
- **Console**: Colored console output with urgency indicators
- **File**: Structured logging to alert files
- **Webhook**: HTTP POST to configured endpoints
- **Email**: Email notifications for critical events (configurable)

### Auto-Actions
- **Force GC**: Automatic garbage collection on heap pressure
- **Cache Clear**: Clear application caches during memory pressure
- **Memory Dump**: Create heap snapshots for analysis
- **Emergency Shutdown**: Graceful shutdown on critical memory exhaustion

## 📊 Dashboard & Reporting

### Web Dashboard
Access the interactive dashboard at `http://localhost:3001` (default port):

- **Real-time Metrics**: Live memory usage, fragmentation, health scores
- **Alert Management**: View, acknowledge, and resolve alerts
- **Session Analysis**: Detailed session memory patterns
- **Optimization Tracking**: View recommendations and implementation results
- **Historical Charts**: Memory usage trends over time

### API Endpoints
```javascript
GET /api/status          // Current system status
GET /api/metrics         // Current and historical metrics
GET /api/alerts          // Recent alerts
GET /api/optimizations   // Current recommendations
POST /api/alerts/:id/acknowledge  // Acknowledge alert
```

### Report Generation
```javascript
// Generate comprehensive memory report
const { report, filepath } = await dashboard.generateMemoryReport();

// Export all dashboard data
const exportResult = await dashboard.exportDashboardData('json');
```

## 🧪 Advanced Features

### Session Memory Analysis
- **Growth Phase Detection**: Identify distinct memory growth phases
- **Cross-Session Correlation**: Find patterns across different sessions
- **Performance Impact**: Correlate memory usage with task performance
- **Health Scoring**: Calculate session health based on memory patterns

### Checkpoint Optimization
- **Size Optimization**: Compress memory checkpoints to reduce storage
- **Frequency Tuning**: Adjust checkpoint frequency based on memory patterns
- **Delta Compression**: Store only changes between checkpoints

### Fragmentation Analysis
- **Heap Fragmentation**: Monitor heap memory fragmentation
- **RSS Fragmentation**: Track resident set size fragmentation
- **Defragmentation Recommendations**: Suggest actions to reduce fragmentation

## 🔧 Troubleshooting

### Common Issues

#### High Memory Usage
```bash
# Quick health check
node monitoring/memory/index.js health

# Force garbage collection
node monitoring/memory/index.js cleanup
```

#### Memory Leaks
- Check the leak detection logs: `monitoring/memory/logs/memory-leaks.jsonl`
- Review heap snapshots in: `monitoring/memory/logs/`
- Analyze session growth patterns in the dashboard

#### Alert Flooding
- Adjust cooldown periods in alert system configuration
- Review and tune alert thresholds
- Enable alert acknowledgment to reduce noise

### Performance Impact
The monitoring system is designed to have minimal performance impact:
- **CPU Usage**: <1% additional CPU usage
- **Memory Overhead**: <50MB additional memory
- **I/O Impact**: Minimal file system writes (logs only)

## 📝 Best Practices

### Configuration
1. **Set Appropriate Thresholds**: Tune thresholds based on your system capacity
2. **Enable Learning Mode**: Allow the system to learn from patterns
3. **Configure Retention**: Balance history depth with storage requirements

### Monitoring
1. **Regular Health Checks**: Use CLI tools for periodic health checks
2. **Dashboard Monitoring**: Keep the web dashboard accessible for teams
3. **Alert Response**: Establish procedures for different alert levels

### Optimization
1. **Review Recommendations**: Regularly review and implement suggestions
2. **Test Auto-Optimizations**: Start with conservative auto-optimization settings
3. **Monitor Success Rates**: Track optimization success and adjust accordingly

## 🔗 Integration Examples

### Basic Integration
```javascript
const { MemoryPerformanceDashboard } = require('./monitoring/memory');

const dashboard = new MemoryPerformanceDashboard({
    monitor: {
        sampleInterval: 5000,
        memoryThresholds: {
            warning: 0.8,
            critical: 0.9,
            emergency: 0.95
        }
    },
    alerts: {
        actionTriggers: {
            autoGC: true,
            memoryDump: true
        }
    },
    optimization: {
        autoOptimization: {
            enabled: true,
            aggressiveness: 'moderate'
        }
    }
});

await dashboard.start();
```

### Event-Driven Integration
```javascript
// Listen for memory events
dashboard.on('alert:critical', (alert) => {
    console.error('Critical memory alert:', alert.message);
    // Trigger application-specific responses
});

dashboard.on('optimization:automated', (data) => {
    console.log('Automated optimization applied:', data.recommendation.title);
});

dashboard.on('session:completed', (session) => {
    console.log('Session analysis completed:', session.id);
});
```

### Custom Actions
```javascript
// Add custom emergency actions
dashboard.alertSystem.on('alert:emergency', async (alert) => {
    if (alert.type === 'memory_exhaustion') {
        // Custom emergency response
        await customEmergencyProcedure();
    }
});
```

## 📚 API Reference

See the individual module documentation for detailed API references:
- [MemoryMonitor.js](./MemoryMonitor.js) - Core monitoring functionality
- [MemoryAlertSystem.js](./MemoryAlertSystem.js) - Alerting and automated actions
- [SessionMemoryAnalyzer.js](./SessionMemoryAnalyzer.js) - Session pattern analysis
- [MemoryOptimizationEngine.js](./MemoryOptimizationEngine.js) - Optimization recommendations
- [MemoryPerformanceDashboard.js](./MemoryPerformanceDashboard.js) - Integration hub and dashboard

---

## 🤝 Support

For issues, feature requests, or contributions, please integrate with your existing project workflow and monitoring infrastructure.