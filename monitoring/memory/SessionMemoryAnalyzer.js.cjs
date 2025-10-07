/**
 * Session Memory Analyzer
 * Analyzes memory growth patterns across hive mind sessions and correlates performance data
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class SessionMemoryAnalyzer extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            sessionTimeout: options.sessionTimeout || 3600000, // 1 hour
            analysisWindow: options.analysisWindow || 300000, // 5 minutes
            correlationThreshold: options.correlationThreshold || 0.7,
            growthThresholds: {
                normal: options.normalGrowth || 0.1, // 10%
                concerning: options.concerningGrowth || 0.3, // 30%
                critical: options.criticalGrowth || 0.5 // 50%
            },
            fragmentationAnalysis: {
                enabled: options.fragmentationAnalysis !== false,
                threshold: options.fragmentationThreshold || 0.2
            },
            checkpointAnalysis: {
                enabled: options.checkpointAnalysis !== false,
                sizeThreshold: options.checkpointSizeThreshold || 10 * 1024 * 1024 // 10MB
            }
        };

        this.sessions = new Map();
        this.crossSessionPatterns = [];
        this.correlationCache = new Map();
        this.analysisHistory = [];
        
        this.logPath = path.join(process.cwd(), 'monitoring', 'memory', 'sessions');
        this.memoryPath = path.join(process.cwd(), 'memory', 'sessions');
        this.metricsPath = path.join(process.cwd(), '.claude-flow', 'metrics');
        
        this.initializeDirectories();
        this.startPeriodicAnalysis();
    }

    async initializeDirectories() {
        try {
            await fs.mkdir(this.logPath, { recursive: true });
            await fs.mkdir(path.join(this.logPath, 'checkpoints'), { recursive: true });
            await fs.mkdir(path.join(this.logPath, 'correlations'), { recursive: true });
        } catch (error) {
            console.warn('Failed to create session analysis directories:', error.message);
        }
    }

    /**
     * Start periodic session analysis
     */
    startPeriodicAnalysis() {
        setInterval(() => {
            this.performPeriodicAnalysis();
        }, this.options.analysisWindow);
    }

    /**
     * Register a new session for analysis
     */
    registerSession(sessionId, metadata = {}) {
        const session = {
            id: sessionId,
            startTime: Date.now(),
            metadata,
            memorySnapshots: [],
            checkpoints: [],
            growthAnalysis: {
                totalGrowth: 0,
                peakMemory: 0,
                avgGrowthRate: 0,
                growthPhases: []
            },
            fragmentationHistory: [],
            correlations: new Map(),
            status: 'active'
        };

        this.sessions.set(sessionId, session);
        this.emit('session:registered', session);
        
        console.log(`Registered session for analysis: ${sessionId}`);
        return session;
    }

    /**
     * Add memory snapshot to session
     */
    addMemorySnapshot(sessionId, memoryMetrics) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            // Auto-register session if it doesn't exist
            this.registerSession(sessionId);
            return this.addMemorySnapshot(sessionId, memoryMetrics);
        }

        const snapshot = {
            timestamp: Date.now(),
            metrics: memoryMetrics,
            analysis: this.analyzeSnapshot(memoryMetrics, session)
        };

        session.memorySnapshots.push(snapshot);
        this.updateSessionGrowthAnalysis(session, snapshot);
        
        // Keep snapshots manageable
        if (session.memorySnapshots.length > 1000) {
            session.memorySnapshots = session.memorySnapshots.slice(-500);
        }

        this.emit('snapshot:added', { sessionId, snapshot });
        return snapshot;
    }

    /**
     * Analyze individual memory snapshot
     */
    analyzeSnapshot(memoryMetrics, session) {
        const analysis = {
            memoryEfficiency: this.calculateMemoryEfficiency(memoryMetrics),
            fragmentationScore: memoryMetrics.fragmentation?.score || 0,
            heapPressure: memoryMetrics.process?.heapUtilization || 0,
            systemPressure: memoryMetrics.system?.utilization || 0
        };

        // Compare with previous snapshot if available
        if (session.memorySnapshots.length > 0) {
            const previous = session.memorySnapshots[session.memorySnapshots.length - 1];
            analysis.growth = this.calculateSnapshotGrowth(previous.metrics, memoryMetrics);
        }

        return analysis;
    }

    /**
     * Calculate memory efficiency score
     */
    calculateMemoryEfficiency(metrics) {
        const heapEfficiency = 1 - (metrics.process?.heapUtilization || 0);
        const systemEfficiency = 1 - (metrics.system?.utilization || 0);
        const fragmentationPenalty = metrics.fragmentation?.score || 0;
        
        return Math.max(0, (heapEfficiency + systemEfficiency) / 2 - fragmentationPenalty);
    }

    /**
     * Calculate growth between snapshots
     */
    calculateSnapshotGrowth(previous, current) {
        return {
            rss: (current.process.rss - previous.process.rss) / previous.process.rss,
            heap: (current.process.heapUsed - previous.process.heapUsed) / previous.process.heapUsed,
            external: (current.process.external - previous.process.external) / previous.process.external,
            system: (current.system.used - previous.system.used) / previous.system.used,
            timespan: current.timestamp - previous.timestamp
        };
    }

    /**
     * Update session growth analysis
     */
    updateSessionGrowthAnalysis(session, snapshot) {
        const growth = session.growthAnalysis;
        const current = snapshot.metrics;

        // Update peak memory
        growth.peakMemory = Math.max(growth.peakMemory, current.process.rss);

        // Calculate total growth from start
        if (session.memorySnapshots.length > 0) {
            const initial = session.memorySnapshots[0].metrics;
            growth.totalGrowth = (current.process.rss - initial.process.rss) / initial.process.rss;
        }

        // Update average growth rate
        if (snapshot.analysis.growth) {
            const existingRates = growth.growthPhases.map(p => p.rate);
            existingRates.push(snapshot.analysis.growth.rss);
            growth.avgGrowthRate = existingRates.reduce((sum, rate) => sum + rate, 0) / existingRates.length;
        }

        // Detect growth phases
        this.detectGrowthPhases(session, snapshot);
    }

    /**
     * Detect distinct growth phases in session
     */
    detectGrowthPhases(session, snapshot) {
        if (!snapshot.analysis.growth) return;

        const growth = snapshot.analysis.growth;
        const threshold = 0.05; // 5% change to trigger new phase
        
        const currentPhase = session.growthAnalysis.growthPhases[session.growthAnalysis.growthPhases.length - 1];
        
        if (!currentPhase || Math.abs(growth.rss - currentPhase.rate) > threshold) {
            const newPhase = {
                startTime: snapshot.timestamp,
                rate: growth.rss,
                type: this.classifyGrowthRate(growth.rss),
                duration: 0,
                memoryDelta: 0
            };
            
            // Close previous phase
            if (currentPhase) {
                currentPhase.duration = snapshot.timestamp - currentPhase.startTime;
                currentPhase.memoryDelta = snapshot.metrics.process.rss - currentPhase.startMemory;
            }
            
            newPhase.startMemory = snapshot.metrics.process.rss;
            session.growthAnalysis.growthPhases.push(newPhase);
        }
    }

    /**
     * Classify growth rate
     */
    classifyGrowthRate(rate) {
        if (rate > this.options.growthThresholds.critical) return 'critical';
        if (rate > this.options.growthThresholds.concerning) return 'concerning';
        if (rate > this.options.growthThresholds.normal) return 'normal';
        if (rate < -0.05) return 'shrinking';
        return 'stable';
    }

    /**
     * Create memory checkpoint for session
     */
    async createCheckpoint(sessionId, reason = 'manual') {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const checkpoint = {
            id: `checkpoint_${sessionId}_${Date.now()}`,
            sessionId,
            timestamp: Date.now(),
            reason,
            memoryState: session.memorySnapshots.length > 0 ? 
                session.memorySnapshots[session.memorySnapshots.length - 1].metrics : null,
            growthAnalysis: { ...session.growthAnalysis },
            sessionDuration: Date.now() - session.startTime,
            snapshotCount: session.memorySnapshots.length
        };

        // Save checkpoint to file
        const checkpointPath = path.join(this.logPath, 'checkpoints', `${checkpoint.id}.json`);
        await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));

        session.checkpoints.push(checkpoint);
        this.emit('checkpoint:created', checkpoint);

        return checkpoint;
    }

    /**
     * Analyze session memory patterns
     */
    async analyzeSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const analysis = {
            sessionId,
            duration: Date.now() - session.startTime,
            snapshotCount: session.memorySnapshots.length,
            memoryAnalysis: this.analyzeMemoryPatterns(session),
            growthAnalysis: this.analyzeGrowthPatterns(session),
            fragmentationAnalysis: this.analyzeFragmentationPatterns(session),
            performanceCorrelations: await this.analyzePerformanceCorrelations(session),
            recommendations: this.generateSessionRecommendations(session),
            healthScore: this.calculateSessionHealthScore(session)
        };

        this.analysisHistory.push(analysis);
        this.emit('session:analyzed', analysis);

        // Save analysis to file
        const analysisPath = path.join(this.logPath, `session_analysis_${sessionId}_${Date.now()}.json`);
        await fs.writeFile(analysisPath, JSON.stringify(analysis, null, 2));

        return analysis;
    }

    /**
     * Analyze memory usage patterns in session
     */
    analyzeMemoryPatterns(session) {
        if (session.memorySnapshots.length === 0) {
            return { insufficient_data: true };
        }

        const snapshots = session.memorySnapshots;
        const memoryValues = snapshots.map(s => s.metrics.process.rss);
        
        return {
            initial: memoryValues[0],
            final: memoryValues[memoryValues.length - 1],
            peak: Math.max(...memoryValues),
            minimum: Math.min(...memoryValues),
            average: memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length,
            variance: this.calculateVariance(memoryValues),
            trend: this.calculateTrend(memoryValues),
            stability: this.calculateStability(memoryValues)
        };
    }

    /**
     * Analyze growth patterns in session
     */
    analyzeGrowthPatterns(session) {
        const phases = session.growthAnalysis.growthPhases;
        
        return {
            totalGrowth: session.growthAnalysis.totalGrowth,
            avgGrowthRate: session.growthAnalysis.avgGrowthRate,
            peakMemory: session.growthAnalysis.peakMemory,
            phaseCount: phases.length,
            phaseAnalysis: {
                stable: phases.filter(p => p.type === 'stable').length,
                normal: phases.filter(p => p.type === 'normal').length,
                concerning: phases.filter(p => p.type === 'concerning').length,
                critical: phases.filter(p => p.type === 'critical').length,
                shrinking: phases.filter(p => p.type === 'shrinking').length
            },
            longestPhase: phases.reduce((longest, phase) => 
                (phase.duration || 0) > (longest.duration || 0) ? phase : longest, {}),
            mostProblematicPhase: phases.find(p => p.type === 'critical') || 
                                   phases.find(p => p.type === 'concerning')
        };
    }

    /**
     * Analyze fragmentation patterns
     */
    analyzeFragmentationPatterns(session) {
        const fragmentationScores = session.memorySnapshots
            .map(s => s.metrics.fragmentation?.score || 0)
            .filter(score => score > 0);

        if (fragmentationScores.length === 0) {
            return { no_data: true };
        }

        return {
            average: fragmentationScores.reduce((sum, score) => sum + score, 0) / fragmentationScores.length,
            peak: Math.max(...fragmentationScores),
            trend: this.calculateTrend(fragmentationScores),
            highFragmentationPeriods: fragmentationScores.filter(score => 
                score > this.options.fragmentationAnalysis.threshold).length,
            fragmentationStability: this.calculateStability(fragmentationScores)
        };
    }

    /**
     * Analyze correlations with performance metrics
     */
    async analyzePerformanceCorrelations(session) {
        try {
            // Load performance metrics from claude-flow
            const performanceData = await this.loadPerformanceMetrics();
            if (!performanceData) {
                return { no_performance_data: true };
            }

            const correlations = {};
            const memoryTimestamps = session.memorySnapshots.map(s => s.timestamp);
            const memoryValues = session.memorySnapshots.map(s => s.metrics.process.rss);

            // Correlate with task completion times
            if (performanceData.taskMetrics) {
                correlations.taskCompletion = this.calculateCorrelation(
                    memoryValues,
                    performanceData.taskMetrics.completionTimes || []
                );
            }

            // Correlate with CPU usage
            if (performanceData.systemMetrics) {
                correlations.cpuUsage = this.calculateCorrelation(
                    memoryValues,
                    performanceData.systemMetrics.map(m => m.cpuLoad || 0)
                );
            }

            return correlations;

        } catch (error) {
            return { error: error.message };
        }
    }

    /**
     * Load performance metrics from claude-flow
     */
    async loadPerformanceMetrics() {
        try {
            const performancePath = path.join(this.metricsPath, 'performance.json');
            const systemMetricsPath = path.join(this.metricsPath, 'system-metrics.json');
            
            const [performanceData, systemData] = await Promise.all([
                fs.readFile(performancePath, 'utf8').then(JSON.parse).catch(() => null),
                fs.readFile(systemMetricsPath, 'utf8').then(JSON.parse).catch(() => null)
            ]);

            return {
                taskMetrics: performanceData,
                systemMetrics: systemData
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Calculate correlation coefficient between two arrays
     */
    calculateCorrelation(x, y) {
        if (x.length !== y.length || x.length < 2) {
            return { insufficient_data: true };
        }

        const n = x.length;
        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);
        const sumYY = y.reduce((sum, val) => sum + val * val, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

        if (denominator === 0) {
            return { correlation: 0, strength: 'none' };
        }

        const correlation = numerator / denominator;
        const strength = Math.abs(correlation) > 0.8 ? 'strong' :
                        Math.abs(correlation) > 0.5 ? 'moderate' :
                        Math.abs(correlation) > 0.3 ? 'weak' : 'none';

        return { correlation, strength };
    }

    /**
     * Calculate variance of values
     */
    calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    }

    /**
     * Calculate trend direction and strength
     */
    calculateTrend(values) {
        if (values.length < 2) return { direction: 'unknown', strength: 0 };

        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
        const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const direction = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable';
        const strength = Math.abs(slope) / (values.reduce((sum, val) => sum + val, 0) / n);

        return { direction, strength, slope };
    }

    /**
     * Calculate stability score (lower variance = higher stability)
     */
    calculateStability(values) {
        const variance = this.calculateVariance(values);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const coefficientOfVariation = Math.sqrt(variance) / mean;
        
        return Math.max(0, 1 - coefficientOfVariation);
    }

    /**
     * Generate recommendations for session
     */
    generateSessionRecommendations(session) {
        const recommendations = [];
        const growth = session.growthAnalysis;

        // Growth-based recommendations
        if (growth.totalGrowth > this.options.growthThresholds.critical) {
            recommendations.push({
                type: 'critical_growth',
                priority: 'high',
                message: 'Session shows critical memory growth - investigate memory leaks',
                action: 'Review code for unreleased resources and implement proper cleanup'
            });
        } else if (growth.totalGrowth > this.options.growthThresholds.concerning) {
            recommendations.push({
                type: 'concerning_growth',
                priority: 'medium',
                message: 'Session shows concerning memory growth pattern',
                action: 'Monitor closely and consider memory optimization'
            });
        }

        // Phase-based recommendations
        const problematicPhases = growth.growthPhases.filter(p => 
            p.type === 'critical' || p.type === 'concerning'
        ).length;

        if (problematicPhases > growth.growthPhases.length * 0.5) {
            recommendations.push({
                type: 'unstable_memory',
                priority: 'high',
                message: 'Session shows unstable memory behavior with multiple problematic phases',
                action: 'Implement memory monitoring and consider session segmentation'
            });
        }

        // Fragmentation recommendations
        const avgFragmentation = session.memorySnapshots.length > 0 ?
            session.memorySnapshots.reduce((sum, s) => sum + (s.metrics.fragmentation?.score || 0), 0) / 
            session.memorySnapshots.length : 0;

        if (avgFragmentation > this.options.fragmentationAnalysis.threshold) {
            recommendations.push({
                type: 'high_fragmentation',
                priority: 'medium',
                message: 'Session shows high memory fragmentation',
                action: 'Consider garbage collection tuning and object pooling'
            });
        }

        return recommendations;
    }

    /**
     * Calculate overall session health score
     */
    calculateSessionHealthScore(session) {
        let score = 1.0;
        const growth = session.growthAnalysis;

        // Penalize excessive growth
        if (growth.totalGrowth > this.options.growthThresholds.critical) {
            score -= 0.4;
        } else if (growth.totalGrowth > this.options.growthThresholds.concerning) {
            score -= 0.2;
        } else if (growth.totalGrowth > this.options.growthThresholds.normal) {
            score -= 0.1;
        }

        // Penalize unstable phases
        const problematicPhaseRatio = growth.growthPhases.filter(p => 
            p.type === 'critical' || p.type === 'concerning'
        ).length / Math.max(1, growth.growthPhases.length);
        
        score -= problematicPhaseRatio * 0.3;

        // Penalize high fragmentation
        const avgFragmentation = session.memorySnapshots.length > 0 ?
            session.memorySnapshots.reduce((sum, s) => sum + (s.metrics.fragmentation?.score || 0), 0) / 
            session.memorySnapshots.length : 0;
        
        score -= avgFragmentation * 0.2;

        return Math.max(0, Math.min(1, score));
    }

    /**
     * Perform periodic analysis of all sessions
     */
    async performPeriodicAnalysis() {
        const activeSessions = Array.from(this.sessions.values()).filter(s => s.status === 'active');
        
        for (const session of activeSessions) {
            // Check if session should be marked as inactive
            const timeSinceLastSnapshot = Date.now() - 
                (session.memorySnapshots.length > 0 ? 
                 session.memorySnapshots[session.memorySnapshots.length - 1].timestamp : 
                 session.startTime);
                 
            if (timeSinceLastSnapshot > this.options.sessionTimeout) {
                session.status = 'inactive';
                await this.analyzeSession(session.id);
                this.emit('session:completed', session);
            }
        }

        // Analyze cross-session patterns
        await this.analyzeCrossSessionPatterns();
    }

    /**
     * Analyze patterns across multiple sessions
     */
    async analyzeCrossSessionPatterns() {
        const completedSessions = Array.from(this.sessions.values()).filter(s => s.status === 'inactive');
        
        if (completedSessions.length < 2) {
            return;
        }

        const patterns = {
            averageGrowth: completedSessions.reduce((sum, s) => sum + s.growthAnalysis.totalGrowth, 0) / completedSessions.length,
            commonGrowthPatterns: this.findCommonGrowthPatterns(completedSessions),
            sessionDurationCorrelation: this.analyzeSessionDurationCorrelation(completedSessions),
            memoryEfficiencyTrends: this.analyzeMemoryEfficiencyTrends(completedSessions)
        };

        this.crossSessionPatterns.push({
            timestamp: Date.now(),
            sessionCount: completedSessions.length,
            patterns
        });

        this.emit('cross_session:analyzed', patterns);
    }

    /**
     * Find common growth patterns across sessions
     */
    findCommonGrowthPatterns(sessions) {
        const phaseTypes = ['stable', 'normal', 'concerning', 'critical', 'shrinking'];
        const patterns = {};

        for (const type of phaseTypes) {
            const sessionsWithType = sessions.filter(s => 
                s.growthAnalysis.growthPhases.some(p => p.type === type)
            ).length;
            
            patterns[type] = sessionsWithType / sessions.length;
        }

        return patterns;
    }

    /**
     * Analyze correlation between session duration and memory growth
     */
    analyzeSessionDurationCorrelation(sessions) {
        const durations = sessions.map(s => Date.now() - s.startTime);
        const growths = sessions.map(s => s.growthAnalysis.totalGrowth);
        
        return this.calculateCorrelation(durations, growths);
    }

    /**
     * Analyze memory efficiency trends across sessions
     */
    analyzeMemoryEfficiencyTrends(sessions) {
        const efficiencyScores = sessions.map(s => {
            if (s.memorySnapshots.length === 0) return 0;
            return s.memorySnapshots.reduce((sum, snap) => sum + snap.analysis.memoryEfficiency, 0) / 
                   s.memorySnapshots.length;
        });

        return {
            average: efficiencyScores.reduce((sum, score) => sum + score, 0) / efficiencyScores.length,
            trend: this.calculateTrend(efficiencyScores),
            distribution: {
                high: efficiencyScores.filter(s => s > 0.8).length / efficiencyScores.length,
                medium: efficiencyScores.filter(s => s > 0.5 && s <= 0.8).length / efficiencyScores.length,
                low: efficiencyScores.filter(s => s <= 0.5).length / efficiencyScores.length
            }
        };
    }

    /**
     * Get session analysis summary
     */
    getSessionSummary(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        return {
            id: session.id,
            status: session.status,
            duration: Date.now() - session.startTime,
            snapshotCount: session.memorySnapshots.length,
            checkpointCount: session.checkpoints.length,
            totalGrowth: session.growthAnalysis.totalGrowth,
            peakMemory: session.growthAnalysis.peakMemory,
            healthScore: this.calculateSessionHealthScore(session),
            lastActivity: session.memorySnapshots.length > 0 ?
                session.memorySnapshots[session.memorySnapshots.length - 1].timestamp :
                session.startTime
        };
    }

    /**
     * Export session data for external analysis
     */
    async exportSessionData(sessionId, format = 'json') {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }

        const exportData = {
            session: {
                ...session,
                analysis: await this.analyzeSession(sessionId)
            },
            metadata: {
                exportTime: new Date().toISOString(),
                format
            }
        };

        const filename = `session_export_${sessionId}_${Date.now()}.${format}`;
        const filepath = path.join(this.logPath, filename);

        if (format === 'json') {
            await fs.writeFile(filepath, JSON.stringify(exportData, null, 2));
        } else if (format === 'csv') {
            const csv = this.convertSessionToCSV(session);
            await fs.writeFile(filepath, csv);
        }

        return { success: true, filepath, size: session.memorySnapshots.length };
    }

    /**
     * Convert session data to CSV format
     */
    convertSessionToCSV(session) {
        if (session.memorySnapshots.length === 0) return '';

        const headers = [
            'timestamp', 'rss', 'heapUsed', 'heapUtilization', 'fragmentation',
            'memoryEfficiency', 'growthRate', 'growthPhase'
        ];

        const rows = session.memorySnapshots.map((snapshot, index) => [
            snapshot.timestamp,
            snapshot.metrics.process.rss,
            snapshot.metrics.process.heapUsed,
            snapshot.metrics.process.heapUtilization,
            snapshot.metrics.fragmentation?.score || 0,
            snapshot.analysis.memoryEfficiency,
            snapshot.analysis.growth?.rss || 0,
            session.growthAnalysis.growthPhases.find(p => 
                snapshot.timestamp >= p.startTime && 
                (p.duration === 0 || snapshot.timestamp <= p.startTime + p.duration)
            )?.type || 'unknown'
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    /**
     * Clean up old sessions and analysis data
     */
    async cleanup(retentionDays = 7) {
        const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
        let cleaned = 0;

        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.status === 'inactive' && session.startTime < cutoffTime) {
                this.sessions.delete(sessionId);
                cleaned++;
            }
        }

        // Clean analysis history
        this.analysisHistory = this.analysisHistory.filter(a => a.timestamp > cutoffTime);

        console.log(`Cleaned up ${cleaned} old sessions`);
        return cleaned;
    }
}

module.exports = SessionMemoryAnalyzer;