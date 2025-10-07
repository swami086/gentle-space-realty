/**
 * Memory Performance Monitor
 * Real-time memory usage tracking and analysis for hive mind operations
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class MemoryMonitor extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            sampleInterval: options.sampleInterval || 1000, // 1 second
            historySize: options.historySize || 1000, // Keep 1000 samples
            memoryThresholds: {
                warning: options.warningThreshold || 0.75, // 75%
                critical: options.criticalThreshold || 0.85, // 85%
                emergency: options.emergencyThreshold || 0.95 // 95%
            },
            leakDetection: {
                enabled: options.leakDetection !== false,
                growthThreshold: options.growthThreshold || 0.1, // 10% growth
                windowSize: options.windowSize || 10 // samples
            },
            fragmentation: {
                enabled: options.fragmentationDetection !== false,
                threshold: options.fragmentationThreshold || 0.3 // 30%
            },
            checkpoints: {
                enabled: options.checkpoints !== false,
                maxSize: options.maxCheckpointSize || 50 * 1024 * 1024, // 50MB
                compression: options.checkpointCompression || true
            }
        };
        
        this.history = [];
        this.sessionMetrics = new Map();
        this.leakPatterns = [];
        this.isMonitoring = false;
        this.intervalId = null;
        
        // Initialize logging
        this.logPath = path.join(process.cwd(), 'monitoring', 'memory', 'logs');
        this.metricsPath = path.join(process.cwd(), '.claude-flow', 'metrics');
        
        this.initializeDirectories();
    }

    async initializeDirectories() {
        try {
            await fs.mkdir(this.logPath, { recursive: true });
            await fs.mkdir(this.metricsPath, { recursive: true });
        } catch (error) {
            console.warn('Failed to create directories:', error.message);
        }
    }

    /**
     * Start real-time memory monitoring
     */
    start() {
        if (this.isMonitoring) {
            console.warn('Memory monitoring is already active');
            return;
        }

        this.isMonitoring = true;
        this.intervalId = setInterval(() => {
            this.collectMetrics();
        }, this.options.sampleInterval);

        console.log(`Memory monitoring started (interval: ${this.options.sampleInterval}ms)`);
        this.emit('monitoring:started');
    }

    /**
     * Stop memory monitoring
     */
    stop() {
        if (!this.isMonitoring) {
            return;
        }

        clearInterval(this.intervalId);
        this.isMonitoring = false;
        
        console.log('Memory monitoring stopped');
        this.emit('monitoring:stopped');
    }

    /**
     * Collect current memory metrics
     */
    async collectMetrics() {
        try {
            const timestamp = Date.now();
            const memoryUsage = process.memoryUsage();
            const systemMemory = this.getSystemMemory();
            
            const metrics = {
                timestamp,
                process: {
                    rss: memoryUsage.rss, // Resident Set Size
                    heapTotal: memoryUsage.heapTotal,
                    heapUsed: memoryUsage.heapUsed,
                    external: memoryUsage.external,
                    arrayBuffers: memoryUsage.arrayBuffers,
                    heapUtilization: memoryUsage.heapUsed / memoryUsage.heapTotal,
                    rssUtilization: memoryUsage.rss / systemMemory.total
                },
                system: systemMemory,
                gc: this.getGCMetrics(),
                fragmentation: this.calculateFragmentation(memoryUsage),
                sessionId: process.env.CLAUDE_FLOW_SESSION_ID || 'default'
            };

            this.addToHistory(metrics);
            await this.analyzeMetrics(metrics);
            await this.detectMemoryLeaks(metrics);
            await this.checkThresholds(metrics);
            
            this.emit('metrics:collected', metrics);
            
        } catch (error) {
            console.error('Error collecting memory metrics:', error);
            this.emit('error', error);
        }
    }

    /**
     * Get system memory information
     */
    getSystemMemory() {
        const os = require('os');
        const total = os.totalmem();
        const free = os.freemem();
        const used = total - free;
        
        return {
            total,
            free,
            used,
            utilization: used / total,
            available: free
        };
    }

    /**
     * Get garbage collection metrics
     */
    getGCMetrics() {
        try {
            if (process.memoryUsage.gc) {
                return process.memoryUsage.gc();
            }
            return { collected: 0, duration: 0, type: 'unknown' };
        } catch (error) {
            return { error: error.message };
        }
    }

    /**
     * Calculate memory fragmentation
     */
    calculateFragmentation(memoryUsage) {
        const heapFragmentation = (memoryUsage.heapTotal - memoryUsage.heapUsed) / memoryUsage.heapTotal;
        const rssFragmentation = (memoryUsage.rss - memoryUsage.heapTotal) / memoryUsage.rss;
        
        return {
            heap: heapFragmentation,
            rss: rssFragmentation,
            score: (heapFragmentation + rssFragmentation) / 2,
            level: this.getFragmentationLevel(heapFragmentation)
        };
    }

    /**
     * Determine fragmentation level
     */
    getFragmentationLevel(score) {
        if (score > this.options.fragmentation.threshold) {
            return 'high';
        } else if (score > this.options.fragmentation.threshold * 0.5) {
            return 'medium';
        }
        return 'low';
    }

    /**
     * Add metrics to history with size management
     */
    addToHistory(metrics) {
        this.history.push(metrics);
        
        if (this.history.length > this.options.historySize) {
            this.history = this.history.slice(-this.options.historySize);
        }
    }

    /**
     * Analyze memory metrics for patterns
     */
    async analyzeMetrics(current) {
        if (this.history.length < 2) return;

        const previous = this.history[this.history.length - 2];
        const growth = {
            rss: (current.process.rss - previous.process.rss) / previous.process.rss,
            heap: (current.process.heapUsed - previous.process.heapUsed) / previous.process.heapUsed,
            external: (current.process.external - previous.process.external) / previous.process.external
        };

        // Update session metrics
        const sessionId = current.sessionId;
        if (!this.sessionMetrics.has(sessionId)) {
            this.sessionMetrics.set(sessionId, {
                startTime: current.timestamp,
                initialMemory: current.process.rss,
                peakMemory: current.process.rss,
                samples: 0,
                totalGrowth: 0,
                leakScore: 0
            });
        }

        const sessionData = this.sessionMetrics.get(sessionId);
        sessionData.samples++;
        sessionData.peakMemory = Math.max(sessionData.peakMemory, current.process.rss);
        sessionData.totalGrowth = (current.process.rss - sessionData.initialMemory) / sessionData.initialMemory;

        // Emit analysis results
        this.emit('analysis:completed', {
            current,
            growth,
            session: sessionData,
            trends: this.calculateTrends()
        });
    }

    /**
     * Calculate memory usage trends
     */
    calculateTrends() {
        if (this.history.length < 10) return { insufficient_data: true };

        const recent = this.history.slice(-10);
        const older = this.history.slice(-20, -10);
        
        if (older.length === 0) return { insufficient_data: true };

        const recentAvg = recent.reduce((sum, m) => sum + m.process.rss, 0) / recent.length;
        const olderAvg = older.reduce((sum, m) => sum + m.process.rss, 0) / older.length;
        
        return {
            direction: recentAvg > olderAvg ? 'increasing' : 'decreasing',
            rate: (recentAvg - olderAvg) / olderAvg,
            confidence: this.calculateTrendConfidence(recent)
        };
    }

    /**
     * Calculate trend confidence based on variance
     */
    calculateTrendConfidence(samples) {
        const values = samples.map(s => s.process.rss);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        const coefficient = stdDev / mean;
        
        // Lower coefficient of variation = higher confidence
        return Math.max(0, 1 - coefficient);
    }

    /**
     * Detect memory leaks using various algorithms
     */
    async detectMemoryLeaks(current) {
        if (!this.options.leakDetection.enabled || this.history.length < this.options.leakDetection.windowSize) {
            return;
        }

        const windowSize = this.options.leakDetection.windowSize;
        const recentWindow = this.history.slice(-windowSize);
        
        // Algorithm 1: Sustained growth detection
        const sustainedLeak = this.detectSustainedGrowth(recentWindow);
        
        // Algorithm 2: Staircase pattern detection
        const staircaseLeak = this.detectStaircasePattern(recentWindow);
        
        // Algorithm 3: GC inefficiency detection
        const gcLeak = this.detectGCInefficiency(recentWindow);
        
        const leakDetection = {
            timestamp: current.timestamp,
            sustained: sustainedLeak,
            staircase: staircaseLeak,
            gcInefficiency: gcLeak,
            overallScore: (sustainedLeak.score + staircaseLeak.score + gcLeak.score) / 3
        };

        if (leakDetection.overallScore > 0.7) {
            this.emit('leak:detected', leakDetection);
            await this.logLeakDetection(leakDetection);
        }

        return leakDetection;
    }

    /**
     * Detect sustained memory growth
     */
    detectSustainedGrowth(window) {
        const growthRates = [];
        
        for (let i = 1; i < window.length; i++) {
            const growth = (window[i].process.rss - window[i-1].process.rss) / window[i-1].process.rss;
            growthRates.push(growth);
        }
        
        const positiveGrowthCount = growthRates.filter(rate => rate > 0.001).length; // 0.1% growth
        const sustainedGrowthScore = positiveGrowthCount / growthRates.length;
        
        return {
            score: sustainedGrowthScore,
            detected: sustainedGrowthScore > 0.7,
            details: {
                positiveGrowthRatio: sustainedGrowthScore,
                averageGrowthRate: growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length
            }
        };
    }

    /**
     * Detect staircase memory pattern (allocate-hold-allocate)
     */
    detectStaircasePattern(window) {
        const plateauThreshold = 0.001; // 0.1% change
        let plateauCount = 0;
        let jumpCount = 0;
        
        for (let i = 1; i < window.length; i++) {
            const change = Math.abs((window[i].process.rss - window[i-1].process.rss) / window[i-1].process.rss);
            
            if (change < plateauThreshold) {
                plateauCount++;
            } else if (change > 0.05) { // 5% jump
                jumpCount++;
            }
        }
        
        const staircaseScore = plateauCount > 0 ? jumpCount / plateauCount : 0;
        
        return {
            score: Math.min(staircaseScore, 1.0),
            detected: staircaseScore > 0.3,
            details: {
                plateauCount,
                jumpCount,
                ratio: staircaseScore
            }
        };
    }

    /**
     * Detect garbage collection inefficiency
     */
    detectGCInefficiency(window) {
        const gcEfficiency = window.map(sample => {
            if (sample.gc && sample.gc.collected) {
                return sample.gc.collected / sample.process.heapUsed;
            }
            return 0;
        });
        
        const avgEfficiency = gcEfficiency.reduce((sum, eff) => sum + eff, 0) / gcEfficiency.length;
        const inefficiencyScore = Math.max(0, 1 - avgEfficiency * 10); // Scale efficiency
        
        return {
            score: inefficiencyScore,
            detected: inefficiencyScore > 0.6,
            details: {
                averageEfficiency: avgEfficiency,
                samples: gcEfficiency.length
            }
        };
    }

    /**
     * Check memory thresholds and trigger alerts
     */
    async checkThresholds(metrics) {
        const utilization = metrics.system.utilization;
        const heapUtilization = metrics.process.heapUtilization;
        
        // System memory thresholds
        if (utilization >= this.options.memoryThresholds.emergency) {
            this.emit('alert:emergency', {
                type: 'memory_emergency',
                utilization,
                metrics,
                message: `System memory at ${(utilization * 100).toFixed(1)}% - EMERGENCY`
            });
        } else if (utilization >= this.options.memoryThresholds.critical) {
            this.emit('alert:critical', {
                type: 'memory_critical',
                utilization,
                metrics,
                message: `System memory at ${(utilization * 100).toFixed(1)}% - CRITICAL`
            });
        } else if (utilization >= this.options.memoryThresholds.warning) {
            this.emit('alert:warning', {
                type: 'memory_warning',
                utilization,
                metrics,
                message: `System memory at ${(utilization * 100).toFixed(1)}% - WARNING`
            });
        }
        
        // Heap memory thresholds
        if (heapUtilization >= 0.9) {
            this.emit('alert:heap_pressure', {
                type: 'heap_pressure',
                utilization: heapUtilization,
                metrics,
                message: `Heap utilization at ${(heapUtilization * 100).toFixed(1)}%`
            });
        }
    }

    /**
     * Generate memory optimization recommendations
     */
    generateOptimizationRecommendations() {
        if (this.history.length < 10) {
            return { insufficient_data: true };
        }

        const recommendations = [];
        const latest = this.history[this.history.length - 1];
        const trends = this.calculateTrends();
        
        // High fragmentation
        if (latest.fragmentation.level === 'high') {
            recommendations.push({
                type: 'fragmentation',
                priority: 'high',
                recommendation: 'Consider triggering garbage collection or reducing object allocation frequency',
                details: `Fragmentation score: ${latest.fragmentation.score.toFixed(3)}`
            });
        }
        
        // Memory growth trend
        if (trends.direction === 'increasing' && trends.rate > 0.1) {
            recommendations.push({
                type: 'growth_trend',
                priority: 'medium',
                recommendation: 'Memory usage is increasing rapidly. Review recent changes for potential leaks.',
                details: `Growth rate: ${(trends.rate * 100).toFixed(1)}% per measurement window`
            });
        }
        
        // High heap utilization
        if (latest.process.heapUtilization > 0.8) {
            recommendations.push({
                type: 'heap_pressure',
                priority: 'high',
                recommendation: 'Heap utilization is high. Consider increasing heap size or optimizing memory usage.',
                details: `Heap utilization: ${(latest.process.heapUtilization * 100).toFixed(1)}%`
            });
        }
        
        // Session analysis
        for (const [sessionId, sessionData] of this.sessionMetrics.entries()) {
            if (sessionData.totalGrowth > 0.5) { // 50% growth
                recommendations.push({
                    type: 'session_growth',
                    priority: 'medium',
                    recommendation: `Session ${sessionId} shows significant memory growth`,
                    details: `Total growth: ${(sessionData.totalGrowth * 100).toFixed(1)}%`
                });
            }
        }
        
        return {
            timestamp: Date.now(),
            totalRecommendations: recommendations.length,
            recommendations: recommendations.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            })
        };
    }

    /**
     * Export metrics for external analysis
     */
    async exportMetrics(format = 'json') {
        const exportData = {
            metadata: {
                exportTime: new Date().toISOString(),
                monitoringDuration: this.isMonitoring ? Date.now() - this.history[0]?.timestamp : 0,
                totalSamples: this.history.length,
                sessionCount: this.sessionMetrics.size
            },
            configuration: this.options,
            history: this.history,
            sessions: Object.fromEntries(this.sessionMetrics),
            leakPatterns: this.leakPatterns,
            recommendations: this.generateOptimizationRecommendations()
        };

        const filename = `memory-export-${Date.now()}.${format}`;
        const filepath = path.join(this.logPath, filename);
        
        try {
            if (format === 'json') {
                await fs.writeFile(filepath, JSON.stringify(exportData, null, 2));
            } else if (format === 'csv') {
                const csv = this.convertToCSV(exportData.history);
                await fs.writeFile(filepath, csv);
            }
            
            return { success: true, filepath, size: exportData.history.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Convert metrics to CSV format
     */
    convertToCSV(history) {
        if (history.length === 0) return '';
        
        const headers = [
            'timestamp', 'rss', 'heapTotal', 'heapUsed', 'external', 'arrayBuffers',
            'heapUtilization', 'systemTotal', 'systemUsed', 'systemUtilization',
            'fragmentationScore', 'sessionId'
        ];
        
        const rows = history.map(item => [
            item.timestamp,
            item.process.rss,
            item.process.heapTotal,
            item.process.heapUsed,
            item.process.external,
            item.process.arrayBuffers,
            item.process.heapUtilization,
            item.system.total,
            item.system.used,
            item.system.utilization,
            item.fragmentation.score,
            item.sessionId
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    /**
     * Log memory leak detection
     */
    async logLeakDetection(detection) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            detection,
            systemState: this.history[this.history.length - 1]
        };
        
        const logFile = path.join(this.logPath, 'memory-leaks.jsonl');
        
        try {
            await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
        } catch (error) {
            console.error('Failed to log leak detection:', error);
        }
        
        this.leakPatterns.push(detection);
        if (this.leakPatterns.length > 100) {
            this.leakPatterns = this.leakPatterns.slice(-50);
        }
    }

    /**
     * Get current status summary
     */
    getStatus() {
        const latest = this.history[this.history.length - 1];
        const recommendations = this.generateOptimizationRecommendations();
        
        return {
            monitoring: this.isMonitoring,
            samples: this.history.length,
            sessions: this.sessionMetrics.size,
            current: latest ? {
                timestamp: latest.timestamp,
                rssGB: (latest.process.rss / 1024 / 1024 / 1024).toFixed(2),
                heapUtilization: (latest.process.heapUtilization * 100).toFixed(1) + '%',
                systemUtilization: (latest.system.utilization * 100).toFixed(1) + '%',
                fragmentation: latest.fragmentation.level
            } : null,
            recommendations: recommendations.insufficient_data ? 0 : recommendations.totalRecommendations,
            alerts: {
                leaks: this.leakPatterns.length,
                recent: this.leakPatterns.filter(p => Date.now() - p.timestamp < 300000).length // 5 minutes
            }
        };
    }
}

module.exports = MemoryMonitor;