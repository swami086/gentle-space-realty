/**
 * Production Configuration for Memory Performance Monitoring
 */

module.exports = {
    // Memory Monitor Configuration
    monitor: {
        sampleInterval: 5000,           // 5 seconds in production
        historySize: 2000,              // Keep more history for analysis
        memoryThresholds: {
            warning: 0.80,              // 80% system memory
            critical: 0.90,             // 90% system memory
            emergency: 0.95             // 95% system memory
        },
        leakDetection: {
            enabled: true,
            growthThreshold: 0.05,      // More sensitive in production (5%)
            windowSize: 20              // Larger analysis window
        },
        fragmentation: {
            enabled: true,
            threshold: 0.25             // More sensitive fragmentation detection
        },
        checkpoints: {
            enabled: true,
            maxSize: 100 * 1024 * 1024, // 100MB max checkpoint size
            compression: true            // Enable compression
        }
    },

    // Alert System Configuration
    alerts: {
        alertThresholds: {
            memory: {
                warning: 0.80,
                critical: 0.90,
                emergency: 0.95
            },
            heap: {
                warning: 0.85,
                critical: 0.92,
                emergency: 0.97
            },
            fragmentation: {
                warning: 0.25,
                critical: 0.40,
                emergency: 0.60
            },
            leakScore: {
                warning: 0.4,
                critical: 0.6,
                emergency: 0.8
            }
        },
        cooldownPeriods: {
            warning: 120000,            // 2 minutes
            critical: 60000,            // 1 minute
            emergency: 30000            // 30 seconds
        },
        actionTriggers: {
            autoGC: true,               // Enable auto GC
            alertNotifications: true,
            emergencyShutdown: false,   // Don't auto-shutdown in production
            memoryDump: true            // Create dumps for analysis
        },
        notifications: {
            console: true,
            file: true,
            webhook: process.env.MEMORY_ALERT_WEBHOOK || null,
            email: process.env.MEMORY_ALERT_EMAIL ? {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                },
                to: process.env.MEMORY_ALERT_EMAIL
            } : null
        }
    },

    // Session Analyzer Configuration
    sessions: {
        sessionTimeout: 7200000,        // 2 hours
        analysisWindow: 600000,         // 10 minutes
        correlationThreshold: 0.8,      // Higher threshold for production
        growthThresholds: {
            normal: 0.05,               // 5% normal growth
            concerning: 0.15,           // 15% concerning growth
            critical: 0.30              // 30% critical growth
        },
        fragmentationAnalysis: {
            enabled: true,
            threshold: 0.20             // 20% fragmentation threshold
        },
        checkpointAnalysis: {
            enabled: true,
            sizeThreshold: 50 * 1024 * 1024 // 50MB checkpoint threshold
        }
    },

    // Optimization Engine Configuration
    optimization: {
        autoOptimization: {
            enabled: true,
            aggressiveness: 'conservative',  // Conservative in production
            maxAutomations: 3               // Limit automations per hour
        },
        thresholds: {
            memoryPressure: 0.85,
            fragmentationCritical: 0.35,
            leakSeverity: 0.6,
            performanceDegradation: 0.25
        },
        optimizationStrategies: {
            garbageCollection: true,
            cacheOptimization: true,
            memoryPooling: false,           // Disable complex strategies
            checkpointOptimization: true,
            sessionSegmentation: true
        },
        learningMode: {
            enabled: true,
            patternRecognition: true,
            adaptiveThresholds: false       // Don't adapt thresholds in production
        }
    },

    // Dashboard Configuration
    dashboard: {
        updateInterval: 10000,              // 10 seconds
        retentionDays: 30,                  // Keep 30 days of data
        enableWebDashboard: true,
        dashboardPort: process.env.MEMORY_DASHBOARD_PORT || 3001,
        autoStart: true
    },

    // Integration Settings
    integration: {
        claudeFlowSync: true,
        monitoringSync: true,
        memoryBankSync: true,
        syncInterval: 60000                 // 1 minute sync interval
    },

    // Security Settings
    security: {
        enableAuth: process.env.MEMORY_DASHBOARD_AUTH === 'true',
        authToken: process.env.MEMORY_DASHBOARD_TOKEN,
        allowedIPs: process.env.MEMORY_ALLOWED_IPS ? 
            process.env.MEMORY_ALLOWED_IPS.split(',') : null,
        rateLimiting: {
            enabled: true,
            maxRequests: 100,
            windowMs: 60000                 // 1 minute window
        }
    },

    // Logging Configuration
    logging: {
        level: 'info',                      // info, warn, error
        rotateFiles: true,
        maxFileSize: 10 * 1024 * 1024,     // 10MB
        maxFiles: 10,
        compress: true
    }
};