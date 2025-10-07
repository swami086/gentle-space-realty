const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');

/**
 * Memory Checkpoint System for Hive Mind
 * Provides automatic context preservation, session state management,
 * cross-session memory persistence, and recovery mechanisms.
 */
class MemoryCheckpointSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      checkpointDir: options.checkpointDir || './memory/checkpoints',
      memoryDir: options.memoryDir || './memory',
      compressionEnabled: options.compressionEnabled !== false,
      compressionThreshold: options.compressionThreshold || 1024, // bytes
      maxCheckpoints: options.maxCheckpoints || 100,
      retentionDays: options.retentionDays || 7,
      validationEnabled: options.validationEnabled !== false,
      encryptionKey: options.encryptionKey || this.generateEncryptionKey(),
      ...options
    };

    this.currentSession = null;
    this.activeCheckpoints = new Map();
    this.compressionCache = new Map();
    this.validationRules = new Map();
    this.recoveryState = {
      lastValidCheckpoint: null,
      failedOperations: [],
      recoveryMode: false
    };

    this.initialize();
  }

  /**
   * Initialize the checkpoint system
   */
  async initialize() {
    try {
      await this.ensureDirectories();
      await this.loadExistingCheckpoints();
      await this.startSession();
      this.setupValidationRules();
      this.emit('initialized', { timestamp: Date.now() });
    } catch (error) {
      this.emit('error', { type: 'initialization', error });
      throw error;
    }
  }

  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    const dirs = [
      this.options.checkpointDir,
      path.join(this.options.checkpointDir, 'sessions'),
      path.join(this.options.checkpointDir, 'snapshots'),
      path.join(this.options.checkpointDir, 'compressed'),
      path.join(this.options.checkpointDir, 'archived'),
      path.join(this.options.memoryDir, 'recovery')
    ];

    for (const dir of dirs) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  /**
   * Load existing checkpoints into memory
   */
  async loadExistingCheckpoints() {
    try {
      const checkpointFiles = await fs.readdir(this.options.checkpointDir);
      const jsonFiles = checkpointFiles.filter(file => file.endsWith('.json'));
      
      for (const file of jsonFiles.slice(-20)) { // Load last 20 checkpoints
        try {
          const filePath = path.join(this.options.checkpointDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const checkpoint = JSON.parse(content);
          
          if (this.validateCheckpoint(checkpoint)) {
            this.activeCheckpoints.set(checkpoint.id, {
              ...checkpoint,
              filePath,
              loaded: true
            });
          }
        } catch (error) {
          console.warn(`Failed to load checkpoint ${file}:`, error.message);
        }
      }
    } catch (error) {
      console.warn('Failed to load existing checkpoints:', error.message);
    }
  }

  /**
   * Start a new session with automatic checkpoint creation
   */
  async startSession(sessionData = {}) {
    const sessionId = this.generateSessionId();
    const timestamp = Date.now();
    
    this.currentSession = {
      id: sessionId,
      startTime: timestamp,
      lastActivity: timestamp,
      checkpointCount: 0,
      memoryState: {},
      decisionPoints: [],
      ...sessionData
    };

    // Create initial session checkpoint
    await this.createSessionCheckpoint({
      type: 'session_start',
      sessionId,
      timestamp,
      memorySnapshot: await this.captureMemorySnapshot(),
      metadata: sessionData
    });

    this.emit('session_started', { session: this.currentSession });
    return sessionId;
  }

  /**
   * Create checkpoint at key decision points
   */
  async createDecisionCheckpoint(decisionData) {
    if (!this.currentSession) {
      throw new Error('No active session for decision checkpoint');
    }

    const checkpointId = this.generateCheckpointId('decision');
    const timestamp = Date.now();

    const checkpoint = {
      id: checkpointId,
      type: 'decision_point',
      sessionId: this.currentSession.id,
      timestamp,
      decision: {
        context: decisionData.context || {},
        options: decisionData.options || [],
        selected: decisionData.selected,
        reasoning: decisionData.reasoning,
        impact: decisionData.impact || 'medium',
        reversible: decisionData.reversible !== false
      },
      memoryState: await this.captureMemorySnapshot(),
      systemState: await this.captureSystemState()
    };

    return await this.saveCheckpoint(checkpoint);
  }

  /**
   * Create automatic checkpoint before major operations
   */
  async createOperationCheckpoint(operationData) {
    const checkpointId = this.generateCheckpointId('operation');
    const timestamp = Date.now();

    const checkpoint = {
      id: checkpointId,
      type: 'pre_operation',
      sessionId: this.currentSession?.id,
      timestamp,
      operation: {
        name: operationData.name,
        type: operationData.type,
        scope: operationData.scope || 'local',
        riskLevel: operationData.riskLevel || 'medium',
        expectedDuration: operationData.expectedDuration,
        dependencies: operationData.dependencies || []
      },
      memoryState: await this.captureMemorySnapshot(),
      systemState: await this.captureSystemState()
    };

    await this.saveCheckpoint(checkpoint);
    this.emit('operation_checkpoint_created', { checkpoint });
    return checkpointId;
  }

  /**
   * Create session boundary checkpoint
   */
  async createSessionCheckpoint(sessionData) {
    const checkpointId = this.generateCheckpointId('session');
    const timestamp = Date.now();

    const checkpoint = {
      id: checkpointId,
      type: sessionData.type || 'session_boundary',
      sessionId: sessionData.sessionId || this.currentSession?.id,
      timestamp,
      session: {
        duration: this.currentSession ? timestamp - this.currentSession.startTime : 0,
        checkpointCount: this.currentSession?.checkpointCount || 0,
        decisionPoints: this.currentSession?.decisionPoints || [],
        memoryUsage: await this.getMemoryUsage()
      },
      memoryState: await this.captureMemorySnapshot(),
      systemState: await this.captureSystemState()
    };

    await this.saveCheckpoint(checkpoint);
    
    if (sessionData.type === 'session_end') {
      await this.archiveSession();
    }

    return checkpointId;
  }

  /**
   * Capture complete memory snapshot
   */
  async captureMemorySnapshot() {
    const snapshot = {
      timestamp: Date.now(),
      agentMemory: {},
      sharedMemory: {},
      globalMemory: {},
      coordinationState: {},
      memoryMetrics: await this.getMemoryMetrics()
    };

    try {
      // Capture agent-specific memory
      const agentDirs = await fs.readdir(path.join(this.options.memoryDir, 'agents'));
      for (const agentDir of agentDirs) {
        if (agentDir !== 'README.md') {
          try {
            const memoryPath = path.join(this.options.memoryDir, 'agents', agentDir, 'memory_bank.json');
            const content = await fs.readFile(memoryPath, 'utf8');
            snapshot.agentMemory[agentDir] = JSON.parse(content);
          } catch (error) {
            // Agent memory might not exist yet
          }
        }
      }

      // Capture shared memory
      try {
        const sharedFiles = await fs.readdir(path.join(this.options.memoryDir, 'shared'));
        for (const file of sharedFiles) {
          if (file.endsWith('.json')) {
            const content = await fs.readFile(path.join(this.options.memoryDir, 'shared', file), 'utf8');
            snapshot.sharedMemory[file.replace('.json', '')] = JSON.parse(content);
          }
        }
      } catch (error) {
        // Shared memory might not exist
      }

      // Capture global memory
      try {
        const globalFiles = await fs.readdir(path.join(this.options.memoryDir, 'global'));
        for (const file of globalFiles) {
          if (file.endsWith('.json')) {
            const content = await fs.readFile(path.join(this.options.memoryDir, 'global', file), 'utf8');
            snapshot.globalMemory[file.replace('.json', '')] = JSON.parse(content);
          }
        }
      } catch (error) {
        // Global memory might not exist
      }

      // Capture coordination state
      try {
        const coordPath = path.join('./coordination/memory_bank');
        const coordFiles = await fs.readdir(coordPath);
        for (const file of coordFiles) {
          if (file.endsWith('.json')) {
            const content = await fs.readFile(path.join(coordPath, file), 'utf8');
            snapshot.coordinationState[file.replace('.json', '')] = JSON.parse(content);
          }
        }
      } catch (error) {
        // Coordination state might not exist
      }

    } catch (error) {
      console.warn('Error capturing memory snapshot:', error.message);
    }

    return snapshot;
  }

  /**
   * Capture system state information
   */
  async captureSystemState() {
    return {
      timestamp: Date.now(),
      processInfo: {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      checkpointSystem: {
        activeCheckpoints: this.activeCheckpoints.size,
        compressionCacheSize: this.compressionCache.size,
        currentSession: this.currentSession?.id || null
      }
    };
  }

  /**
   * Save checkpoint with compression and validation
   */
  async saveCheckpoint(checkpoint) {
    try {
      // Validate checkpoint
      if (this.options.validationEnabled && !this.validateCheckpoint(checkpoint)) {
        throw new Error('Checkpoint validation failed');
      }

      const filePath = path.join(
        this.options.checkpointDir,
        `${checkpoint.type}_${checkpoint.id}.json`
      );

      let data = JSON.stringify(checkpoint, null, 2);
      
      // Apply compression if enabled and data exceeds threshold
      if (this.options.compressionEnabled && data.length > this.options.compressionThreshold) {
        data = await this.compressData(data);
        checkpoint._compressed = true;
        
        const compressedPath = path.join(
          this.options.checkpointDir,
          'compressed',
          `${checkpoint.type}_${checkpoint.id}.json.gz`
        );
        
        await fs.writeFile(compressedPath, data);
        checkpoint._filePath = compressedPath;
      } else {
        await fs.writeFile(filePath, data);
        checkpoint._filePath = filePath;
      }

      // Store in active checkpoints
      this.activeCheckpoints.set(checkpoint.id, checkpoint);

      // Update session checkpoint count
      if (this.currentSession) {
        this.currentSession.checkpointCount++;
        this.currentSession.lastActivity = Date.now();
      }

      // Cleanup old checkpoints if needed
      await this.cleanupOldCheckpoints();

      this.emit('checkpoint_created', { checkpoint });
      return checkpoint.id;

    } catch (error) {
      this.emit('error', { type: 'checkpoint_save', error, checkpoint: checkpoint.id });
      throw error;
    }
  }

  /**
   * Restore system state from checkpoint
   */
  async restoreFromCheckpoint(checkpointId) {
    try {
      const checkpoint = await this.loadCheckpoint(checkpointId);
      if (!checkpoint) {
        throw new Error(`Checkpoint ${checkpointId} not found`);
      }

      this.recoveryState.recoveryMode = true;
      this.recoveryState.lastValidCheckpoint = checkpointId;

      // Restore memory state
      await this.restoreMemoryState(checkpoint.memoryState);

      // Restore session if applicable
      if (checkpoint.sessionId && checkpoint.type === 'session_start') {
        this.currentSession = {
          id: checkpoint.sessionId,
          startTime: checkpoint.timestamp,
          lastActivity: Date.now(),
          checkpointCount: 0,
          memoryState: checkpoint.memoryState,
          decisionPoints: [],
          restored: true
        };
      }

      this.recoveryState.recoveryMode = false;
      this.emit('checkpoint_restored', { checkpointId, checkpoint });
      return true;

    } catch (error) {
      this.recoveryState.failedOperations.push({
        operation: 'restore',
        checkpointId,
        error: error.message,
        timestamp: Date.now()
      });
      this.emit('error', { type: 'checkpoint_restore', error, checkpointId });
      throw error;
    }
  }

  /**
   * Restore memory state from snapshot
   */
  async restoreMemoryState(memoryState) {
    try {
      // Restore agent memory
      for (const [agentId, memory] of Object.entries(memoryState.agentMemory || {})) {
        const agentDir = path.join(this.options.memoryDir, 'agents', agentId);
        await fs.mkdir(agentDir, { recursive: true });
        await fs.writeFile(
          path.join(agentDir, 'memory_bank.json'),
          JSON.stringify(memory, null, 2)
        );
      }

      // Restore shared memory
      for (const [key, memory] of Object.entries(memoryState.sharedMemory || {})) {
        await fs.writeFile(
          path.join(this.options.memoryDir, 'shared', `${key}.json`),
          JSON.stringify(memory, null, 2)
        );
      }

      // Restore global memory
      for (const [key, memory] of Object.entries(memoryState.globalMemory || {})) {
        await fs.writeFile(
          path.join(this.options.memoryDir, 'global', `${key}.json`),
          JSON.stringify(memory, null, 2)
        );
      }

      // Restore coordination state
      for (const [key, state] of Object.entries(memoryState.coordinationState || {})) {
        await fs.writeFile(
          path.join('./coordination/memory_bank', `${key}.json`),
          JSON.stringify(state, null, 2)
        );
      }

      this.emit('memory_state_restored', { memoryState });

    } catch (error) {
      this.emit('error', { type: 'memory_restore', error });
      throw error;
    }
  }

  /**
   * Create rollback point for session state
   */
  async createRollbackPoint(description) {
    const rollbackId = this.generateCheckpointId('rollback');
    const checkpoint = await this.createOperationCheckpoint({
      name: 'rollback_point',
      type: 'rollback',
      scope: 'session',
      riskLevel: 'low',
      description
    });

    return rollbackId;
  }

  /**
   * Rollback to specific point
   */
  async rollbackToPoint(checkpointId) {
    try {
      // Create pre-rollback checkpoint
      await this.createOperationCheckpoint({
        name: 'pre_rollback',
        type: 'safety',
        scope: 'session',
        riskLevel: 'high',
        rollbackTarget: checkpointId
      });

      // Perform rollback
      await this.restoreFromCheckpoint(checkpointId);
      
      this.emit('rollback_completed', { checkpointId });
      return true;

    } catch (error) {
      this.emit('error', { type: 'rollback', error, checkpointId });
      throw error;
    }
  }

  /**
   * Implement cross-session memory persistence
   */
  async persistSessionMemory(sessionId) {
    const sessionDir = path.join(this.options.memoryDir, 'sessions', sessionId);
    await fs.mkdir(sessionDir, { recursive: true });

    const sessionData = {
      sessionId,
      persistedAt: Date.now(),
      memoryState: await this.captureMemorySnapshot(),
      checkpoints: Array.from(this.activeCheckpoints.values())
        .filter(cp => cp.sessionId === sessionId),
      sessionInfo: this.currentSession
    };

    await fs.writeFile(
      path.join(sessionDir, 'session_memory.json'),
      JSON.stringify(sessionData, null, 2)
    );

    this.emit('session_memory_persisted', { sessionId, sessionData });
    return sessionDir;
  }

  /**
   * Load persisted session memory
   */
  async loadPersistedSession(sessionId) {
    try {
      const sessionDir = path.join(this.options.memoryDir, 'sessions', sessionId);
      const sessionData = JSON.parse(
        await fs.readFile(path.join(sessionDir, 'session_memory.json'), 'utf8')
      );

      // Restore memory state
      await this.restoreMemoryState(sessionData.memoryState);

      // Restore checkpoints
      for (const checkpoint of sessionData.checkpoints) {
        this.activeCheckpoints.set(checkpoint.id, checkpoint);
      }

      // Restore session info
      this.currentSession = {
        ...sessionData.sessionInfo,
        restored: true,
        restoredAt: Date.now()
      };

      this.emit('session_memory_loaded', { sessionId, sessionData });
      return sessionData;

    } catch (error) {
      this.emit('error', { type: 'session_load', error, sessionId });
      throw error;
    }
  }

  /**
   * Archive completed session
   */
  async archiveSession() {
    if (!this.currentSession) return;

    const sessionId = this.currentSession.id;
    const archivePath = path.join(
      this.options.checkpointDir,
      'archived',
      `session_${sessionId}_${Date.now()}.json`
    );

    const archiveData = {
      session: this.currentSession,
      checkpoints: Array.from(this.activeCheckpoints.values())
        .filter(cp => cp.sessionId === sessionId),
      archivedAt: Date.now(),
      memoryState: await this.captureMemorySnapshot()
    };

    await fs.writeFile(archivePath, JSON.stringify(archiveData, null, 2));
    
    // Persist session memory for cross-session access
    await this.persistSessionMemory(sessionId);

    this.emit('session_archived', { sessionId, archivePath });
  }

  /**
   * Compress data using gzip-like compression
   */
  async compressData(data) {
    const zlib = require('zlib');
    return new Promise((resolve, reject) => {
      zlib.gzip(data, (error, compressed) => {
        if (error) reject(error);
        else resolve(compressed);
      });
    });
  }

  /**
   * Decompress data
   */
  async decompressData(compressedData) {
    const zlib = require('zlib');
    return new Promise((resolve, reject) => {
      zlib.gunzip(compressedData, (error, decompressed) => {
        if (error) reject(error);
        else resolve(decompressed.toString());
      });
    });
  }

  /**
   * Cleanup old checkpoints based on retention policy
   */
  async cleanupOldCheckpoints() {
    try {
      const retentionMs = this.options.retentionDays * 24 * 60 * 60 * 1000;
      const cutoffTime = Date.now() - retentionMs;
      
      // Clean up active checkpoints
      for (const [id, checkpoint] of this.activeCheckpoints) {
        if (checkpoint.timestamp < cutoffTime) {
          this.activeCheckpoints.delete(id);
        }
      }

      // Clean up checkpoint files
      const files = await fs.readdir(this.options.checkpointDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.options.checkpointDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime.getTime() < cutoffTime) {
            await fs.unlink(filePath);
          }
        }
      }

      // Keep only max number of recent checkpoints
      if (this.activeCheckpoints.size > this.options.maxCheckpoints) {
        const sorted = Array.from(this.activeCheckpoints.entries())
          .sort((a, b) => b[1].timestamp - a[1].timestamp);
        
        const toRemove = sorted.slice(this.options.maxCheckpoints);
        for (const [id, checkpoint] of toRemove) {
          this.activeCheckpoints.delete(id);
          
          if (checkpoint._filePath) {
            try {
              await fs.unlink(checkpoint._filePath);
            } catch (error) {
              // File might already be deleted
            }
          }
        }
      }

    } catch (error) {
      this.emit('error', { type: 'cleanup', error });
    }
  }

  /**
   * Load checkpoint from file
   */
  async loadCheckpoint(checkpointId) {
    // Check active checkpoints first
    if (this.activeCheckpoints.has(checkpointId)) {
      return this.activeCheckpoints.get(checkpointId);
    }

    // Try to find and load from file
    try {
      const files = await fs.readdir(this.options.checkpointDir);
      const targetFile = files.find(file => file.includes(checkpointId));
      
      if (targetFile) {
        const filePath = path.join(this.options.checkpointDir, targetFile);
        let content;
        
        if (targetFile.endsWith('.gz')) {
          const compressedData = await fs.readFile(filePath);
          content = await this.decompressData(compressedData);
        } else {
          content = await fs.readFile(filePath, 'utf8');
        }
        
        const checkpoint = JSON.parse(content);
        this.activeCheckpoints.set(checkpointId, checkpoint);
        return checkpoint;
      }
    } catch (error) {
      this.emit('error', { type: 'checkpoint_load', error, checkpointId });
    }

    return null;
  }

  /**
   * Validate checkpoint data
   */
  validateCheckpoint(checkpoint) {
    if (!checkpoint || typeof checkpoint !== 'object') return false;
    
    const required = ['id', 'type', 'timestamp'];
    for (const field of required) {
      if (!checkpoint[field]) return false;
    }

    if (typeof checkpoint.timestamp !== 'number') return false;
    if (checkpoint.timestamp > Date.now()) return false;

    return true;
  }

  /**
   * Setup validation rules for different checkpoint types
   */
  setupValidationRules() {
    this.validationRules.set('decision_point', (checkpoint) => {
      return checkpoint.decision && 
             checkpoint.decision.context &&
             checkpoint.decision.selected !== undefined;
    });

    this.validationRules.set('pre_operation', (checkpoint) => {
      return checkpoint.operation && 
             checkpoint.operation.name &&
             checkpoint.operation.type;
    });

    this.validationRules.set('session_boundary', (checkpoint) => {
      return checkpoint.sessionId;
    });
  }

  /**
   * Get memory usage statistics
   */
  async getMemoryUsage() {
    const stats = {
      checkpoints: this.activeCheckpoints.size,
      compressionCache: this.compressionCache.size,
      totalMemorySize: 0,
      compressedSize: 0
    };

    try {
      const memoryDirs = ['agents', 'shared', 'global', 'sessions'];
      for (const dir of memoryDirs) {
        const dirPath = path.join(this.options.memoryDir, dir);
        try {
          const dirStats = await this.calculateDirectorySize(dirPath);
          stats.totalMemorySize += dirStats.size;
        } catch (error) {
          // Directory might not exist
        }
      }

      const compressedDir = path.join(this.options.checkpointDir, 'compressed');
      try {
        const compressedStats = await this.calculateDirectorySize(compressedDir);
        stats.compressedSize = compressedStats.size;
      } catch (error) {
        // Compressed directory might not exist
      }

    } catch (error) {
      this.emit('error', { type: 'memory_usage', error });
    }

    return stats;
  }

  /**
   * Calculate directory size recursively
   */
  async calculateDirectorySize(dirPath) {
    let totalSize = 0;
    let fileCount = 0;

    try {
      const items = await fs.readdir(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          const subStats = await this.calculateDirectorySize(itemPath);
          totalSize += subStats.size;
          fileCount += subStats.fileCount;
        } else {
          totalSize += stats.size;
          fileCount++;
        }
      }
    } catch (error) {
      // Handle permission errors or missing directories
    }

    return { size: totalSize, fileCount };
  }

  /**
   * Get memory metrics for monitoring
   */
  async getMemoryMetrics() {
    const processMemory = process.memoryUsage();
    const systemMemory = await this.getMemoryUsage();
    
    return {
      process: {
        heapUsed: processMemory.heapUsed,
        heapTotal: processMemory.heapTotal,
        external: processMemory.external,
        rss: processMemory.rss
      },
      system: systemMemory,
      checkpoints: {
        active: this.activeCheckpoints.size,
        compressed: this.compressionCache.size,
        session: this.currentSession?.checkpointCount || 0
      },
      timestamp: Date.now()
    };
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `session_${timestamp}_${random}`;
  }

  /**
   * Generate unique checkpoint ID
   */
  generateCheckpointId(type = 'checkpoint') {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(3).toString('hex');
    return `${type}_${timestamp}_${random}`;
  }

  /**
   * Generate encryption key for sensitive data
   */
  generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get health status of checkpoint system
   */
  getHealthStatus() {
    const status = {
      healthy: true,
      timestamp: Date.now(),
      metrics: {
        activeCheckpoints: this.activeCheckpoints.size,
        currentSession: this.currentSession?.id || null,
        recoveryMode: this.recoveryState.recoveryMode,
        failedOperations: this.recoveryState.failedOperations.length
      },
      warnings: []
    };

    // Check for issues
    if (this.activeCheckpoints.size === 0) {
      status.warnings.push('No active checkpoints available');
    }

    if (this.recoveryState.failedOperations.length > 0) {
      status.warnings.push(`${this.recoveryState.failedOperations.length} failed operations`);
      status.healthy = false;
    }

    if (!this.currentSession) {
      status.warnings.push('No active session');
    }

    return status;
  }

  /**
   * End current session and create final checkpoint
   */
  async endSession() {
    if (!this.currentSession) return;

    await this.createSessionCheckpoint({ type: 'session_end' });
    
    const sessionId = this.currentSession.id;
    this.currentSession = null;
    
    this.emit('session_ended', { sessionId });
    return sessionId;
  }

  /**
   * Get checkpoint statistics
   */
  getCheckpointStats() {
    const stats = {
      total: this.activeCheckpoints.size,
      byType: {},
      bySession: {},
      oldest: null,
      newest: null
    };

    let oldestTime = Date.now();
    let newestTime = 0;

    for (const checkpoint of this.activeCheckpoints.values()) {
      // Count by type
      stats.byType[checkpoint.type] = (stats.byType[checkpoint.type] || 0) + 1;
      
      // Count by session
      if (checkpoint.sessionId) {
        stats.bySession[checkpoint.sessionId] = (stats.bySession[checkpoint.sessionId] || 0) + 1;
      }

      // Track oldest and newest
      if (checkpoint.timestamp < oldestTime) {
        oldestTime = checkpoint.timestamp;
        stats.oldest = checkpoint.id;
      }
      
      if (checkpoint.timestamp > newestTime) {
        newestTime = checkpoint.timestamp;
        stats.newest = checkpoint.id;
      }
    }

    return stats;
  }
}

module.exports = MemoryCheckpointSystem;