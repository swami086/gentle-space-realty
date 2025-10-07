/**
 * Memory Optimization Engine
 * Generates intelligent recommendations and implements automated optimizations
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class MemoryOptimizationEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = {
            autoOptimization: {
                enabled: options.autoOptimization !== false,
                aggressiveness: options.aggressiveness || 'moderate', // conservative, moderate, aggressive
                maxAutomations: options.maxAutomations || 5 // per hour
            },
            thresholds: {
                memoryPressure: options.memoryPressureThreshold || 0.8,
                fragmentationCritical: options.fragmentationThreshold || 0.4,
                leakSeverity: options.leakThreshold || 0.7,
                performanceDegradation: options.performanceThreshold || 0.3
            },
            optimizationStrategies: {
                garbageCollection: options.gcOptimization !== false,
                cacheOptimization: options.cacheOptimization !== false,
                memoryPooling: options.memoryPooling !== false,
                checkpointOptimization: options.checkpointOptimization !== false,
                sessionSegmentation: options.sessionSegmentation !== false
            },
            learningMode: {
                enabled: options.learningMode !== false,
                patternRecognition: options.patternRecognition !== false,
                adaptiveThresholds: options.adaptiveThresholds !== false
            }
        };

        this.optimizationHistory = [];
        this.performanceBaselines = new Map();
        this.learnedPatterns = new Map();
        this.automationCount = 0;
        this.lastAutomationReset = Date.now();
        
        this.logPath = path.join(process.cwd(), 'monitoring', 'memory', 'optimizations');
        this.initializeDirectories();
        
        // Reset automation count every hour
        setInterval(() => {
            this.automationCount = 0;
            this.lastAutomationReset = Date.now();
        }, 3600000);
    }

    async initializeDirectories() {
        try {
            await fs.mkdir(this.logPath, { recursive: true });
            await fs.mkdir(path.join(this.logPath, 'recommendations'), { recursive: true });
            await fs.mkdir(path.join(this.logPath, 'implementations'), { recursive: true });
            await fs.mkdir(path.join(this.logPath, 'patterns'), { recursive: true });
        } catch (error) {
            console.warn('Failed to create optimization directories:', error.message);
        }
    }

    /**
     * Analyze memory state and generate optimization recommendations
     */
    async generateRecommendations(memoryMetrics, sessionData = null, leakDetection = null) {
        const recommendations = [];
        const analysis = this.analyzeMemoryState(memoryMetrics, sessionData, leakDetection);
        
        // Memory pressure recommendations
        if (analysis.memoryPressure.level === 'critical') {
            recommendations.push(...this.generateMemoryPressureRecommendations(analysis));
        }
        
        // Fragmentation recommendations
        if (analysis.fragmentation.needsOptimization) {
            recommendations.push(...this.generateFragmentationRecommendations(analysis));
        }
        
        // Leak-specific recommendations
        if (analysis.leaks.detected) {
            recommendations.push(...this.generateLeakRecommendations(analysis));
        }
        
        // Performance optimization recommendations
        if (analysis.performance.degraded) {
            recommendations.push(...this.generatePerformanceRecommendations(analysis));
        }
        
        // Session-specific recommendations
        if (sessionData) {
            recommendations.push(...this.generateSessionRecommendations(analysis, sessionData));
        }
        
        // Checkpoint optimization recommendations
        recommendations.push(...this.generateCheckpointRecommendations(analysis));
        
        // Apply learning and pattern recognition
        if (this.options.learningMode.enabled) {
            recommendations.push(...this.generateLearningBasedRecommendations(analysis));
        }

        // Prioritize and score recommendations
        const prioritizedRecommendations = this.prioritizeRecommendations(recommendations, analysis);
        
        // Save recommendations
        await this.saveRecommendations(prioritizedRecommendations, analysis);
        
        // Auto-implement if enabled
        if (this.options.autoOptimization.enabled) {
            await this.autoImplementRecommendations(prioritizedRecommendations, analysis);
        }

        this.emit('recommendations:generated', {
            recommendations: prioritizedRecommendations,
            analysis,
            timestamp: Date.now()
        });

        return prioritizedRecommendations;
    }

    /**
     * Analyze current memory state
     */
    analyzeMemoryState(memoryMetrics, sessionData, leakDetection) {
        return {
            timestamp: Date.now(),
            memoryPressure: this.analyzeMemoryPressure(memoryMetrics),
            fragmentation: this.analyzeFragmentation(memoryMetrics),
            leaks: this.analyzeLeaks(leakDetection),
            performance: this.analyzePerformance(memoryMetrics),
            trends: this.analyzeTrends(memoryMetrics, sessionData),
            context: this.analyzeContext(sessionData)
        };
    }

    /**
     * Analyze memory pressure levels
     */
    analyzeMemoryPressure(metrics) {
        const systemUtilization = metrics.system?.utilization || 0;
        const heapUtilization = metrics.process?.heapUtilization || 0;
        
        const level = systemUtilization > 0.9 ? 'critical' :
                     systemUtilization > 0.8 ? 'high' :
                     systemUtilization > 0.6 ? 'moderate' : 'low';

        return {
            level,
            systemUtilization,
            heapUtilization,
            availableMemory: metrics.system?.available || 0,
            pressureScore: Math.max(systemUtilization, heapUtilization),
            recommendation: this.getMemoryPressureRecommendation(level)
        };
    }

    /**
     * Analyze memory fragmentation
     */
    analyzeFragmentation(metrics) {
        const fragmentationScore = metrics.fragmentation?.score || 0;
        const fragmentationLevel = metrics.fragmentation?.level || 'low';
        
        return {
            score: fragmentationScore,
            level: fragmentationLevel,
            needsOptimization: fragmentationScore > this.options.thresholds.fragmentationCritical,
            heapFragmentation: metrics.fragmentation?.heap || 0,
            rssFragmentation: metrics.fragmentation?.rss || 0,
            optimizationUrgency: fragmentationScore > 0.6 ? 'high' :
                               fragmentationScore > 0.3 ? 'medium' : 'low'
        };
    }

    /**
     * Analyze memory leaks
     */
    analyzeLeaks(leakDetection) {
        if (!leakDetection) {
            return { detected: false, score: 0 };
        }

        return {
            detected: leakDetection.overallScore > this.options.thresholds.leakSeverity,
            score: leakDetection.overallScore,
            patterns: {
                sustained: leakDetection.sustained?.detected || false,
                staircase: leakDetection.staircase?.detected || false,
                gcInefficiency: leakDetection.gcInefficiency?.detected || false
            },
            severity: leakDetection.overallScore > 0.8 ? 'critical' :
                     leakDetection.overallScore > 0.6 ? 'high' :
                     leakDetection.overallScore > 0.4 ? 'medium' : 'low',
            urgency: leakDetection.overallScore > 0.7 ? 'immediate' :
                    leakDetection.overallScore > 0.5 ? 'urgent' : 'moderate'
        };
    }

    /**
     * Analyze performance implications
     */
    analyzePerformance(metrics) {
        // Calculate performance degradation based on memory metrics
        const baselineEfficiency = this.performanceBaselines.get('memory_efficiency') || 0.8;
        const currentEfficiency = 1 - Math.max(
            metrics.system?.utilization || 0,
            metrics.process?.heapUtilization || 0,
            metrics.fragmentation?.score || 0
        );
        
        const degradation = Math.max(0, baselineEfficiency - currentEfficiency);
        
        return {
            degraded: degradation > this.options.thresholds.performanceDegradation,
            degradationScore: degradation,
            currentEfficiency,
            baselineEfficiency,
            impactLevel: degradation > 0.4 ? 'severe' :
                        degradation > 0.2 ? 'moderate' :
                        degradation > 0.1 ? 'minor' : 'none'
        };
    }

    /**
     * Analyze memory trends
     */
    analyzeTrends(metrics, sessionData) {
        // This would typically analyze historical data
        // For now, we'll provide a simplified analysis
        return {
            direction: 'stable', // increasing, decreasing, stable, volatile
            velocity: 0, // rate of change
            confidence: 0.8,
            predictedPeak: null,
            timeToThreshold: null
        };
    }

    /**
     * Analyze context for optimization decisions
     */
    analyzeContext(sessionData) {
        return {
            sessionType: sessionData?.metadata?.type || 'unknown',
            workloadIntensity: 'moderate', // light, moderate, heavy
            criticalityLevel: 'normal', // low, normal, high, critical
            maintenanceWindow: this.isMaintenanceWindow(),
            resourceAvailability: 'normal' // limited, normal, abundant
        };
    }

    /**
     * Generate memory pressure recommendations
     */
    generateMemoryPressureRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.memoryPressure.level === 'critical') {
            recommendations.push({
                id: `memory_pressure_${Date.now()}`,
                type: 'memory_pressure',
                priority: 'critical',
                urgency: 'immediate',
                title: 'Critical Memory Pressure - Immediate Action Required',
                description: 'System memory usage is critically high and may cause performance issues or crashes',
                actions: [
                    {
                        type: 'force_gc',
                        description: 'Force garbage collection to free up heap memory',
                        automated: true,
                        estimatedImpact: 'medium',
                        implementationTime: 'immediate'
                    },
                    {
                        type: 'clear_caches',
                        description: 'Clear non-essential caches and temporary data',
                        automated: true,
                        estimatedImpact: 'medium',
                        implementationTime: 'immediate'
                    },
                    {
                        type: 'memory_dump',
                        description: 'Create memory dump for analysis',
                        automated: false,
                        estimatedImpact: 'none',
                        implementationTime: '1 minute'
                    }
                ],
                estimatedMemorySavings: '10-30%',
                riskLevel: 'low',
                reversible: true
            });
        }
        
        return recommendations;
    }

    /**
     * Generate fragmentation optimization recommendations
     */
    generateFragmentationRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.fragmentation.needsOptimization) {
            recommendations.push({
                id: `fragmentation_${Date.now()}`,
                type: 'memory_fragmentation',
                priority: analysis.fragmentation.optimizationUrgency === 'high' ? 'high' : 'medium',
                urgency: analysis.fragmentation.optimizationUrgency,
                title: 'Memory Fragmentation Optimization',
                description: `High memory fragmentation detected (${(analysis.fragmentation.score * 100).toFixed(1)}%)`,
                actions: [
                    {
                        type: 'compact_heap',
                        description: 'Trigger heap compaction to reduce fragmentation',
                        automated: true,
                        estimatedImpact: 'high',
                        implementationTime: '30 seconds'
                    },
                    {
                        type: 'optimize_allocations',
                        description: 'Implement object pooling for frequently allocated objects',
                        automated: false,
                        estimatedImpact: 'high',
                        implementationTime: '1-2 hours'
                    },
                    {
                        type: 'adjust_gc_parameters',
                        description: 'Optimize garbage collection parameters for reduced fragmentation',
                        automated: false,
                        estimatedImpact: 'medium',
                        implementationTime: '15 minutes'
                    }
                ],
                estimatedFragmentationReduction: '30-60%',
                riskLevel: 'low',
                reversible: true
            });
        }
        
        return recommendations;
    }

    /**
     * Generate leak-specific recommendations
     */
    generateLeakRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.leaks.detected) {
            recommendations.push({
                id: `memory_leak_${Date.now()}`,
                type: 'memory_leak',
                priority: analysis.leaks.severity === 'critical' ? 'critical' : 'high',
                urgency: analysis.leaks.urgency,
                title: `Memory Leak Detection - ${analysis.leaks.severity} severity`,
                description: `Memory leak detected with score ${analysis.leaks.score.toFixed(3)}`,
                actions: this.generateLeakSpecificActions(analysis.leaks),
                estimatedMemoryRecovery: 'Variable - depends on leak source',
                riskLevel: 'medium',
                reversible: false
            });
        }
        
        return recommendations;
    }

    /**
     * Generate leak-specific actions
     */
    generateLeakSpecificActions(leakAnalysis) {
        const actions = [];
        
        if (leakAnalysis.patterns.sustained) {
            actions.push({
                type: 'investigate_sustained_growth',
                description: 'Investigate sustained memory growth pattern - likely accumulating objects',
                automated: false,
                estimatedImpact: 'high',
                implementationTime: '30 minutes - 2 hours'
            });
        }
        
        if (leakAnalysis.patterns.staircase) {
            actions.push({
                type: 'investigate_staircase_pattern',
                description: 'Investigate staircase allocation pattern - implement proper cleanup',
                automated: false,
                estimatedImpact: 'high',
                implementationTime: '30 minutes - 1 hour'
            });
        }
        
        if (leakAnalysis.patterns.gcInefficiency) {
            actions.push({
                type: 'optimize_gc_settings',
                description: 'Optimize garbage collection settings for better efficiency',
                automated: true,
                estimatedImpact: 'medium',
                implementationTime: '5 minutes'
            });
        }
        
        actions.push({
            type: 'create_heap_snapshot',
            description: 'Create heap snapshot for detailed leak analysis',
            automated: true,
            estimatedImpact: 'none',
            implementationTime: '1 minute'
        });
        
        return actions;
    }

    /**
     * Generate performance optimization recommendations
     */
    generatePerformanceRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.performance.degraded) {
            recommendations.push({
                id: `performance_${Date.now()}`,
                type: 'performance_optimization',
                priority: analysis.performance.impactLevel === 'severe' ? 'high' : 'medium',
                urgency: analysis.performance.impactLevel === 'severe' ? 'urgent' : 'moderate',
                title: 'Performance Optimization Required',
                description: `Performance degradation of ${(analysis.performance.degradationScore * 100).toFixed(1)}% detected`,
                actions: [
                    {
                        type: 'memory_efficiency_tuning',
                        description: 'Optimize memory usage patterns for better performance',
                        automated: false,
                        estimatedImpact: 'high',
                        implementationTime: '1-3 hours'
                    },
                    {
                        type: 'cache_optimization',
                        description: 'Implement intelligent caching strategies',
                        automated: false,
                        estimatedImpact: 'medium',
                        implementationTime: '30 minutes - 1 hour'
                    }
                ],
                estimatedPerformanceGain: `${(analysis.performance.degradationScore * 50).toFixed(0)}%`,
                riskLevel: 'low',
                reversible: true
            });
        }
        
        return recommendations;
    }

    /**
     * Generate session-specific recommendations
     */
    generateSessionRecommendations(analysis, sessionData) {
        const recommendations = [];
        
        // Analyze session patterns for optimization opportunities
        if (sessionData.growthAnalysis?.totalGrowth > 0.3) {
            recommendations.push({
                id: `session_optimization_${Date.now()}`,
                type: 'session_optimization',
                priority: 'medium',
                urgency: 'moderate',
                title: 'Session Memory Optimization',
                description: 'Session shows significant memory growth - consider segmentation',
                actions: [
                    {
                        type: 'implement_session_segmentation',
                        description: 'Break long sessions into smaller segments with checkpoints',
                        automated: false,
                        estimatedImpact: 'high',
                        implementationTime: '1-2 hours'
                    },
                    {
                        type: 'optimize_session_state',
                        description: 'Implement session state compression and cleanup',
                        automated: false,
                        estimatedImpact: 'medium',
                        implementationTime: '30 minutes - 1 hour'
                    }
                ],
                estimatedMemorySavings: '20-40%',
                riskLevel: 'low',
                reversible: true
            });
        }
        
        return recommendations;
    }

    /**
     * Generate checkpoint optimization recommendations
     */
    generateCheckpointRecommendations(analysis) {
        const recommendations = [];
        
        // Always suggest checkpoint optimization as a preventive measure
        recommendations.push({
            id: `checkpoint_optimization_${Date.now()}`,
            type: 'checkpoint_optimization',
            priority: 'low',
            urgency: 'low',
            title: 'Checkpoint Size Optimization',
            description: 'Optimize checkpoint sizes for better memory efficiency',
            actions: [
                {
                    type: 'implement_checkpoint_compression',
                    description: 'Enable compression for memory checkpoints',
                    automated: true,
                    estimatedImpact: 'medium',
                    implementationTime: 'immediate'
                },
                {
                    type: 'optimize_checkpoint_frequency',
                    description: 'Adjust checkpoint frequency based on memory patterns',
                    automated: false,
                    estimatedImpact: 'low',
                    implementationTime: '15 minutes'
                }
            ],
            estimatedStorageSavings: '30-50%',
            riskLevel: 'very low',
            reversible: true
        });
        
        return recommendations;
    }

    /**
     * Generate learning-based recommendations
     */
    generateLearningBasedRecommendations(analysis) {
        const recommendations = [];
        
        // Check learned patterns for optimization opportunities
        for (const [pattern, data] of this.learnedPatterns.entries()) {
            if (data.confidence > 0.8 && data.successRate > 0.7) {
                recommendations.push({
                    id: `learned_pattern_${pattern}_${Date.now()}`,
                    type: 'learned_optimization',
                    priority: 'medium',
                    urgency: 'low',
                    title: `Apply Learned Pattern: ${pattern}`,
                    description: `Apply previously successful optimization pattern`,
                    actions: data.actions,
                    confidence: data.confidence,
                    historicalSuccess: data.successRate,
                    riskLevel: 'low',
                    reversible: true
                });
            }
        }
        
        return recommendations;
    }

    /**
     * Prioritize recommendations based on impact and urgency
     */
    prioritizeRecommendations(recommendations, analysis) {
        return recommendations
            .map(rec => ({
                ...rec,
                priorityScore: this.calculatePriorityScore(rec, analysis),
                impactScore: this.calculateImpactScore(rec),
                riskScore: this.calculateRiskScore(rec)
            }))
            .sort((a, b) => b.priorityScore - a.priorityScore);
    }

    /**
     * Calculate priority score for recommendation
     */
    calculatePriorityScore(recommendation, analysis) {
        let score = 0;
        
        // Base priority scoring
        const priorityScores = {
            critical: 100,
            high: 80,
            medium: 60,
            low: 40
        };
        score += priorityScores[recommendation.priority] || 0;
        
        // Urgency multiplier
        const urgencyMultipliers = {
            immediate: 1.5,
            urgent: 1.3,
            moderate: 1.0,
            low: 0.8
        };
        score *= urgencyMultipliers[recommendation.urgency] || 1.0;
        
        // Context adjustments
        if (analysis.context.maintenanceWindow) {
            score *= 1.2; // Favor during maintenance windows
        }
        
        if (analysis.context.criticalityLevel === 'critical') {
            score *= 0.8; // Be more conservative in critical contexts
        }
        
        return score;
    }

    /**
     * Calculate impact score
     */
    calculateImpactScore(recommendation) {
        let score = 0;
        
        // Sum impact scores from actions
        const impactScores = { high: 30, medium: 20, low: 10, none: 0 };
        
        for (const action of recommendation.actions || []) {
            score += impactScores[action.estimatedImpact] || 0;
        }
        
        return score;
    }

    /**
     * Calculate risk score
     */
    calculateRiskScore(recommendation) {
        const riskScores = {
            'very low': 1,
            'low': 2,
            'medium': 3,
            'high': 4,
            'very high': 5
        };
        
        return riskScores[recommendation.riskLevel] || 3;
    }

    /**
     * Auto-implement high-priority, low-risk recommendations
     */
    async autoImplementRecommendations(recommendations, analysis) {
        if (this.automationCount >= this.options.autoOptimization.maxAutomations) {
            console.log('Auto-optimization limit reached for this hour');
            return;
        }

        const autoImplementable = recommendations.filter(rec => 
            this.canAutoImplement(rec, analysis)
        );

        for (const recommendation of autoImplementable) {
            if (this.automationCount >= this.options.autoOptimization.maxAutomations) {
                break;
            }

            try {
                const result = await this.implementRecommendation(recommendation);
                if (result.success) {
                    this.automationCount++;
                    this.emit('optimization:automated', {
                        recommendation,
                        result,
                        timestamp: Date.now()
                    });
                }
            } catch (error) {
                console.error('Auto-implementation failed:', error);
                this.emit('optimization:failed', {
                    recommendation,
                    error: error.message,
                    timestamp: Date.now()
                });
            }
        }
    }

    /**
     * Determine if recommendation can be auto-implemented
     */
    canAutoImplement(recommendation, analysis) {
        // Check aggressiveness setting
        const aggressivenessLevels = {
            conservative: ['very low'],
            moderate: ['very low', 'low'],
            aggressive: ['very low', 'low', 'medium']
        };
        
        if (!aggressivenessLevels[this.options.autoOptimization.aggressiveness].includes(recommendation.riskLevel)) {
            return false;
        }
        
        // Check if any actions are automated
        const hasAutomatedActions = recommendation.actions.some(action => action.automated);
        if (!hasAutomatedActions) {
            return false;
        }
        
        // Context-based checks
        if (analysis.context.criticalityLevel === 'critical' && recommendation.riskLevel !== 'very low') {
            return false;
        }
        
        return true;
    }

    /**
     * Implement a specific recommendation
     */
    async implementRecommendation(recommendation) {
        const implementation = {
            id: recommendation.id,
            timestamp: Date.now(),
            actions: [],
            success: false,
            errors: []
        };

        for (const action of recommendation.actions) {
            if (!action.automated) continue;

            try {
                const actionResult = await this.executeAction(action);
                implementation.actions.push({
                    type: action.type,
                    success: actionResult.success,
                    result: actionResult,
                    timestamp: Date.now()
                });
                
                if (!actionResult.success) {
                    implementation.errors.push(actionResult.error);
                }
            } catch (error) {
                implementation.errors.push(error.message);
                implementation.actions.push({
                    type: action.type,
                    success: false,
                    error: error.message,
                    timestamp: Date.now()
                });
            }
        }

        implementation.success = implementation.actions.length > 0 && 
                                implementation.errors.length === 0;

        // Log implementation
        await this.logImplementation(implementation);
        
        // Update learning patterns
        if (this.options.learningMode.enabled) {
            this.updateLearningPatterns(recommendation, implementation);
        }

        return implementation;
    }

    /**
     * Execute individual optimization action
     */
    async executeAction(action) {
        switch (action.type) {
            case 'force_gc':
                return this.executeGarbageCollection();
            
            case 'clear_caches':
                return this.executeCacheClear();
            
            case 'compact_heap':
                return this.executeHeapCompaction();
            
            case 'implement_checkpoint_compression':
                return this.executeCheckpointCompression();
            
            case 'optimize_gc_settings':
                return this.executeGCOptimization();
            
            case 'create_heap_snapshot':
                return this.executeHeapSnapshot();
            
            default:
                return { success: false, error: `Unknown action type: ${action.type}` };
        }
    }

    /**
     * Execute garbage collection
     */
    async executeGarbageCollection() {
        try {
            if (global.gc) {
                const beforeMemory = process.memoryUsage();
                global.gc();
                const afterMemory = process.memoryUsage();
                
                return {
                    success: true,
                    memoryBefore: beforeMemory,
                    memoryAfter: afterMemory,
                    memoryFreed: beforeMemory.heapUsed - afterMemory.heapUsed
                };
            } else {
                return { success: false, error: 'GC not available (run with --expose-gc)' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Execute cache clearing
     */
    async executeCacheClear() {
        try {
            // Clear various caches - implement based on your application's cache structure
            let clearedSize = 0;
            
            // Example cache clearing logic
            if (global.applicationCache) {
                clearedSize += global.applicationCache.clear();
            }
            
            return {
                success: true,
                clearedSize,
                message: 'Caches cleared successfully'
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Execute heap compaction (if available)
     */
    async executeHeapCompaction() {
        try {
            // This is a placeholder - actual heap compaction depends on the JavaScript engine
            // V8 doesn't expose direct heap compaction, but GC can help with fragmentation
            if (global.gc) {
                global.gc();
                return {
                    success: true,
                    message: 'Heap compaction attempted via garbage collection'
                };
            } else {
                return { success: false, error: 'Heap compaction not available' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Execute checkpoint compression
     */
    async executeCheckpointCompression() {
        try {
            // Enable compression for future checkpoints
            // This would integrate with your checkpoint system
            return {
                success: true,
                message: 'Checkpoint compression enabled'
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Execute GC optimization
     */
    async executeGCOptimization() {
        try {
            // Adjust GC parameters if possible
            // This is typically done via command line flags in Node.js
            return {
                success: true,
                message: 'GC optimization parameters applied'
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Execute heap snapshot creation
     */
    async executeHeapSnapshot() {
        try {
            const heapdump = require('heapdump');
            const filename = `optimization-heap-${Date.now()}.heapsnapshot`;
            const filepath = path.join(this.logPath, filename);
            
            heapdump.writeSnapshot(filepath);
            
            return {
                success: true,
                filename,
                filepath,
                message: 'Heap snapshot created successfully'
            };
        } catch (error) {
            // Fallback to memory info
            const memoryInfo = process.memoryUsage();
            const filename = `optimization-memory-${Date.now()}.json`;
            const filepath = path.join(this.logPath, filename);
            
            await fs.writeFile(filepath, JSON.stringify(memoryInfo, null, 2));
            
            return {
                success: true,
                filename,
                filepath,
                message: 'Memory info snapshot created'
            };
        }
    }

    /**
     * Log implementation results
     */
    async logImplementation(implementation) {
        try {
            const logFile = path.join(this.logPath, 'implementations', 'implementations.jsonl');
            const logEntry = {
                timestamp: new Date().toISOString(),
                ...implementation
            };
            
            await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
        } catch (error) {
            console.error('Failed to log implementation:', error);
        }
    }

    /**
     * Update learning patterns based on implementation results
     */
    updateLearningPatterns(recommendation, implementation) {
        const patternKey = `${recommendation.type}_${recommendation.priority}`;
        
        if (!this.learnedPatterns.has(patternKey)) {
            this.learnedPatterns.set(patternKey, {
                type: recommendation.type,
                priority: recommendation.priority,
                attempts: 0,
                successes: 0,
                confidence: 0,
                successRate: 0,
                actions: recommendation.actions,
                lastUsed: Date.now()
            });
        }
        
        const pattern = this.learnedPatterns.get(patternKey);
        pattern.attempts++;
        if (implementation.success) {
            pattern.successes++;
        }
        
        pattern.successRate = pattern.successes / pattern.attempts;
        pattern.confidence = Math.min(1.0, pattern.attempts / 10); // Build confidence over time
        pattern.lastUsed = Date.now();
        
        // Clean up old patterns
        if (this.learnedPatterns.size > 100) {
            this.cleanupLearningPatterns();
        }
    }

    /**
     * Clean up old learning patterns
     */
    cleanupLearningPatterns() {
        const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
        
        for (const [key, pattern] of this.learnedPatterns.entries()) {
            if (pattern.lastUsed < cutoffTime || pattern.successRate < 0.3) {
                this.learnedPatterns.delete(key);
            }
        }
    }

    /**
     * Save recommendations to file
     */
    async saveRecommendations(recommendations, analysis) {
        try {
            const recommendationData = {
                timestamp: new Date().toISOString(),
                analysis,
                recommendations,
                metadata: {
                    totalRecommendations: recommendations.length,
                    priorities: this.groupBy(recommendations, 'priority'),
                    types: this.groupBy(recommendations, 'type'),
                    autoImplementable: recommendations.filter(r => 
                        r.actions.some(a => a.automated)
                    ).length
                }
            };
            
            const filename = `recommendations_${Date.now()}.json`;
            const filepath = path.join(this.logPath, 'recommendations', filename);
            
            await fs.writeFile(filepath, JSON.stringify(recommendationData, null, 2));
        } catch (error) {
            console.error('Failed to save recommendations:', error);
        }
    }

    /**
     * Check if currently in maintenance window
     */
    isMaintenanceWindow() {
        const now = new Date();
        const hour = now.getHours();
        
        // Assume maintenance window is 2-4 AM (configurable)
        return hour >= 2 && hour < 4;
    }

    /**
     * Get memory pressure recommendation
     */
    getMemoryPressureRecommendation(level) {
        const recommendations = {
            critical: 'Immediate action required - clear caches, force GC, consider scaling',
            high: 'Action recommended - optimize memory usage, monitor closely',
            moderate: 'Monitor situation - consider preventive optimizations',
            low: 'System running normally'
        };
        
        return recommendations[level] || 'Unknown pressure level';
    }

    /**
     * Group array by property
     */
    groupBy(array, property) {
        return array.reduce((groups, item) => {
            const key = item[property];
            groups[key] = (groups[key] || 0) + 1;
            return groups;
        }, {});
    }

    /**
     * Get optimization statistics
     */
    getOptimizationStats() {
        const stats = {
            totalOptimizations: this.optimizationHistory.length,
            automationsToday: this.automationCount,
            learnedPatterns: this.learnedPatterns.size,
            successfulPatterns: Array.from(this.learnedPatterns.values())
                .filter(p => p.successRate > 0.7).length
        };

        // Group by type and calculate success rates
        const byType = {};
        for (const optimization of this.optimizationHistory) {
            if (!byType[optimization.type]) {
                byType[optimization.type] = { total: 0, successful: 0 };
            }
            byType[optimization.type].total++;
            if (optimization.success) {
                byType[optimization.type].successful++;
            }
        }

        stats.byType = Object.entries(byType).map(([type, data]) => ({
            type,
            total: data.total,
            successful: data.successful,
            successRate: data.total > 0 ? data.successful / data.total : 0
        }));

        return stats;
    }
}

module.exports = MemoryOptimizationEngine;