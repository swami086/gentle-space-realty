/**
 * Memory Alert System
 * Advanced alerting for memory exhaustion scenarios and optimization recommendations
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class MemoryAlertSystem extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            alertThresholds: {
                memory: {
                    warning: options.memoryWarning || 0.75,
                    critical: options.memoryCritical || 0.85,
                    emergency: options.memoryEmergency || 0.95
                },
                heap: {
                    warning: options.heapWarning || 0.8,
                    critical: options.heapCritical || 0.9,
                    emergency: options.heapEmergency || 0.95
                },
                fragmentation: {
                    warning: options.fragmentationWarning || 0.3,
                    critical: options.fragmentationCritical || 0.5,
                    emergency: options.fragmentationEmergency || 0.7
                },
                leakScore: {
                    warning: options.leakWarning || 0.5,
                    critical: options.leakCritical || 0.7,
                    emergency: options.leakEmergency || 0.9
                }
            },
            cooldownPeriods: {
                warning: options.warningCooldown || 60000, // 1 minute
                critical: options.criticalCooldown || 30000, // 30 seconds
                emergency: options.emergencyCooldown || 10000 // 10 seconds
            },
            actionTriggers: {
                autoGC: options.autoGC !== false,
                alertNotifications: options.notifications !== false,
                emergencyShutdown: options.emergencyShutdown || false,
                memoryDump: options.memoryDump !== false
            },
            notifications: {
                console: options.consoleNotifications !== false,
                file: options.fileNotifications !== false,
                webhook: options.webhookUrl || null,
                email: options.emailConfig || null
            }
        };

        this.alertHistory = [];
        this.lastAlerts = new Map();
        this.activeAlerts = new Set();
        this.alertStats = {
            total: 0,
            byLevel: { warning: 0, critical: 0, emergency: 0 },
            byType: {}
        };

        this.logPath = path.join(process.cwd(), 'monitoring', 'memory', 'alerts');
        this.initializeDirectories();
    }

    async initializeDirectories() {
        try {
            await fs.mkdir(this.logPath, { recursive: true });
        } catch (error) {
            console.warn('Failed to create alert directories:', error.message);
        }
    }

    /**
     * Process memory metrics and check for alert conditions
     */
    async processMetrics(metrics) {
        const alerts = [];
        const timestamp = Date.now();

        // System memory alerts
        const memoryAlerts = this.checkMemoryThresholds(metrics, timestamp);
        alerts.push(...memoryAlerts);

        // Heap pressure alerts
        const heapAlerts = this.checkHeapThresholds(metrics, timestamp);
        alerts.push(...heapAlerts);

        // Fragmentation alerts
        const fragmentationAlerts = this.checkFragmentationThresholds(metrics, timestamp);
        alerts.push(...fragmentationAlerts);

        // Process all generated alerts
        for (const alert of alerts) {
            await this.processAlert(alert);
        }

        return alerts;
    }

    /**
     * Process memory leak detection results
     */
    async processLeakDetection(leakDetection) {
        const timestamp = Date.now();
        const alerts = [];

        if (leakDetection.overallScore >= this.options.alertThresholds.leakScore.emergency) {
            alerts.push(this.createAlert('memory_leak', 'emergency', {
                score: leakDetection.overallScore,
                details: leakDetection,
                message: `Critical memory leak detected (score: ${leakDetection.overallScore.toFixed(3)})`
            }, timestamp));
        } else if (leakDetection.overallScore >= this.options.alertThresholds.leakScore.critical) {
            alerts.push(this.createAlert('memory_leak', 'critical', {
                score: leakDetection.overallScore,
                details: leakDetection,
                message: `Significant memory leak detected (score: ${leakDetection.overallScore.toFixed(3)})`
            }, timestamp));
        } else if (leakDetection.overallScore >= this.options.alertThresholds.leakScore.warning) {
            alerts.push(this.createAlert('memory_leak', 'warning', {
                score: leakDetection.overallScore,
                details: leakDetection,
                message: `Potential memory leak detected (score: ${leakDetection.overallScore.toFixed(3)})`
            }, timestamp));
        }

        // Specific leak pattern alerts
        if (leakDetection.sustained.detected) {
            alerts.push(this.createAlert('sustained_growth', 'warning', {
                pattern: 'sustained_growth',
                details: leakDetection.sustained,
                message: 'Sustained memory growth pattern detected'
            }, timestamp));
        }

        if (leakDetection.staircase.detected) {
            alerts.push(this.createAlert('staircase_pattern', 'warning', {
                pattern: 'staircase_pattern',
                details: leakDetection.staircase,
                message: 'Staircase memory allocation pattern detected'
            }, timestamp));
        }

        if (leakDetection.gcInefficiency.detected) {
            alerts.push(this.createAlert('gc_inefficiency', 'critical', {
                pattern: 'gc_inefficiency',
                details: leakDetection.gcInefficiency,
                message: 'Garbage collection inefficiency detected'
            }, timestamp));
        }

        // Process all leak-related alerts
        for (const alert of alerts) {
            await this.processAlert(alert);
        }

        return alerts;
    }

    /**
     * Check system memory thresholds
     */
    checkMemoryThresholds(metrics, timestamp) {
        const alerts = [];
        const utilization = metrics.system.utilization;
        const thresholds = this.options.alertThresholds.memory;

        if (utilization >= thresholds.emergency) {
            alerts.push(this.createAlert('system_memory', 'emergency', {
                utilization,
                available: metrics.system.available,
                total: metrics.system.total,
                message: `System memory critically low: ${(utilization * 100).toFixed(1)}%`
            }, timestamp));
        } else if (utilization >= thresholds.critical) {
            alerts.push(this.createAlert('system_memory', 'critical', {
                utilization,
                available: metrics.system.available,
                total: metrics.system.total,
                message: `System memory low: ${(utilization * 100).toFixed(1)}%`
            }, timestamp));
        } else if (utilization >= thresholds.warning) {
            alerts.push(this.createAlert('system_memory', 'warning', {
                utilization,
                available: metrics.system.available,
                total: metrics.system.total,
                message: `System memory usage high: ${(utilization * 100).toFixed(1)}%`
            }, timestamp));
        }

        return alerts;
    }

    /**
     * Check heap memory thresholds
     */
    checkHeapThresholds(metrics, timestamp) {
        const alerts = [];
        const utilization = metrics.process.heapUtilization;
        const thresholds = this.options.alertThresholds.heap;

        if (utilization >= thresholds.emergency) {
            alerts.push(this.createAlert('heap_pressure', 'emergency', {
                utilization,
                heapUsed: metrics.process.heapUsed,
                heapTotal: metrics.process.heapTotal,
                message: `Heap memory critically full: ${(utilization * 100).toFixed(1)}%`
            }, timestamp));
        } else if (utilization >= thresholds.critical) {
            alerts.push(this.createAlert('heap_pressure', 'critical', {
                utilization,
                heapUsed: metrics.process.heapUsed,
                heapTotal: metrics.process.heapTotal,
                message: `Heap memory pressure: ${(utilization * 100).toFixed(1)}%`
            }, timestamp));
        } else if (utilization >= thresholds.warning) {
            alerts.push(this.createAlert('heap_pressure', 'warning', {
                utilization,
                heapUsed: metrics.process.heapUsed,
                heapTotal: metrics.process.heapTotal,
                message: `Heap memory usage high: ${(utilization * 100).toFixed(1)}%`
            }, timestamp));
        }

        return alerts;
    }

    /**
     * Check memory fragmentation thresholds
     */
    checkFragmentationThresholds(metrics, timestamp) {
        const alerts = [];
        const fragmentation = metrics.fragmentation.score;
        const thresholds = this.options.alertThresholds.fragmentation;

        if (fragmentation >= thresholds.emergency) {
            alerts.push(this.createAlert('memory_fragmentation', 'emergency', {
                score: fragmentation,
                level: metrics.fragmentation.level,
                heap: metrics.fragmentation.heap,
                rss: metrics.fragmentation.rss,
                message: `Severe memory fragmentation: ${(fragmentation * 100).toFixed(1)}%`
            }, timestamp));
        } else if (fragmentation >= thresholds.critical) {
            alerts.push(this.createAlert('memory_fragmentation', 'critical', {
                score: fragmentation,
                level: metrics.fragmentation.level,
                heap: metrics.fragmentation.heap,
                rss: metrics.fragmentation.rss,
                message: `High memory fragmentation: ${(fragmentation * 100).toFixed(1)}%`
            }, timestamp));
        } else if (fragmentation >= thresholds.warning) {
            alerts.push(this.createAlert('memory_fragmentation', 'warning', {
                score: fragmentation,
                level: metrics.fragmentation.level,
                heap: metrics.fragmentation.heap,
                rss: metrics.fragmentation.rss,
                message: `Memory fragmentation detected: ${(fragmentation * 100).toFixed(1)}%`
            }, timestamp));
        }

        return alerts;
    }

    /**
     * Create standardized alert object
     */
    createAlert(type, level, data, timestamp) {
        return {
            id: `${type}_${level}_${timestamp}`,
            type,
            level,
            timestamp,
            data,
            message: data.message,
            acknowledged: false,
            resolved: false,
            actions: []
        };
    }

    /**
     * Process individual alert with cooldown and actions
     */
    async processAlert(alert) {
        const alertKey = `${alert.type}_${alert.level}`;
        const now = Date.now();
        
        // Check cooldown period
        if (this.lastAlerts.has(alertKey)) {
            const lastAlert = this.lastAlerts.get(alertKey);
            const cooldown = this.options.cooldownPeriods[alert.level];
            
            if (now - lastAlert < cooldown) {
                return; // Skip alert due to cooldown
            }
        }

        // Update alert tracking
        this.lastAlerts.set(alertKey, now);
        this.activeAlerts.add(alertKey);
        this.alertHistory.push(alert);
        
        // Update statistics
        this.alertStats.total++;
        this.alertStats.byLevel[alert.level]++;
        this.alertStats.byType[alert.type] = (this.alertStats.byType[alert.type] || 0) + 1;

        // Trigger actions based on alert level and type
        await this.triggerActions(alert);

        // Send notifications
        await this.sendNotifications(alert);

        // Log alert
        await this.logAlert(alert);

        // Emit event for external handlers
        this.emit(`alert:${alert.level}`, alert);
        this.emit('alert', alert);

        // Keep history manageable
        if (this.alertHistory.length > 1000) {
            this.alertHistory = this.alertHistory.slice(-500);
        }
    }

    /**
     * Trigger automated actions based on alert
     */
    async triggerActions(alert) {
        const actions = [];

        try {
            switch (alert.level) {
                case 'emergency':
                    if (this.options.actionTriggers.memoryDump && 
                        (alert.type === 'system_memory' || alert.type === 'heap_pressure')) {
                        await this.createMemoryDump();
                        actions.push('memory_dump');
                    }
                    
                    if (this.options.actionTriggers.autoGC && alert.type === 'heap_pressure') {
                        await this.triggerGarbageCollection();
                        actions.push('force_gc');
                    }
                    
                    if (this.options.actionTriggers.emergencyShutdown && alert.type === 'system_memory') {
                        await this.initiateEmergencyShutdown();
                        actions.push('emergency_shutdown');
                    }
                    break;

                case 'critical':
                    if (this.options.actionTriggers.autoGC && 
                        (alert.type === 'heap_pressure' || alert.type === 'memory_fragmentation')) {
                        await this.triggerGarbageCollection();
                        actions.push('gc_triggered');
                    }
                    
                    if (alert.type === 'memory_leak') {
                        await this.generateLeakReport(alert);
                        actions.push('leak_report_generated');
                    }
                    break;

                case 'warning':
                    if (alert.type === 'memory_fragmentation') {
                        await this.optimizeMemoryLayout();
                        actions.push('memory_optimization');
                    }
                    break;
            }

            alert.actions = actions;
            
        } catch (error) {
            console.error('Error executing alert actions:', error);
            alert.actions.push(`action_error: ${error.message}`);
        }
    }

    /**
     * Force garbage collection
     */
    async triggerGarbageCollection() {
        try {
            if (global.gc) {
                global.gc();
                console.log('Forced garbage collection triggered');
                return true;
            } else {
                console.warn('Garbage collection not available (run with --expose-gc)');
                return false;
            }
        } catch (error) {
            console.error('Error triggering GC:', error);
            return false;
        }
    }

    /**
     * Create memory dump for analysis
     */
    async createMemoryDump() {
        try {
            const heapdump = require('heapdump');
            const filename = `memory-dump-${Date.now()}.heapsnapshot`;
            const filepath = path.join(this.logPath, filename);
            
            heapdump.writeSnapshot(filepath);
            console.log(`Memory dump created: ${filepath}`);
            return filepath;
            
        } catch (error) {
            // Fallback to process memory usage dump
            const memoryInfo = {
                timestamp: new Date().toISOString(),
                processMemory: process.memoryUsage(),
                systemMemory: require('os').freemem(),
                totalMemory: require('os').totalmem()
            };
            
            const filename = `memory-info-${Date.now()}.json`;
            const filepath = path.join(this.logPath, filename);
            
            await fs.writeFile(filepath, JSON.stringify(memoryInfo, null, 2));
            console.log(`Memory info dump created: ${filepath}`);
            return filepath;
        }
    }

    /**
     * Generate detailed leak analysis report
     */
    async generateLeakReport(alert) {
        const report = {
            timestamp: new Date().toISOString(),
            alert,
            systemState: {
                memory: process.memoryUsage(),
                system: {
                    free: require('os').freemem(),
                    total: require('os').totalmem()
                }
            },
            recommendations: this.generateLeakRecommendations(alert)
        };

        const filename = `leak-report-${Date.now()}.json`;
        const filepath = path.join(this.logPath, filename);
        
        await fs.writeFile(filepath, JSON.stringify(report, null, 2));
        console.log(`Memory leak report generated: ${filepath}`);
        return filepath;
    }

    /**
     * Generate recommendations for memory leak resolution
     */
    generateLeakRecommendations(alert) {
        const recommendations = [];
        
        if (alert.data.details?.sustained?.detected) {
            recommendations.push({
                type: 'code_review',
                priority: 'high',
                action: 'Review recent code changes for objects that are not being properly cleaned up',
                details: 'Sustained memory growth indicates objects are accumulating over time'
            });
        }
        
        if (alert.data.details?.staircase?.detected) {
            recommendations.push({
                type: 'allocation_pattern',
                priority: 'medium',
                action: 'Review allocation patterns and implement object pooling where appropriate',
                details: 'Staircase pattern suggests periodic large allocations without cleanup'
            });
        }
        
        if (alert.data.details?.gcInefficiency?.detected) {
            recommendations.push({
                type: 'gc_tuning',
                priority: 'high',
                action: 'Review garbage collection settings and consider heap size adjustments',
                details: 'GC appears to be struggling to reclaim memory effectively'
            });
        }
        
        return recommendations;
    }

    /**
     * Optimize memory layout (placeholder for advanced optimization)
     */
    async optimizeMemoryLayout() {
        // This could include:
        // - Defragmentation routines
        // - Object pool optimization
        // - Cache cleanup
        console.log('Memory layout optimization triggered');
    }

    /**
     * Initiate emergency shutdown procedure
     */
    async initiateEmergencyShutdown() {
        console.error('EMERGENCY: Initiating shutdown due to memory exhaustion');
        
        // Save critical state
        await this.saveEmergencyState();
        
        // Emit shutdown event for graceful cleanup
        this.emit('emergency:shutdown');
        
        // Set timeout for forced shutdown
        setTimeout(() => {
            process.exit(1);
        }, 5000);
    }

    /**
     * Save emergency state before shutdown
     */
    async saveEmergencyState() {
        try {
            const emergencyState = {
                timestamp: new Date().toISOString(),
                reason: 'memory_exhaustion',
                alerts: this.alertHistory.slice(-10),
                systemState: {
                    memory: process.memoryUsage(),
                    system: {
                        free: require('os').freemem(),
                        total: require('os').totalmem()
                    }
                }
            };
            
            const filepath = path.join(this.logPath, 'emergency-shutdown.json');
            await fs.writeFile(filepath, JSON.stringify(emergencyState, null, 2));
            
        } catch (error) {
            console.error('Failed to save emergency state:', error);
        }
    }

    /**
     * Send notifications through configured channels
     */
    async sendNotifications(alert) {
        const notifications = [];

        // Console notification
        if (this.options.notifications.console) {
            const color = this.getAlertColor(alert.level);
            console.log(`${color}[MEMORY ALERT - ${alert.level.toUpperCase()}] ${alert.message}\x1b[0m`);
            notifications.push('console');
        }

        // File notification
        if (this.options.notifications.file) {
            await this.writeFileNotification(alert);
            notifications.push('file');
        }

        // Webhook notification
        if (this.options.notifications.webhook) {
            await this.sendWebhookNotification(alert);
            notifications.push('webhook');
        }

        return notifications;
    }

    /**
     * Get console color for alert level
     */
    getAlertColor(level) {
        switch (level) {
            case 'emergency': return '\x1b[91m'; // Bright red
            case 'critical': return '\x1b[31m';  // Red
            case 'warning': return '\x1b[33m';   // Yellow
            default: return '\x1b[37m';          // White
        }
    }

    /**
     * Write alert to notification file
     */
    async writeFileNotification(alert) {
        try {
            const notificationFile = path.join(this.logPath, 'notifications.jsonl');
            const notification = {
                timestamp: new Date().toISOString(),
                alert: {
                    id: alert.id,
                    type: alert.type,
                    level: alert.level,
                    message: alert.message
                }
            };
            
            await fs.appendFile(notificationFile, JSON.stringify(notification) + '\n');
        } catch (error) {
            console.error('Failed to write file notification:', error);
        }
    }

    /**
     * Send webhook notification
     */
    async sendWebhookNotification(alert) {
        try {
            const payload = {
                timestamp: new Date().toISOString(),
                service: 'memory-monitor',
                alert: {
                    id: alert.id,
                    type: alert.type,
                    level: alert.level,
                    message: alert.message,
                    data: alert.data
                }
            };

            // Here you would typically use fetch or axios to send to webhook
            // For now, we'll just log the payload
            console.log('Webhook payload:', JSON.stringify(payload, null, 2));
            
        } catch (error) {
            console.error('Failed to send webhook notification:', error);
        }
    }

    /**
     * Log alert to persistent storage
     */
    async logAlert(alert) {
        try {
            const alertLogFile = path.join(this.logPath, 'alerts.jsonl');
            const logEntry = {
                timestamp: new Date().toISOString(),
                ...alert
            };
            
            await fs.appendFile(alertLogFile, JSON.stringify(logEntry) + '\n');
        } catch (error) {
            console.error('Failed to log alert:', error);
        }
    }

    /**
     * Acknowledge an alert
     */
    acknowledgeAlert(alertId, user = 'system') {
        const alert = this.alertHistory.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedBy = user;
            alert.acknowledgedAt = Date.now();
            
            this.emit('alert:acknowledged', alert);
            return true;
        }
        return false;
    }

    /**
     * Resolve an alert
     */
    resolveAlert(alertId, resolution = 'manual', user = 'system') {
        const alert = this.alertHistory.find(a => a.id === alertId);
        if (alert) {
            alert.resolved = true;
            alert.resolvedBy = user;
            alert.resolvedAt = Date.now();
            alert.resolution = resolution;
            
            // Remove from active alerts
            const alertKey = `${alert.type}_${alert.level}`;
            this.activeAlerts.delete(alertKey);
            
            this.emit('alert:resolved', alert);
            return true;
        }
        return false;
    }

    /**
     * Get alert statistics
     */
    getAlertStats() {
        return {
            ...this.alertStats,
            active: this.activeAlerts.size,
            recent: this.alertHistory.filter(a => 
                Date.now() - a.timestamp < 3600000 // Last hour
            ).length,
            unresolved: this.alertHistory.filter(a => !a.resolved).length
        };
    }

    /**
     * Get recent alerts
     */
    getRecentAlerts(limit = 50) {
        return this.alertHistory
            .slice(-limit)
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Clear resolved alerts from history
     */
    clearResolvedAlerts(olderThan = 86400000) { // 24 hours
        const cutoff = Date.now() - olderThan;
        const originalLength = this.alertHistory.length;
        
        this.alertHistory = this.alertHistory.filter(alert => 
            !alert.resolved || alert.timestamp > cutoff
        );
        
        const cleared = originalLength - this.alertHistory.length;
        console.log(`Cleared ${cleared} resolved alerts from history`);
        
        return cleared;
    }
}

module.exports = MemoryAlertSystem;