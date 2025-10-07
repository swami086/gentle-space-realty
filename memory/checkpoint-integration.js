const MemoryCheckpointSystem = require('./checkpoint-system');
const CheckpointRecoverySystem = require('./checkpoint-recovery');
const { execSync } = require('child_process');
const path = require('path');

/**
 * Checkpoint Integration Layer
 * Integrates the checkpoint system with existing hive mind infrastructure,
 * providing seamless context preservation and recovery capabilities.
 */
class CheckpointIntegration {
  constructor(options = {}) {
    this.options = {
      memoryDir: options.memoryDir || './memory',
      checkpointDir: options.checkpointDir || './memory/checkpoints',
      gitIntegrationEnabled: options.gitIntegrationEnabled !== false,
      hookIntegrationEnabled: options.hookIntegrationEnabled !== false,
      monitoringEnabled: options.monitoringEnabled !== false,
      ...options
    };

    this.checkpointSystem = new MemoryCheckpointSystem(this.options);
    this.recoverySystem = new CheckpointRecoverySystem(this.checkpointSystem, this.options);
    this.monitoringMetrics = new Map();
    this.integrationHooks = new Map();
    
    this.initialize();
  }

  /**
   * Initialize the integration system
   */
  async initialize() {
    try {
      // Initialize checkpoint system
      await this.checkpointSystem.initialize();
      
      // Enable auto-recovery
      await this.recoverySystem.enableAutoRecovery();
      
      // Start backup schedule
      this.recoverySystem.startBackupSchedule();
      
      // Setup integration hooks
      if (this.options.hookIntegrationEnabled) {
        this.setupIntegrationHooks();
      }
      
      // Setup Git integration
      if (this.options.gitIntegrationEnabled) {
        this.setupGitIntegration();
      }
      
      // Start monitoring
      if (this.options.monitoringEnabled) {
        this.startMonitoring();
      }
      
      console.log('✅ Checkpoint integration system initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize checkpoint integration:', error.message);
      throw error;
    }
  }

  /**
   * Setup integration hooks for existing systems
   */
  setupIntegrationHooks() {
    // Pre-operation hooks
    this.integrationHooks.set('pre_agent_spawn', async (agentData) => {
      return await this.checkpointSystem.createDecisionCheckpoint({
        context: { operation: 'agent_spawn', agentType: agentData.type },
        selected: 'spawn_agent',
        reasoning: `Spawning ${agentData.type} agent for hive mind coordination`,
        impact: 'medium',
        reversible: true
      });
    });

    this.integrationHooks.set('pre_task_assignment', async (taskData) => {
      return await this.checkpointSystem.createDecisionCheckpoint({
        context: { operation: 'task_assignment', task: taskData.name },
        selected: 'assign_task',
        reasoning: `Assigning task ${taskData.name} to agent`,
        impact: taskData.priority || 'medium',
        reversible: true
      });
    });

    this.integrationHooks.set('pre_memory_update', async (memoryData) => {
      return await this.checkpointSystem.createOperationCheckpoint({
        name: 'memory_update',
        type: 'memory',
        scope: memoryData.scope || 'local',
        riskLevel: 'low',
        dependencies: memoryData.dependencies || []
      });
    });

    // Post-operation hooks
    this.integrationHooks.set('post_task_completion', async (taskResult) => {
      await this.updateTaskMetrics(taskResult);
      return await this.checkpointSystem.createOperationCheckpoint({
        name: 'task_completion',
        type: 'milestone',
        scope: 'task',
        riskLevel: 'low',
        result: taskResult
      });
    });

    this.integrationHooks.set('post_agent_coordination', async (coordData) => {
      return await this.checkpointSystem.createSessionCheckpoint({
        type: 'coordination_milestone',
        coordination: coordData,
        timestamp: Date.now()
      });
    });

    // Error handling hooks
    this.integrationHooks.set('on_agent_failure', async (failureData) => {
      return await this.recoverySystem.performRecovery('agent_memory_failure', {
        agentId: failureData.agentId,
        agentType: failureData.type,
        error: failureData.error
      });
    });

    this.integrationHooks.set('on_coordination_failure', async (failureData) => {
      return await this.recoverySystem.performRecovery('coordination_failure', {
        topology: failureData.topology,
        agents: failureData.agents,
        error: failureData.error
      });
    });
  }

  /**
   * Setup Git integration for checkpoint management
   */
  setupGitIntegration() {
    // Listen for checkpoint events and create git checkpoints
    this.checkpointSystem.on('checkpoint_created', async (event) => {
      if (event.checkpoint.type === 'decision_point' || 
          event.checkpoint.type === 'session_boundary') {
        await this.createGitCheckpoint(event.checkpoint);
      }
    });

    this.checkpointSystem.on('session_ended', async (event) => {
      await this.createGitSessionCheckpoint(event.sessionId);
    });
  }

  /**
   * Create Git checkpoint using existing scripts
   */
  async createGitCheckpoint(checkpoint) {
    try {
      const hookScript = path.join('.claude', 'helpers', 'standard-checkpoint-hooks.sh');
      const description = `${checkpoint.type}: ${checkpoint.id}`;
      
      // Use the existing checkpoint hook system
      execSync(`bash "${hookScript}" post-edit '{"file_path": "memory/checkpoint-system.js"}'`, {
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      console.log(`📌 Git checkpoint created for: ${description}`);
      
    } catch (error) {
      console.warn('⚠️ Git checkpoint creation failed:', error.message);
    }
  }

  /**
   * Create session-end Git checkpoint
   */
  async createGitSessionCheckpoint(sessionId) {
    try {
      const hookScript = path.join('.claude', 'helpers', 'standard-checkpoint-hooks.sh');
      
      execSync(`bash "${hookScript}" session-end`, {
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      console.log(`🏁 Git session checkpoint created for: ${sessionId}`);
      
    } catch (error) {
      console.warn('⚠️ Git session checkpoint creation failed:', error.message);
    }
  }

  /**
   * Execute integration hook
   */
  async executeHook(hookName, data) {
    if (this.integrationHooks.has(hookName)) {
      try {
        const hook = this.integrationHooks.get(hookName);
        return await hook(data);
      } catch (error) {
        console.warn(`Integration hook ${hookName} failed:`, error.message);
        return null;
      }
    }
    return null;
  }

  /**
   * Agent lifecycle integration
   */
  async onAgentSpawn(agentData) {
    const checkpointId = await this.executeHook('pre_agent_spawn', agentData);
    
    try {
      // Create agent memory structure
      await this.initializeAgentMemory(agentData);
      
      // Create success checkpoint
      await this.checkpointSystem.createOperationCheckpoint({
        name: 'agent_spawn_success',
        type: 'milestone',
        scope: 'agent',
        riskLevel: 'low',
        agentId: agentData.id,
        agentType: agentData.type
      });
      
      return { success: true, checkpointId, agentId: agentData.id };
      
    } catch (error) {
      // Trigger recovery if agent spawn fails
      await this.executeHook('on_agent_failure', {
        agentId: agentData.id,
        type: agentData.type,
        error: error.message,
        operation: 'spawn'
      });
      
      throw error;
    }
  }

  /**
   * Initialize agent memory structure
   */
  async initializeAgentMemory(agentData) {
    const fs = require('fs').promises;
    const agentDir = path.join(this.options.memoryDir, 'agents', agentData.id);
    
    await fs.mkdir(agentDir, { recursive: true });
    
    const initialMemory = {
      agentId: agentData.id,
      agentType: agentData.type,
      spawnedAt: Date.now(),
      memoryBank: {
        tasks: [],
        knowledge: {},
        interactions: [],
        decisions: []
      },
      capabilities: agentData.capabilities || [],
      status: 'initialized',
      checkpointIntegration: {
        enabled: true,
        lastCheckpoint: null,
        checkpointCount: 0
      }
    };
    
    await fs.writeFile(
      path.join(agentDir, 'memory_bank.json'),
      JSON.stringify(initialMemory, null, 2)
    );
  }

  /**
   * Task assignment integration
   */
  async onTaskAssignment(taskData) {
    const checkpointId = await this.executeHook('pre_task_assignment', taskData);
    
    try {
      // Update agent memory with task assignment
      await this.updateAgentMemoryWithTask(taskData);
      
      // Create task tracking checkpoint
      await this.checkpointSystem.createOperationCheckpoint({
        name: 'task_assignment_success',
        type: 'task',
        scope: 'agent',
        riskLevel: 'low',
        taskId: taskData.id,
        agentId: taskData.assignedTo
      });
      
      return { success: true, checkpointId, taskId: taskData.id };
      
    } catch (error) {
      console.warn('Task assignment failed:', error.message);
      throw error;
    }
  }

  /**
   * Update agent memory with task information
   */
  async updateAgentMemoryWithTask(taskData) {
    const fs = require('fs').promises;
    const agentMemoryPath = path.join(
      this.options.memoryDir,
      'agents',
      taskData.assignedTo,
      'memory_bank.json'
    );
    
    try {
      const memoryContent = await fs.readFile(agentMemoryPath, 'utf8');
      const agentMemory = JSON.parse(memoryContent);
      
      // Add task to agent's memory
      agentMemory.memoryBank.tasks.push({
        taskId: taskData.id,
        taskName: taskData.name,
        assignedAt: Date.now(),
        status: 'assigned',
        priority: taskData.priority || 'medium',
        deadline: taskData.deadline,
        requirements: taskData.requirements || []
      });
      
      agentMemory.status = 'task_assigned';
      agentMemory.lastUpdated = Date.now();
      
      await fs.writeFile(agentMemoryPath, JSON.stringify(agentMemory, null, 2));
      
    } catch (error) {
      console.warn(`Failed to update agent memory for task assignment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Task completion integration
   */
  async onTaskCompletion(taskResult) {
    await this.executeHook('post_task_completion', taskResult);
    
    // Update agent memory with task completion
    await this.updateAgentMemoryWithCompletion(taskResult);
    
    // Create completion milestone
    await this.checkpointSystem.createOperationCheckpoint({
      name: 'task_completion_milestone',
      type: 'milestone',
      scope: 'task',
      riskLevel: 'low',
      taskId: taskResult.taskId,
      result: taskResult,
      completionMetrics: await this.calculateTaskMetrics(taskResult)
    });
  }

  /**
   * Update agent memory with task completion
   */
  async updateAgentMemoryWithCompletion(taskResult) {
    const fs = require('fs').promises;
    const agentMemoryPath = path.join(
      this.options.memoryDir,
      'agents',
      taskResult.agentId,
      'memory_bank.json'
    );
    
    try {
      const memoryContent = await fs.readFile(agentMemoryPath, 'utf8');
      const agentMemory = JSON.parse(memoryContent);
      
      // Update task status in agent's memory
      const taskIndex = agentMemory.memoryBank.tasks.findIndex(
        t => t.taskId === taskResult.taskId
      );
      
      if (taskIndex !== -1) {
        agentMemory.memoryBank.tasks[taskIndex].status = 'completed';
        agentMemory.memoryBank.tasks[taskIndex].completedAt = Date.now();
        agentMemory.memoryBank.tasks[taskIndex].result = taskResult.result;
        agentMemory.memoryBank.tasks[taskIndex].duration = 
          Date.now() - agentMemory.memoryBank.tasks[taskIndex].assignedAt;
      }
      
      agentMemory.status = 'task_completed';
      agentMemory.lastUpdated = Date.now();
      
      await fs.writeFile(agentMemoryPath, JSON.stringify(agentMemory, null, 2));
      
    } catch (error) {
      console.warn(`Failed to update agent memory for task completion: ${error.message}`);
    }
  }

  /**
   * Coordination event integration
   */
  async onCoordinationEvent(eventData) {
    await this.executeHook('post_agent_coordination', eventData);
    
    // Update coordination state in memory
    await this.updateCoordinationMemory(eventData);
  }

  /**
   * Update coordination memory with event data
   */
  async updateCoordinationMemory(eventData) {
    const fs = require('fs').promises;
    const coordStatePath = './coordination/memory_bank/swarm-state.json';
    
    try {
      let coordState = {};
      
      try {
        const content = await fs.readFile(coordStatePath, 'utf8');
        coordState = JSON.parse(content);
      } catch (error) {
        // File might not exist, create new state
      }
      
      if (!coordState.events) {
        coordState.events = [];
      }
      
      coordState.events.push({
        ...eventData,
        timestamp: Date.now(),
        checkpointSystem: 'integrated'
      });
      
      // Keep only last 100 events
      if (coordState.events.length > 100) {
        coordState.events = coordState.events.slice(-100);
      }
      
      coordState.lastUpdated = Date.now();
      
      await fs.writeFile(coordStatePath, JSON.stringify(coordState, null, 2));
      
    } catch (error) {
      console.warn(`Failed to update coordination memory: ${error.message}`);
    }
  }

  /**
   * Start monitoring and metrics collection
   */
  startMonitoring() {
    // Monitor checkpoint system health
    setInterval(async () => {
      try {
        const checkpointHealth = this.checkpointSystem.getHealthStatus();
        const recoveryStatus = this.recoverySystem.getRecoveryStatus();
        const checkpointStats = this.checkpointSystem.getCheckpointStats();
        
        this.monitoringMetrics.set('checkpoint_health', {
          ...checkpointHealth,
          timestamp: Date.now()
        });
        
        this.monitoringMetrics.set('recovery_status', {
          ...recoveryStatus,
          timestamp: Date.now()
        });
        
        this.monitoringMetrics.set('checkpoint_stats', {
          ...checkpointStats,
          timestamp: Date.now()
        });
        
        // Log metrics to file
        await this.logMetrics();
        
      } catch (error) {
        console.warn('Monitoring metrics collection failed:', error.message);
      }
    }, 60000); // Every minute
  }

  /**
   * Log metrics to file
   */
  async logMetrics() {
    const fs = require('fs').promises;
    const metricsPath = path.join(this.options.memoryDir, 'metrics', 'checkpoint-metrics.json');
    
    try {
      await fs.mkdir(path.dirname(metricsPath), { recursive: true });
      
      const metricsData = {
        timestamp: Date.now(),
        metrics: Object.fromEntries(this.monitoringMetrics)
      };
      
      await fs.writeFile(metricsPath, JSON.stringify(metricsData, null, 2));
      
    } catch (error) {
      console.warn('Failed to log metrics:', error.message);
    }
  }

  /**
   * Calculate task completion metrics
   */
  async calculateTaskMetrics(taskResult) {
    return {
      duration: taskResult.duration || 0,
      success: taskResult.success || false,
      complexity: taskResult.complexity || 'medium',
      resourcesUsed: taskResult.resourcesUsed || 'unknown',
      agentEfficiency: taskResult.agentEfficiency || 1.0,
      timestamp: Date.now()
    };
  }

  /**
   * Update task metrics for monitoring
   */
  async updateTaskMetrics(taskResult) {
    const metrics = await this.calculateTaskMetrics(taskResult);
    
    let allMetrics = this.monitoringMetrics.get('task_metrics') || [];
    allMetrics.push(metrics);
    
    // Keep only last 100 task metrics
    if (allMetrics.length > 100) {
      allMetrics = allMetrics.slice(-100);
    }
    
    this.monitoringMetrics.set('task_metrics', allMetrics);
  }

  /**
   * Get integration status
   */
  getStatus() {
    const checkpointHealth = this.checkpointSystem.getHealthStatus();
    const recoveryStatus = this.recoverySystem.getRecoveryStatus();
    
    return {
      integration: {
        initialized: true,
        gitIntegration: this.options.gitIntegrationEnabled,
        hookIntegration: this.options.hookIntegrationEnabled,
        monitoring: this.options.monitoringEnabled,
        availableHooks: Array.from(this.integrationHooks.keys())
      },
      checkpoint: checkpointHealth,
      recovery: recoveryStatus,
      timestamp: Date.now()
    };
  }

  /**
   * Emergency recovery trigger
   */
  async emergencyRecovery() {
    console.log('🚨 Emergency recovery initiated');
    
    try {
      // Attempt system recovery
      const result = await this.recoverySystem.performRecovery('system_failure', {
        trigger: 'emergency',
        timestamp: Date.now()
      });
      
      console.log('✅ Emergency recovery completed:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Emergency recovery failed:', error.message);
      throw error;
    }
  }

  /**
   * Manual checkpoint creation
   */
  async createManualCheckpoint(description) {
    return await this.checkpointSystem.createDecisionCheckpoint({
      context: { manual: true, description },
      selected: 'manual_checkpoint',
      reasoning: description,
      impact: 'low',
      reversible: true
    });
  }

  /**
   * Shutdown integration system
   */
  async shutdown() {
    try {
      // End current session
      await this.checkpointSystem.endSession();
      
      // Create final backup
      await this.recoverySystem.createRecoveryBackups();
      
      // Create final git checkpoint
      if (this.options.gitIntegrationEnabled) {
        await this.createGitSessionCheckpoint('shutdown');
      }
      
      console.log('✅ Checkpoint integration system shutdown complete');
      
    } catch (error) {
      console.warn('⚠️ Error during shutdown:', error.message);
    }
  }
}

module.exports = CheckpointIntegration;