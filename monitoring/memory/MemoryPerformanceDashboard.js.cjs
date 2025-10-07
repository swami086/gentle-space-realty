/**
 * Memory Performance Dashboard
 * Comprehensive dashboard and integration hub for memory monitoring system
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

const MemoryMonitor = require('./MemoryMonitor.js.cjs');
const MemoryAlertSystem = require('./MemoryAlertSystem.js.cjs');
const SessionMemoryAnalyzer = require('./SessionMemoryAnalyzer.js.cjs');
const MemoryOptimizationEngine = require('./MemoryOptimizationEngine.js.cjs');

class MemoryPerformanceDashboard extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            updateInterval: options.updateInterval || 5000, // 5 seconds
            retentionDays: options.retentionDays || 7,
            enableWebDashboard: options.webDashboard !== false,
            dashboardPort: options.dashboardPort || 3001,
            integrationMode: options.integrationMode || 'full', // full, monitor, alerts
            autoStart: options.autoStart !== false
        };

        // Initialize core components
        this.memoryMonitor = new MemoryMonitor(options.monitor || {});
        this.alertSystem = new MemoryAlertSystem(options.alerts || {});
        this.sessionAnalyzer = new SessionMemoryAnalyzer(options.sessions || {});
        this.optimizationEngine = new MemoryOptimizationEngine(options.optimization || {});

        // Dashboard state
        this.dashboardData = {
            lastUpdate: null,
            metrics: null,
            alerts: [],
            sessions: new Map(),
            optimizations: [],
            healthScore: 1.0,
            status: 'initializing'
        };

        // Integration paths
        this.integrationPaths = {
            claudeFlow: path.join(process.cwd(), '.claude-flow', 'metrics'),
            monitoring: path.join(process.cwd(), 'monitoring'),
            memory: path.join(process.cwd(), 'memory')
        };

        this.setupEventHandlers();
        
        if (this.options.autoStart) {
            this.start();
        }
    }

    /**
     * Setup event handlers between components
     */
    setupEventHandlers() {
        // Memory Monitor Events
        this.memoryMonitor.on('metrics:collected', (metrics) => {
            this.handleMetricsUpdate(metrics);
        });

        this.memoryMonitor.on('leak:detected', (leakDetection) => {
            this.handleLeakDetection(leakDetection);
        });

        this.memoryMonitor.on('alert:emergency', (alert) => {
            this.handleEmergencyAlert(alert);
        });

        // Alert System Events
        this.alertSystem.on('alert', (alert) => {
            this.handleAlert(alert);
        });

        this.alertSystem.on('optimization:automated', (data) => {
            this.handleAutomatedOptimization(data);
        });

        // Session Analyzer Events
        this.sessionAnalyzer.on('session:analyzed', (analysis) => {
            this.handleSessionAnalysis(analysis);
        });

        this.sessionAnalyzer.on('session:completed', (session) => {
            this.handleSessionCompletion(session);
        });

        // Optimization Engine Events
        this.optimizationEngine.on('recommendations:generated', (data) => {
            this.handleOptimizationRecommendations(data);
        });

        this.optimizationEngine.on('optimization:automated', (data) => {
            this.handleOptimizationImplementation(data);
        });
    }

    /**
     * Start the comprehensive memory monitoring system
     */
    async start() {
        try {
            console.log('🚀 Starting Memory Performance Dashboard...');
            
            // Initialize integration directories
            await this.initializeIntegration();
            
            // Start core components
            this.memoryMonitor.start();
            
            // Register current session if available
            const sessionId = process.env.CLAUDE_FLOW_SESSION_ID || 
                             `session_${Date.now()}`;
            this.sessionAnalyzer.registerSession(sessionId, {
                type: 'hive_mind',
                startTime: Date.now()
            });

            // Start dashboard update cycle
            this.startDashboardUpdates();
            
            // Initialize web dashboard if enabled
            if (this.options.enableWebDashboard) {
                await this.startWebDashboard();
            }

            this.dashboardData.status = 'running';
            console.log('✅ Memory Performance Dashboard started successfully');
            
            this.emit('dashboard:started');

        } catch (error) {
            console.error('❌ Failed to start Memory Performance Dashboard:', error);
            this.dashboardData.status = 'error';
            this.emit('dashboard:error', error);
            throw error;
        }
    }

    /**
     * Stop the monitoring system
     */
    async stop() {
        console.log('🛑 Stopping Memory Performance Dashboard...');
        
        this.memoryMonitor.stop();
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.dashboardData.status = 'stopped';
        console.log('✅ Memory Performance Dashboard stopped');
        
        this.emit('dashboard:stopped');
    }

    /**
     * Initialize integration with existing monitoring systems
     */
    async initializeIntegration() {
        try {
            // Ensure integration directories exist
            for (const integrationPath of Object.values(this.integrationPaths)) {
                await fs.mkdir(integrationPath, { recursive: true });
            }

            // Load existing metrics if available
            await this.loadExistingMetrics();
            
            // Setup periodic integration sync
            this.setupIntegrationSync();
            
            console.log('🔗 Integration initialized successfully');
            
        } catch (error) {
            console.warn('⚠️ Integration initialization warning:', error.message);
        }
    }

    /**
     * Load existing metrics from claude-flow and monitoring systems
     */
    async loadExistingMetrics() {
        try {
            // Load claude-flow system metrics
            const systemMetricsPath = path.join(this.integrationPaths.claudeFlow, 'system-metrics.json');
            try {
                const systemMetricsData = await fs.readFile(systemMetricsPath, 'utf8');
                const systemMetrics = JSON.parse(systemMetricsData);
                
                // Process historical system metrics
                if (Array.isArray(systemMetrics)) {
                    for (const metric of systemMetrics.slice(-10)) {
                        // Convert to our format and add to history
                        const convertedMetric = this.convertSystemMetric(metric);
                        this.memoryMonitor.addToHistory(convertedMetric);
                    }
                }
            } catch (error) {
                // System metrics file doesn't exist yet, which is normal
            }

            // Load existing monitoring data
            const swarmMonitorPath = path.join(this.integrationPaths.monitoring, 'swarm-monitor.json');
            try {
                const swarmMonitorData = await fs.readFile(swarmMonitorPath, 'utf8');
                const swarmConfig = JSON.parse(swarmMonitorData);
                
                // Integrate monitoring thresholds
                this.integrateMonitoringConfig(swarmConfig);
                
            } catch (error) {
                // Swarm monitor config doesn't exist, use defaults
            }

        } catch (error) {
            console.warn('Warning loading existing metrics:', error.message);
        }
    }

    /**
     * Convert system metric to our internal format
     */
    convertSystemMetric(systemMetric) {
        return {
            timestamp: systemMetric.timestamp,
            process: {
                rss: systemMetric.memoryUsed * 0.8, // Estimate process RSS
                heapTotal: systemMetric.memoryUsed * 0.6,
                heapUsed: systemMetric.memoryUsed * 0.4,
                external: systemMetric.memoryUsed * 0.1,
                arrayBuffers: systemMetric.memoryUsed * 0.05,
                heapUtilization: 0.67,
                rssUtilization: systemMetric.memoryUsagePercent / 100
            },
            system: {
                total: systemMetric.memoryTotal,
                free: systemMetric.memoryFree,
                used: systemMetric.memoryUsed,
                utilization: systemMetric.memoryUsagePercent / 100,
                available: systemMetric.memoryFree
            },
            gc: { collected: 0, duration: 0, type: 'estimated' },
            fragmentation: {
                heap: 0.1,
                rss: 0.05,
                score: 0.075,
                level: 'low'
            },
            sessionId: process.env.CLAUDE_FLOW_SESSION_ID || 'historical'
        };
    }

    /**
     * Integrate monitoring configuration
     */
    integrateMonitoringConfig(swarmConfig) {
        if (swarmConfig.health_checks?.resource_monitoring) {
            const resourceMonitoring = swarmConfig.health_checks.resource_monitoring;
            
            // Update alert thresholds based on swarm config
            this.alertSystem.options.alertThresholds.memory.warning = 
                resourceMonitoring.memory_threshold * 0.9;
            this.alertSystem.options.alertThresholds.memory.critical = 
                resourceMonitoring.memory_threshold;
            this.alertSystem.options.alertThresholds.memory.emergency = 
                resourceMonitoring.memory_threshold * 1.1;
        }
    }

    /**
     * Setup periodic integration sync
     */
    setupIntegrationSync() {
        setInterval(async () => {
            await this.syncWithClaudeFlowMetrics();
            await this.syncWithMonitoringSystem();
        }, 30000); // 30 seconds
    }

    /**
     * Sync with claude-flow metrics
     */
    async syncWithClaudeFlowMetrics() {
        try {
            const currentMetrics = this.dashboardData.metrics;
            if (!currentMetrics) return;

            // Create integration summary for claude-flow
            const integrationSummary = {
                timestamp: Date.now(),
                memoryHealth: {
                    score: this.dashboardData.healthScore,
                    status: this.getHealthStatus(),
                    utilization: currentMetrics.system.utilization,
                    fragmentation: currentMetrics.fragmentation.score
                },
                activeAlerts: this.dashboardData.alerts.filter(a => !a.resolved).length,
                optimizationsSuggested: this.dashboardData.optimizations.length,
                sessionCount: this.dashboardData.sessions.size
            };

            // Write to claude-flow integration file
            const integrationPath = path.join(this.integrationPaths.claudeFlow, 'memory-integration.json');
            await fs.writeFile(integrationPath, JSON.stringify(integrationSummary, null, 2));

        } catch (error) {
            console.warn('Warning syncing with claude-flow:', error.message);
        }
    }

    /**
     * Sync with monitoring system
     */
    async syncWithMonitoringSystem() {
        try {
            const monitoringUpdate = {
                timestamp: Date.now(),
                memoryMonitoring: {
                    enabled: this.memoryMonitor.isMonitoring,
                    samples: this.memoryMonitor.history.length,
                    lastSample: this.dashboardData.lastUpdate,
                    healthScore: this.dashboardData.healthScore,
                    criticalAlerts: this.dashboardData.alerts.filter(a => 
                        a.level === 'critical' && !a.resolved
                    ).length
                }
            };

            // Update monitoring configuration
            const monitoringPath = path.join(this.integrationPaths.monitoring, 'memory-monitoring.json');
            await fs.writeFile(monitoringPath, JSON.stringify(monitoringUpdate, null, 2));

        } catch (error) {
            console.warn('Warning syncing with monitoring system:', error.message);
        }
    }

    /**
     * Start dashboard update cycle
     */
    startDashboardUpdates() {
        this.updateInterval = setInterval(() => {
            this.updateDashboard();
        }, this.options.updateInterval);
    }

    /**
     * Handle metrics update from memory monitor
     */
    async handleMetricsUpdate(metrics) {
        this.dashboardData.metrics = metrics;
        this.dashboardData.lastUpdate = Date.now();

        // Add to session analyzer
        const sessionId = metrics.sessionId;
        this.sessionAnalyzer.addMemorySnapshot(sessionId, metrics);

        // Process through alert system
        const alerts = await this.alertSystem.processMetrics(metrics);
        this.dashboardData.alerts.push(...alerts);

        // Generate optimization recommendations
        const sessionData = this.dashboardData.sessions.get(sessionId);
        const recommendations = await this.optimizationEngine.generateRecommendations(
            metrics,
            sessionData,
            null // No leak detection data in this call
        );

        // Update health score
        this.updateHealthScore(metrics, alerts, recommendations);

        this.emit('dashboard:updated', {
            metrics,
            alerts,
            recommendations
        });
    }

    /**
     * Handle leak detection
     */
    async handleLeakDetection(leakDetection) {
        // Process through alert system
        const alerts = await this.alertSystem.processLeakDetection(leakDetection);
        this.dashboardData.alerts.push(...alerts);

        // Generate leak-specific recommendations
        const recommendations = await this.optimizationEngine.generateRecommendations(
            this.dashboardData.metrics,
            null,
            leakDetection
        );

        this.dashboardData.optimizations.push(...recommendations);

        this.emit('leak:detected', {
            leakDetection,
            alerts,
            recommendations
        });
    }

    /**
     * Handle emergency alerts
     */
    async handleEmergencyAlert(alert) {
        console.error('🚨 EMERGENCY MEMORY ALERT:', alert.message);
        
        // Log to emergency file
        const emergencyPath = path.join(this.integrationPaths.monitoring, 'emergency-alerts.jsonl');
        const emergencyLog = {
            timestamp: new Date().toISOString(),
            alert,
            systemState: this.dashboardData.metrics
        };
        
        await fs.appendFile(emergencyPath, JSON.stringify(emergencyLog) + '\n');
        
        this.emit('emergency:alert', alert);
    }

    /**
     * Handle regular alerts
     */
    handleAlert(alert) {
        this.dashboardData.alerts.push(alert);
        
        // Update health score based on alert severity
        if (alert.level === 'critical') {
            this.dashboardData.healthScore = Math.min(this.dashboardData.healthScore, 0.3);
        } else if (alert.level === 'warning') {
            this.dashboardData.healthScore = Math.min(this.dashboardData.healthScore, 0.7);
        }

        this.emit('alert:generated', alert);
    }

    /**
     * Handle session analysis completion
     */
    handleSessionAnalysis(analysis) {
        this.dashboardData.sessions.set(analysis.sessionId, analysis);
        
        // Generate session-specific optimizations
        if (analysis.healthScore < 0.7) {
            this.optimizationEngine.generateRecommendations(
                this.dashboardData.metrics,
                analysis
            );
        }

        this.emit('session:analyzed', analysis);
    }

    /**
     * Handle session completion
     */
    handleSessionCompletion(session) {
        console.log(`📊 Session completed: ${session.id}`);
        this.emit('session:completed', session);
    }

    /**
     * Handle optimization recommendations
     */
    handleOptimizationRecommendations(data) {
        this.dashboardData.optimizations = data.recommendations;
        this.emit('optimizations:updated', data);
    }

    /**
     * Handle automated optimization
     */
    handleAutomatedOptimization(data) {
        console.log(`🤖 Automated optimization: ${data.recommendation.title}`);
        this.emit('optimization:automated', data);
    }

    /**
     * Handle optimization implementation
     */
    handleOptimizationImplementation(data) {
        console.log(`⚡ Optimization implemented: ${data.recommendation.title}`);
        
        // Update health score if optimization was successful
        if (data.result.success) {
            this.dashboardData.healthScore = Math.min(1.0, this.dashboardData.healthScore + 0.1);
        }

        this.emit('optimization:implemented', data);
    }

    /**
     * Update overall health score
     */
    updateHealthScore(metrics, alerts, recommendations) {
        let score = 1.0;

        // Memory utilization impact
        const memoryUtil = metrics.system.utilization;
        score -= memoryUtil > 0.9 ? 0.5 : memoryUtil > 0.8 ? 0.3 : memoryUtil > 0.7 ? 0.1 : 0;

        // Fragmentation impact
        const fragmentation = metrics.fragmentation.score;
        score -= fragmentation > 0.5 ? 0.3 : fragmentation > 0.3 ? 0.2 : fragmentation > 0.1 ? 0.1 : 0;

        // Alert impact
        const criticalAlerts = alerts.filter(a => a.level === 'critical').length;
        const warningAlerts = alerts.filter(a => a.level === 'warning').length;
        score -= criticalAlerts * 0.2 + warningAlerts * 0.1;

        // Ensure score is between 0 and 1
        this.dashboardData.healthScore = Math.max(0, Math.min(1, score));
    }

    /**
     * Get health status string
     */
    getHealthStatus() {
        const score = this.dashboardData.healthScore;
        if (score >= 0.8) return 'excellent';
        if (score >= 0.6) return 'good';
        if (score >= 0.4) return 'fair';
        if (score >= 0.2) return 'poor';
        return 'critical';
    }

    /**
     * Update dashboard with latest data
     */
    updateDashboard() {
        const summary = this.getDashboardSummary();
        this.emit('dashboard:summary', summary);
        
        // Cleanup old data
        this.cleanupOldData();
    }

    /**
     * Get comprehensive dashboard summary
     */
    getDashboardSummary() {
        const currentMetrics = this.dashboardData.metrics;
        const recentAlerts = this.dashboardData.alerts.slice(-10);
        const topRecommendations = this.dashboardData.optimizations.slice(0, 5);

        return {
            timestamp: Date.now(),
            status: this.dashboardData.status,
            healthScore: this.dashboardData.healthScore,
            healthStatus: this.getHealthStatus(),
            
            memory: currentMetrics ? {
                systemUtilization: (currentMetrics.system.utilization * 100).toFixed(1) + '%',
                heapUtilization: (currentMetrics.process.heapUtilization * 100).toFixed(1) + '%',
                fragmentation: currentMetrics.fragmentation.level,
                availableGB: (currentMetrics.system.available / 1024 / 1024 / 1024).toFixed(2)
            } : null,
            
            monitoring: {
                active: this.memoryMonitor.isMonitoring,
                samplesCollected: this.memoryMonitor.history.length,
                lastUpdate: this.dashboardData.lastUpdate
            },
            
            alerts: {
                total: this.dashboardData.alerts.length,
                active: this.dashboardData.alerts.filter(a => !a.resolved).length,
                critical: recentAlerts.filter(a => a.level === 'critical').length,
                warnings: recentAlerts.filter(a => a.level === 'warning').length,
                recent: recentAlerts.map(a => ({
                    level: a.level,
                    type: a.type,
                    message: a.message,
                    timestamp: a.timestamp
                }))
            },
            
            sessions: {
                total: this.dashboardData.sessions.size,
                active: Array.from(this.dashboardData.sessions.values())
                    .filter(s => s.status === 'active').length
            },
            
            optimizations: {
                totalRecommendations: this.dashboardData.optimizations.length,
                highPriority: this.dashboardData.optimizations
                    .filter(r => r.priority === 'critical' || r.priority === 'high').length,
                autoImplemented: this.optimizationEngine.getOptimizationStats().automationsToday,
                top: topRecommendations.map(r => ({
                    title: r.title,
                    priority: r.priority,
                    type: r.type,
                    estimatedImpact: r.actions?.[0]?.estimatedImpact || 'unknown'
                }))
            }
        };
    }

    /**
     * Start web dashboard server
     */
    async startWebDashboard() {
        try {
            const express = require('express');
            const app = express();
            
            app.use(express.static(path.join(__dirname, 'dashboard')));
            app.use(express.json());
            
            // API endpoints
            app.get('/api/status', (req, res) => {
                res.json(this.getDashboardSummary());
            });
            
            app.get('/api/metrics', (req, res) => {
                res.json({
                    current: this.dashboardData.metrics,
                    history: this.memoryMonitor.history.slice(-100)
                });
            });
            
            app.get('/api/alerts', (req, res) => {
                res.json(this.dashboardData.alerts.slice(-50));
            });
            
            app.get('/api/optimizations', (req, res) => {
                res.json(this.dashboardData.optimizations);
            });
            
            app.post('/api/alerts/:id/acknowledge', (req, res) => {
                const success = this.alertSystem.acknowledgeAlert(req.params.id);
                res.json({ success });
            });
            
            const server = app.listen(this.options.dashboardPort, () => {
                console.log(`🌐 Memory Dashboard available at http://localhost:${this.options.dashboardPort}`);
            });
            
            this.webServer = server;
            
        } catch (error) {
            console.warn('⚠️ Could not start web dashboard:', error.message);
        }
    }

    /**
     * Clean up old data to prevent memory leaks in the monitor itself
     */
    cleanupOldData() {
        const cutoffTime = Date.now() - (this.options.retentionDays * 24 * 60 * 60 * 1000);
        
        // Clean up old alerts
        this.dashboardData.alerts = this.dashboardData.alerts.filter(alert => 
            alert.timestamp > cutoffTime || !alert.resolved
        );
        
        // Clean up old optimizations
        this.dashboardData.optimizations = this.dashboardData.optimizations.slice(-100);
    }

    /**
     * Export comprehensive dashboard data
     */
    async exportDashboardData(format = 'json') {
        const exportData = {
            metadata: {
                exportTime: new Date().toISOString(),
                version: '1.0.0',
                retention: `${this.options.retentionDays} days`
            },
            summary: this.getDashboardSummary(),
            metrics: {
                current: this.dashboardData.metrics,
                history: this.memoryMonitor.history
            },
            alerts: this.dashboardData.alerts,
            sessions: Object.fromEntries(this.dashboardData.sessions),
            optimizations: this.dashboardData.optimizations,
            stats: {
                memory: this.memoryMonitor.getStatus(),
                alerts: this.alertSystem.getAlertStats(),
                optimizations: this.optimizationEngine.getOptimizationStats()
            }
        };

        const timestamp = Date.now();
        const filename = `memory-dashboard-export-${timestamp}.${format}`;
        const filepath = path.join(this.integrationPaths.monitoring, filename);
        
        if (format === 'json') {
            await fs.writeFile(filepath, JSON.stringify(exportData, null, 2));
        }
        
        return { success: true, filepath, timestamp };
    }

    /**
     * Generate comprehensive memory report
     */
    async generateMemoryReport() {
        const summary = this.getDashboardSummary();
        const stats = {
            memory: this.memoryMonitor.getStatus(),
            alerts: this.alertSystem.getAlertStats(),
            optimizations: this.optimizationEngine.getOptimizationStats()
        };

        const report = {
            title: 'Memory Performance Report',
            generatedAt: new Date().toISOString(),
            healthScore: summary.healthScore,
            healthStatus: summary.healthStatus,
            
            executive_summary: {
                status: summary.status,
                keyMetrics: summary.memory,
                criticalIssues: summary.alerts.critical,
                recommendedActions: summary.optimizations.highPriority
            },
            
            detailed_analysis: {
                memoryUsage: stats.memory,
                alertAnalysis: stats.alerts,
                optimizationResults: stats.optimizations,
                sessionAnalysis: {
                    totalSessions: summary.sessions.total,
                    activeSessions: summary.sessions.active
                }
            },
            
            recommendations: summary.optimizations.top,
            
            action_items: this.dashboardData.optimizations
                .filter(r => r.priority === 'critical' || r.priority === 'high')
                .map(r => ({
                    priority: r.priority,
                    title: r.title,
                    description: r.description,
                    estimatedImpact: r.actions?.[0]?.estimatedImpact
                })),
                
            appendix: {
                configuration: this.options,
                integrationPaths: this.integrationPaths,
                componentStatus: {
                    memoryMonitor: this.memoryMonitor.isMonitoring,
                    alertSystem: true,
                    sessionAnalyzer: true,
                    optimizationEngine: true
                }
            }
        };

        const filename = `memory-report-${Date.now()}.json`;
        const filepath = path.join(this.integrationPaths.monitoring, filename);
        await fs.writeFile(filepath, JSON.stringify(report, null, 2));

        return { report, filepath };
    }

    /**
     * Get current status for external systems
     */
    getIntegrationStatus() {
        return {
            dashboard: {
                status: this.dashboardData.status,
                healthScore: this.dashboardData.healthScore,
                lastUpdate: this.dashboardData.lastUpdate
            },
            components: {
                memoryMonitor: this.memoryMonitor.isMonitoring,
                alertSystem: this.dashboardData.alerts.length,
                sessionAnalyzer: this.dashboardData.sessions.size,
                optimizationEngine: this.dashboardData.optimizations.length
            },
            integration: {
                claudeFlowSync: true,
                monitoringSync: true,
                webDashboard: !!this.webServer
            }
        };
    }
}

module.exports = MemoryPerformanceDashboard;