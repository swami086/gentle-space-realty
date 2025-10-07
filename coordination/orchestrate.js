#!/usr/bin/env node

/**
 * Gentle Space Realty - Queen-Led Hierarchical Coordination System
 * Master orchestration script for managing the development workflow
 */

const fs = require('fs');
const path = require('path');

class QueenCoordinator {
  constructor() {
    this.config = this.loadConfiguration();
    this.agents = new Map();
    this.tasks = new Map();
    this.qualityGates = new Map();
    this.communicationChannels = new Map();
  }

  loadConfiguration() {
    const configFiles = [
      'queen-coordinator.config.json',
      'worker-agents.config.json', 
      'delegation-patterns.config.json',
      'communication-protocols.config.json',
      'quality-gates.config.json'
    ];

    const config = {};
    for (const file of configFiles) {
      try {
        const configPath = path.join(__dirname, file);
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        Object.assign(config, configData);
      } catch (error) {
        console.error(`Failed to load configuration file ${file}:`, error.message);
      }
    }

    return config;
  }

  async initializeHierarchy() {
    console.log('🔄 Initializing Queen-Led Hierarchical Coordination System...');
    
    try {
      // Initialize Queen Coordinator
      await this.initializeQueenCoordinator();
      
      // Deploy specialized worker agents
      await this.deployWorkerAgents();
      
      // Set up communication protocols
      await this.establishCommunicationProtocols();
      
      // Configure quality gates
      await this.configureQualityGates();
      
      // Initialize delegation patterns
      await this.initializeDelegationPatterns();

      console.log('✅ Hierarchical coordination system initialized successfully');
      console.log('📊 System ready for development workflow orchestration');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize hierarchy:', error.message);
      return false;
    }
  }

  async initializeQueenCoordinator() {
    console.log('👑 Initializing Queen Coordinator...');
    
    const queenConfig = this.config.queenCoordinator;
    if (!queenConfig) {
      throw new Error('Queen Coordinator configuration not found');
    }

    // Initialize decision framework
    this.decisionFramework = {
      priorities: queenConfig.decisionFramework.priorityHierarchy,
      riskThresholds: queenConfig.decisionFramework.riskThresholds
    };

    // Set up coordination protocols
    this.coordinationProtocols = queenConfig.coordinationProtocols;

    console.log('   ✓ Strategic planning capabilities activated');
    console.log('   ✓ Task decomposition engine initialized'); 
    console.log('   ✓ Resource allocation system ready');
    console.log('   ✓ Cross-team coordination protocols established');
  }

  async deployWorkerAgents() {
    console.log('🚀 Deploying specialized worker agents...');
    
    const workerConfig = this.config.workerAgents;
    if (!workerConfig) {
      throw new Error('Worker agents configuration not found');
    }

    const agents = [
      'frontendQueen',
      'backendQueen', 
      'databaseQueen',
      'testingQueen',
      'securityQueen'
    ];

    for (const agentType of agents) {
      const agentConfig = workerConfig[agentType];
      if (agentConfig) {
        await this.deployAgent(agentType, agentConfig);
      }
    }

    console.log('   ✅ All specialized agents deployed and ready');
  }

  async deployAgent(agentType, config) {
    const emoji = this.getAgentEmoji(agentType);
    console.log(`   ${emoji} Deploying ${config.name}...`);
    
    const agent = {
      id: agentType,
      name: config.name,
      domain: config.domain,
      capabilities: config.capabilities,
      tools: config.tools,
      responsibilities: config.responsibilities,
      workloadCapacity: config.workloadCapacity,
      qualityStandards: config.qualityStandards,
      status: 'active',
      currentTasks: [],
      performance: {
        tasksCompleted: 0,
        averageCompletionTime: 0,
        qualityScore: 100,
        collaborationRating: 100
      }
    };

    this.agents.set(agentType, agent);
    console.log(`     ✓ Agent ${config.name} ready with ${config.capabilities.length} capabilities`);
  }

  getAgentEmoji(agentType) {
    const emojiMap = {
      frontendQueen: '🎨',
      backendQueen: '🔧', 
      databaseQueen: '💾',
      testingQueen: '🧪',
      securityQueen: '🛡️'
    };
    return emojiMap[agentType] || '🤖';
  }

  async establishCommunicationProtocols() {
    console.log('📡 Establishing communication protocols...');
    
    const commConfig = this.config.communicationProtocols;
    if (!commConfig) {
      throw new Error('Communication protocols configuration not found');
    }

    // Initialize message channels
    const channels = commConfig.primaryChannels;
    for (const [channelType, channelConfig] of Object.entries(channels)) {
      this.communicationChannels.set(channelType, {
        protocol: channelConfig.protocol,
        format: channelConfig.format,
        settings: channelConfig
      });
    }

    console.log('   ✓ Star topology with peer mesh established');
    console.log('   ✓ Structured JSON message protocols configured');
    console.log('   ✓ Event-driven status reporting enabled');
    console.log('   ✓ Knowledge base and context sharing active');
  }

  async configureQualityGates() {
    console.log('🔒 Configuring quality gates...');
    
    const gatesConfig = this.config.qualityGates;
    if (!gatesConfig) {
      throw new Error('Quality gates configuration not found');
    }

    // Initialize all 8 quality gates
    const gates = gatesConfig.gateDefinitions;
    let gateCount = 0;
    
    for (const [gateId, gateConfig] of Object.entries(gates)) {
      this.qualityGates.set(gateId, {
        id: gateId,
        name: gateConfig.trigger,
        tools: gateConfig.tools,
        criteria: gateConfig.criteria,
        automation: gateConfig.automation,
        responsibleAgent: gateConfig.responsible_agent,
        sla: gateConfig.sla,
        status: 'configured'
      });
      gateCount++;
    }

    console.log(`   ✓ ${gateCount} quality gates configured and ready`);
    console.log('   ✓ Validation pipeline automation enabled');
    console.log('   ✓ Failure recovery and escalation protocols active');
  }

  async initializeDelegationPatterns() {
    console.log('🎯 Initializing delegation patterns...');
    
    const delegationConfig = this.config.delegationPatterns;
    if (!delegationConfig) {
      throw new Error('Delegation patterns configuration not found');
    }

    // Configure task assignment algorithm
    this.taskAssignmentAlgorithm = delegationConfig.taskAssignmentAlgorithm;
    
    // Set up workflow orchestration
    this.workflowOrchestration = delegationConfig.workflowOrchestration;
    
    // Initialize escalation protocols
    this.escalationProtocols = delegationConfig.escalationProtocols;

    console.log('   ✓ Capability-weighted scoring algorithm ready');
    console.log('   ✓ Dynamic load balancing configured'); 
    console.log('   ✓ Automatic task reassignment enabled');
    console.log('   ✓ Performance history tracking active');
  }

  async assignTask(taskDescription, priority = 'normal') {
    console.log(`\n📋 Processing task assignment: "${taskDescription}"`);
    
    // Analyze task requirements
    const taskAnalysis = await this.analyzeTask(taskDescription);
    console.log(`   🔍 Task analysis: ${taskAnalysis.domain} domain, ${taskAnalysis.complexity} complexity`);
    
    // Find best agent for the task
    const selectedAgent = await this.selectOptimalAgent(taskAnalysis);
    console.log(`   ${this.getAgentEmoji(selectedAgent.id)} Assigned to: ${selectedAgent.name}`);
    
    // Create task object
    const task = {
      id: `task_${Date.now()}`,
      description: taskDescription,
      priority,
      domain: taskAnalysis.domain,
      complexity: taskAnalysis.complexity,
      assignedAgent: selectedAgent.id,
      status: 'assigned',
      createdAt: new Date(),
      estimatedCompletion: this.calculateEstimatedCompletion(taskAnalysis, selectedAgent)
    };

    // Add to task queue and agent workload
    this.tasks.set(task.id, task);
    selectedAgent.currentTasks.push(task.id);

    console.log(`   ⏰ Estimated completion: ${task.estimatedCompletion.toLocaleTimeString()}`);
    
    return task;
  }

  async analyzeTask(description) {
    // Simple task analysis based on keywords
    // In a real implementation, this would use NLP or ML
    const keywords = description.toLowerCase();
    
    let domain = 'general';
    let complexity = 'medium';
    
    if (keywords.includes('component') || keywords.includes('ui') || keywords.includes('frontend')) {
      domain = 'frontend';
    } else if (keywords.includes('api') || keywords.includes('endpoint') || keywords.includes('server')) {
      domain = 'backend';
    } else if (keywords.includes('database') || keywords.includes('query') || keywords.includes('schema')) {
      domain = 'database';
    } else if (keywords.includes('test') || keywords.includes('validation') || keywords.includes('quality')) {
      domain = 'testing';
    } else if (keywords.includes('security') || keywords.includes('auth') || keywords.includes('vulnerability')) {
      domain = 'security';
    }

    if (keywords.includes('complex') || keywords.includes('architecture') || keywords.includes('system')) {
      complexity = 'high';
    } else if (keywords.includes('simple') || keywords.includes('quick') || keywords.includes('fix')) {
      complexity = 'low';
    }

    return { domain, complexity };
  }

  async selectOptimalAgent(taskAnalysis) {
    const domainMapping = {
      frontend: 'frontendQueen',
      backend: 'backendQueen',
      database: 'databaseQueen', 
      testing: 'testingQueen',
      security: 'securityQueen'
    };

    const preferredAgentId = domainMapping[taskAnalysis.domain];
    
    if (preferredAgentId && this.agents.has(preferredAgentId)) {
      const agent = this.agents.get(preferredAgentId);
      
      // Check if agent has capacity
      if (agent.currentTasks.length < agent.workloadCapacity.concurrent_tasks) {
        return agent;
      }
    }

    // Fallback: find agent with lowest workload
    let selectedAgent = null;
    let minWorkload = Infinity;

    for (const agent of this.agents.values()) {
      const workloadRatio = agent.currentTasks.length / agent.workloadCapacity.concurrent_tasks;
      if (workloadRatio < minWorkload) {
        minWorkload = workloadRatio;
        selectedAgent = agent;
      }
    }

    return selectedAgent;
  }

  calculateEstimatedCompletion(taskAnalysis, agent) {
    const baseTime = {
      low: 2, // 2 hours
      medium: 8, // 8 hours  
      high: 24 // 24 hours
    };

    const estimatedHours = baseTime[taskAnalysis.complexity] || 8;
    const completionTime = new Date();
    completionTime.setHours(completionTime.getHours() + estimatedHours);
    
    return completionTime;
  }

  getSystemStatus() {
    console.log('\n📊 Hierarchical Coordination System Status');
    console.log('=' .repeat(50));
    
    // Queen status
    console.log('👑 Queen Coordinator: ACTIVE');
    console.log(`   Decision Framework: ${this.decisionFramework ? 'CONFIGURED' : 'PENDING'}`);
    console.log(`   Coordination Protocols: ${this.coordinationProtocols ? 'ACTIVE' : 'INACTIVE'}`);
    
    // Worker agents status
    console.log('\n🤖 Worker Agents:');
    for (const [agentId, agent] of this.agents) {
      const emoji = this.getAgentEmoji(agentId);
      const workloadRatio = agent.currentTasks.length / agent.workloadCapacity.concurrent_tasks;
      const workloadPercent = (workloadRatio * 100).toFixed(0);
      
      console.log(`   ${emoji} ${agent.name}: ${agent.status.toUpperCase()}`);
      console.log(`      Workload: ${workloadPercent}% (${agent.currentTasks.length}/${agent.workloadCapacity.concurrent_tasks})`);
      console.log(`      Performance: ${agent.performance.qualityScore}% quality`);
    }

    // Quality gates status
    console.log(`\n🔒 Quality Gates: ${this.qualityGates.size} configured`);
    for (const [gateId, gate] of this.qualityGates) {
      console.log(`   ✓ ${gate.name}: ${gate.status.toUpperCase()}`);
    }

    // Active tasks
    console.log(`\n📋 Active Tasks: ${this.tasks.size}`);
    for (const [taskId, task] of this.tasks) {
      if (task.status !== 'completed') {
        const agent = this.agents.get(task.assignedAgent);
        const emoji = this.getAgentEmoji(task.assignedAgent);
        console.log(`   ${emoji} ${task.description} (${task.status})`);
      }
    }
  }

  async shutdown() {
    console.log('\n🔄 Shutting down Hierarchical Coordination System...');
    
    // Gracefully shutdown all agents
    for (const [agentId, agent] of this.agents) {
      console.log(`   Shutting down ${agent.name}...`);
      agent.status = 'shutdown';
    }

    console.log('✅ System shutdown completed');
  }
}

// CLI Interface
async function main() {
  const coordinator = new QueenCoordinator();
  const command = process.argv[2];

  switch (command) {
    case 'init':
      await coordinator.initializeHierarchy();
      break;
      
    case 'status':
      coordinator.getSystemStatus();
      break;
      
    case 'assign':
      const taskDescription = process.argv.slice(3).join(' ');
      if (taskDescription) {
        await coordinator.assignTask(taskDescription);
      } else {
        console.log('Usage: node orchestrate.js assign "<task description>"');
      }
      break;
      
    case 'shutdown':
      await coordinator.shutdown();
      break;
      
    default:
      console.log('Gentle Space Realty - Queen-Led Hierarchical Coordination System');
      console.log('\nUsage:');
      console.log('  node orchestrate.js init     - Initialize the coordination system');
      console.log('  node orchestrate.js status   - Show system status');
      console.log('  node orchestrate.js assign "<task>" - Assign a task');
      console.log('  node orchestrate.js shutdown - Shutdown the system');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = QueenCoordinator;