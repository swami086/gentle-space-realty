const MemoryCheckpointSystem = require('./checkpoint-system');
const fs = require('fs').promises;
const path = require('path');

/**
 * Advanced Recovery and Context Restoration System
 * Provides intelligent recovery mechanisms, context restoration,
 * and failure handling for the memory checkpoint system.
 */
class CheckpointRecoverySystem {
  constructor(checkpointSystem, options = {}) {
    this.checkpoint = checkpointSystem;
    this.options = {
      maxRecoveryAttempts: options.maxRecoveryAttempts || 3,
      recoveryTimeoutMs: options.recoveryTimeoutMs || 30000,
      autoRecoveryEnabled: options.autoRecoveryEnabled !== false,
      integrityCheckEnabled: options.integrityCheckEnabled !== false,
      recoveryLogPath: options.recoveryLogPath || './memory/recovery/recovery.log',
      ...options
    };

    this.recoveryHistory = [];
    this.integrityCache = new Map();
    this.recoveryStrategies = new Map();
    
    this.setupRecoveryStrategies();
  }

  /**
   * Setup different recovery strategies for different failure types
   */
  setupRecoveryStrategies() {
    // Memory corruption recovery
    this.recoveryStrategies.set('memory_corruption', async (context) => {
      const lastValidCheckpoint = await this.findLastValidCheckpoint();
      if (lastValidCheckpoint) {
        await this.checkpoint.restoreFromCheckpoint(lastValidCheckpoint.id);
        return { success: true, strategy: 'last_valid_checkpoint', checkpointId: lastValidCheckpoint.id };
      }
      return { success: false, reason: 'No valid checkpoint found' };
    });

    // Session recovery
    this.recoveryStrategies.set('session_failure', async (context) => {
      const sessionBackups = await this.findSessionBackups(context.sessionId);
      if (sessionBackups.length > 0) {
        const latestBackup = sessionBackups[0];
        await this.checkpoint.loadPersistedSession(latestBackup.sessionId);
        return { success: true, strategy: 'session_backup', sessionId: latestBackup.sessionId };
      }
      
      // Try to create new session with preserved memory
      const memoryState = await this.preserveExistingMemory();
      const newSessionId = await this.checkpoint.startSession({ 
        recoveredSession: true,
        originalSessionId: context.sessionId,
        preservedMemory: memoryState
      });
      return { success: true, strategy: 'new_session_with_memory', sessionId: newSessionId };
    });

    // Agent memory recovery
    this.recoveryStrategies.set('agent_memory_failure', async (context) => {
      const agentId = context.agentId;
      const backupPath = path.join(this.checkpoint.options.memoryDir, 'recovery', `${agentId}_backup.json`);
      
      try {
        const backupData = await fs.readFile(backupPath, 'utf8');
        const agentMemory = JSON.parse(backupData);
        
        const agentDir = path.join(this.checkpoint.options.memoryDir, 'agents', agentId);
        await fs.mkdir(agentDir, { recursive: true });
        await fs.writeFile(
          path.join(agentDir, 'memory_bank.json'),
          JSON.stringify(agentMemory, null, 2)
        );
        
        return { success: true, strategy: 'agent_backup_restore', agentId };
      } catch (error) {
        // Create new agent memory with minimal state
        const minimalMemory = {
          agentId,
          type: context.agentType || 'unknown',
          initialized: Date.now(),
          recovered: true,
          memoryBank: {},
          taskHistory: []
        };
        
        const agentDir = path.join(this.checkpoint.options.memoryDir, 'agents', agentId);
        await fs.mkdir(agentDir, { recursive: true });
        await fs.writeFile(
          path.join(agentDir, 'memory_bank.json'),
          JSON.stringify(minimalMemory, null, 2)
        );
        
        return { success: true, strategy: 'minimal_agent_recovery', agentId };
      }
    });

    // Coordination state recovery
    this.recoveryStrategies.set('coordination_failure', async (context) => {
      const coordBackupPath = './coordination/memory_bank/backup';
      
      try {
        const backupFiles = await fs.readdir(coordBackupPath);
        const latestBackup = backupFiles
          .filter(f => f.endsWith('.json'))
          .sort()
          .reverse()[0];
        
        if (latestBackup) {
          const backupData = await fs.readFile(path.join(coordBackupPath, latestBackup), 'utf8');
          const coordState = JSON.parse(backupData);
          
          // Restore coordination state files
          for (const [filename, data] of Object.entries(coordState)) {
            await fs.writeFile(
              path.join('./coordination/memory_bank', `${filename}.json`),
              JSON.stringify(data, null, 2)
            );
          }
          
          return { success: true, strategy: 'coordination_backup_restore', backup: latestBackup };
        }
      } catch (error) {
        // Create minimal coordination state
        const minimalCoordState = {
          'swarm-state': {
            initialized: Date.now(),
            topology: 'mesh',
            agents: {},
            recovered: true
          }
        };
        
        await fs.writeFile(
          path.join('./coordination/memory_bank', 'swarm-state.json'),
          JSON.stringify(minimalCoordState['swarm-state'], null, 2)
        );
        
        return { success: true, strategy: 'minimal_coordination_recovery' };
      }
    });

    // Complete system recovery
    this.recoveryStrategies.set('system_failure', async (context) => {
      const recoveryPlan = [];
      
      // Step 1: Recover coordination layer
      const coordRecovery = await this.recoveryStrategies.get('coordination_failure')({});
      recoveryPlan.push(coordRecovery);
      
      // Step 2: Recover agent memories
      const agents = await this.discoverAgents();
      for (const agentId of agents) {
        const agentRecovery = await this.recoveryStrategies.get('agent_memory_failure')({ agentId });
        recoveryPlan.push(agentRecovery);
      }
      
      // Step 3: Recover or create session
      const sessionRecovery = await this.recoveryStrategies.get('session_failure')(context);
      recoveryPlan.push(sessionRecovery);
      
      return { 
        success: recoveryPlan.every(r => r.success), 
        strategy: 'complete_system_recovery', 
        steps: recoveryPlan 
      };
    });
  }

  /**
   * Intelligent recovery based on failure type and context
   */
  async performRecovery(failureType, context = {}) {
    const recoveryId = this.generateRecoveryId();
    const startTime = Date.now();
    
    try {
      await this.logRecoveryAttempt(recoveryId, failureType, context);
      
      // Check if recovery strategy exists
      if (!this.recoveryStrategies.has(failureType)) {
        throw new Error(`No recovery strategy for failure type: ${failureType}`);
      }
      
      const strategy = this.recoveryStrategies.get(failureType);
      
      // Attempt recovery with timeout
      const result = await this.executeWithTimeout(
        strategy(context),
        this.options.recoveryTimeoutMs
      );
      
      // Log success
      await this.logRecoveryResult(recoveryId, {
        success: true,
        result,
        duration: Date.now() - startTime
      });
      
      // Update recovery history
      this.recoveryHistory.push({
        id: recoveryId,
        failureType,
        context,
        result,
        timestamp: Date.now(),
        success: true
      });
      
      return result;
      
    } catch (error) {
      // Log failure
      await this.logRecoveryResult(recoveryId, {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      });
      
      // Update recovery history
      this.recoveryHistory.push({
        id: recoveryId,
        failureType,
        context,
        error: error.message,
        timestamp: Date.now(),
        success: false
      });
      
      throw error;
    }
  }

  /**
   * Auto-recovery system that monitors and responds to failures
   */
  async enableAutoRecovery() {
    if (!this.options.autoRecoveryEnabled) return;
    
    // Monitor checkpoint system health
    setInterval(async () => {
      try {
        const health = this.checkpoint.getHealthStatus();
        
        if (!health.healthy) {
          await this.handleHealthIssues(health);
        }
        
        // Check memory integrity
        if (this.options.integrityCheckEnabled) {
          await this.performIntegrityCheck();
        }
        
      } catch (error) {
        console.warn('Auto-recovery health check failed:', error.message);
      }
    }, 30000); // Check every 30 seconds
    
    // Listen for checkpoint system events
    this.checkpoint.on('error', async (event) => {
      if (this.options.autoRecoveryEnabled) {
        await this.handleCheckpointError(event);
      }
    });
  }

  /**
   * Handle health issues automatically
   */
  async handleHealthIssues(health) {
    const issues = health.warnings;
    
    for (const issue of issues) {
      if (issue.includes('failed operations')) {
        await this.performRecovery('memory_corruption');
      } else if (issue.includes('No active session')) {
        await this.performRecovery('session_failure', {});
      } else if (issue.includes('No active checkpoints')) {
        // Create emergency checkpoint
        await this.checkpoint.createOperationCheckpoint({
          name: 'emergency_checkpoint',
          type: 'recovery',
          scope: 'system',
          riskLevel: 'high'
        });
      }
    }
  }

  /**
   * Handle specific checkpoint errors
   */
  async handleCheckpointError(event) {
    switch (event.type) {
      case 'checkpoint_save':
        await this.performRecovery('memory_corruption', { 
          operation: 'save',
          checkpointId: event.checkpoint 
        });
        break;
        
      case 'checkpoint_restore':
        await this.performRecovery('memory_corruption', { 
          operation: 'restore',
          checkpointId: event.checkpointId 
        });
        break;
        
      case 'memory_restore':
        await this.performRecovery('agent_memory_failure', {});
        break;
        
      case 'session_load':
        await this.performRecovery('session_failure', { 
          sessionId: event.sessionId 
        });
        break;
        
      default:
        console.warn(`Unhandled checkpoint error: ${event.type}`);
    }
  }

  /**
   * Perform memory integrity check
   */
  async performIntegrityCheck() {
    try {
      const memoryState = await this.checkpoint.captureMemorySnapshot();
      const integrityHash = this.calculateIntegrityHash(memoryState);
      
      // Compare with previous hash if exists
      const lastHash = this.integrityCache.get('memory_state');
      if (lastHash && lastHash !== integrityHash) {
        // Memory state changed, verify it's valid
        if (!await this.validateMemoryState(memoryState)) {
          await this.performRecovery('memory_corruption');
        }
      }
      
      this.integrityCache.set('memory_state', integrityHash);
      
    } catch (error) {
      console.warn('Integrity check failed:', error.message);
      await this.performRecovery('memory_corruption');
    }
  }

  /**
   * Validate memory state integrity
   */
  async validateMemoryState(memoryState) {
    try {
      // Check required structure
      if (!memoryState.agentMemory || !memoryState.coordinationState) {
        return false;
      }
      
      // Validate agent memories
      for (const [agentId, memory] of Object.entries(memoryState.agentMemory)) {
        if (!memory || typeof memory !== 'object') {
          return false;
        }
      }
      
      // Validate coordination state
      if (!memoryState.coordinationState || 
          typeof memoryState.coordinationState !== 'object') {
        return false;
      }
      
      return true;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Find the last valid checkpoint
   */
  async findLastValidCheckpoint() {
    const checkpoints = Array.from(this.checkpoint.activeCheckpoints.values())
      .sort((a, b) => b.timestamp - a.timestamp);
    
    for (const checkpoint of checkpoints) {
      if (this.checkpoint.validateCheckpoint(checkpoint)) {
        return checkpoint;
      }
    }
    
    return null;
  }

  /**
   * Find available session backups
   */
  async findSessionBackups(sessionId) {
    const backups = [];
    
    try {
      const sessionsDir = path.join(this.checkpoint.options.memoryDir, 'sessions');
      const sessionDirs = await fs.readdir(sessionsDir);
      
      for (const dir of sessionDirs) {
        if (sessionId && !dir.includes(sessionId)) continue;
        
        try {
          const sessionFile = path.join(sessionsDir, dir, 'session_memory.json');
          const sessionData = JSON.parse(await fs.readFile(sessionFile, 'utf8'));
          backups.push({
            sessionId: sessionData.sessionId,
            persistedAt: sessionData.persistedAt,
            path: sessionFile
          });
        } catch (error) {
          // Skip invalid session directories
        }
      }
      
      return backups.sort((a, b) => b.persistedAt - a.persistedAt);
      
    } catch (error) {
      return [];
    }
  }

  /**
   * Preserve existing memory state during recovery
   */
  async preserveExistingMemory() {
    try {
      return await this.checkpoint.captureMemorySnapshot();
    } catch (error) {
      return {
        timestamp: Date.now(),
        agentMemory: {},
        sharedMemory: {},
        globalMemory: {},
        coordinationState: {},
        preserved: true,
        error: error.message
      };
    }
  }

  /**
   * Discover existing agents from memory structure
   */
  async discoverAgents() {
    const agents = [];
    
    try {
      const agentsDir = path.join(this.checkpoint.options.memoryDir, 'agents');
      const agentDirs = await fs.readdir(agentsDir);
      
      for (const dir of agentDirs) {
        if (dir !== 'README.md') {
          agents.push(dir);
        }
      }
    } catch (error) {
      // No agents directory exists
    }
    
    return agents;
  }

  /**
   * Create periodic memory backups for recovery
   */
  async createRecoveryBackups() {
    try {
      const backupDir = path.join(this.checkpoint.options.memoryDir, 'recovery');
      await fs.mkdir(backupDir, { recursive: true });
      
      const timestamp = Date.now();
      
      // Backup agent memories
      const agents = await this.discoverAgents();
      for (const agentId of agents) {
        try {
          const agentMemoryPath = path.join(
            this.checkpoint.options.memoryDir, 
            'agents', 
            agentId, 
            'memory_bank.json'
          );
          
          const agentMemory = await fs.readFile(agentMemoryPath, 'utf8');
          await fs.writeFile(
            path.join(backupDir, `${agentId}_backup.json`),
            agentMemory
          );
        } catch (error) {
          // Agent memory might not exist
        }
      }
      
      // Backup coordination state
      const coordBackupPath = './coordination/memory_bank/backup';
      await fs.mkdir(coordBackupPath, { recursive: true });
      
      const coordFiles = await fs.readdir('./coordination/memory_bank');
      const coordBackup = {};
      
      for (const file of coordFiles) {
        if (file.endsWith('.json')) {
          try {
            const content = await fs.readFile(
              path.join('./coordination/memory_bank', file),
              'utf8'
            );
            coordBackup[file.replace('.json', '')] = JSON.parse(content);
          } catch (error) {
            // Skip invalid files
          }
        }
      }
      
      await fs.writeFile(
        path.join(coordBackupPath, `backup_${timestamp}.json`),
        JSON.stringify(coordBackup, null, 2)
      );
      
      // Cleanup old backups (keep last 5)
      await this.cleanupOldBackups(backupDir, 5);
      await this.cleanupOldBackups(coordBackupPath, 5);
      
    } catch (error) {
      console.warn('Failed to create recovery backups:', error.message);
    }
  }

  /**
   * Cleanup old backup files
   */
  async cleanupOldBackups(backupDir, keepCount = 5) {
    try {
      const files = await fs.readdir(backupDir);
      const backupFiles = files
        .filter(f => f.includes('backup') && f.endsWith('.json'))
        .sort()
        .reverse();
      
      if (backupFiles.length > keepCount) {
        const toDelete = backupFiles.slice(keepCount);
        for (const file of toDelete) {
          await fs.unlink(path.join(backupDir, file));
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Execute operation with timeout
   */
  async executeWithTimeout(promise, timeoutMs) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      
      promise
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Calculate integrity hash for memory state
   */
  calculateIntegrityHash(memoryState) {
    const crypto = require('crypto');
    const dataString = JSON.stringify(memoryState, Object.keys(memoryState).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Log recovery attempts
   */
  async logRecoveryAttempt(recoveryId, failureType, context) {
    const logEntry = {
      timestamp: Date.now(),
      recoveryId,
      event: 'recovery_attempt',
      failureType,
      context
    };
    
    await this.appendToRecoveryLog(logEntry);
  }

  /**
   * Log recovery results
   */
  async logRecoveryResult(recoveryId, result) {
    const logEntry = {
      timestamp: Date.now(),
      recoveryId,
      event: 'recovery_result',
      ...result
    };
    
    await this.appendToRecoveryLog(logEntry);
  }

  /**
   * Append entry to recovery log
   */
  async appendToRecoveryLog(entry) {
    try {
      const logDir = path.dirname(this.options.recoveryLogPath);
      await fs.mkdir(logDir, { recursive: true });
      
      const logLine = JSON.stringify(entry) + '\n';
      await fs.appendFile(this.options.recoveryLogPath, logLine);
    } catch (error) {
      console.warn('Failed to write recovery log:', error.message);
    }
  }

  /**
   * Generate unique recovery ID
   */
  generateRecoveryId() {
    const crypto = require('crypto');
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(2).toString('hex');
    return `recovery_${timestamp}_${random}`;
  }

  /**
   * Get recovery system status
   */
  getRecoveryStatus() {
    return {
      enabled: this.options.autoRecoveryEnabled,
      totalRecoveries: this.recoveryHistory.length,
      successfulRecoveries: this.recoveryHistory.filter(r => r.success).length,
      lastRecovery: this.recoveryHistory[this.recoveryHistory.length - 1] || null,
      availableStrategies: Array.from(this.recoveryStrategies.keys()),
      integrityChecksEnabled: this.options.integrityCheckEnabled,
      lastIntegrityCheck: this.integrityCache.get('last_check_time') || null
    };
  }

  /**
   * Schedule regular backups
   */
  startBackupSchedule(intervalMs = 300000) { // 5 minutes
    setInterval(async () => {
      try {
        await this.createRecoveryBackups();
      } catch (error) {
        console.warn('Scheduled backup failed:', error.message);
      }
    }, intervalMs);
  }
}

module.exports = CheckpointRecoverySystem;