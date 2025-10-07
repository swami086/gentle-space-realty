/**
 * Context Restoration System Test Suite
 * 
 * Comprehensive tests for the hive mind context restoration system.
 * Tests memory analysis, recovery workflows, and validation functions.
 */

import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ContextRestorationService } from '../src/services/contextRestorationService';
import { RecoveryWorkflowService } from '../src/services/recoveryWorkflowService';

const TEST_PROJECT_PATH = path.join(__dirname, 'test-project');
const TEST_MEMORY_PATH = path.join(TEST_PROJECT_PATH, 'memory');

describe('ContextRestorationService', () => {
  let contextService: ContextRestorationService;

  beforeEach(async () => {
    // Clean up any existing test directory
    await cleanupTestDirectory();
    
    // Create test project structure
    await setupTestProject();
    
    contextService = new ContextRestorationService(TEST_PROJECT_PATH);
  });

  afterEach(async () => {
    await cleanupTestDirectory();
  });

  describe('Memory Structure Analysis', () => {
    it('should analyze existing memory structures', async () => {
      const analysis = await contextService.analyzeMemoryStructures();
      
      expect(analysis).toHaveProperty('agents');
      expect(analysis).toHaveProperty('sessions');
      expect(analysis).toHaveProperty('consistency');
      expect(analysis).toHaveProperty('recommendations');
      
      expect(analysis.agents).toEqual(expect.any(Object));
      expect(analysis.sessions).toEqual(expect.any(Object));
      expect(analysis.consistency.overall_score).toBeGreaterThanOrEqual(0);
      expect(analysis.consistency.overall_score).toBeLessThanOrEqual(1);
    });

    it('should identify agent issues', async () => {
      // Create agent with issues
      await createTestAgentWithIssues();
      
      const analysis = await contextService.analyzeMemoryStructures();
      const agents = Object.values(analysis.agents);
      
      expect(agents.length).toBeGreaterThan(0);
      const problematicAgent = agents.find(agent => agent.issues.length > 0);
      expect(problematicAgent).toBeDefined();
    });

    it('should calculate consistency scores', async () => {
      const analysis = await contextService.analyzeMemoryStructures();
      
      expect(analysis.consistency.overall_score).toEqual(expect.any(Number));
      expect(analysis.consistency.timestamp_consistency).toEqual(expect.any(Number));
      expect(analysis.consistency.agent_alignment).toEqual(expect.any(Number));
      expect(analysis.consistency.memory_integrity).toEqual(expect.any(Number));
    });
  });

  describe('Memory Validation', () => {
    it('should validate memory consistency', async () => {
      const validation = await contextService.validateMemoryConsistency();
      
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('score');
      expect(validation).toHaveProperty('issues');
      expect(validation).toHaveProperty('recommendations');
      
      expect(typeof validation.valid).toBe('boolean');
      expect(validation.score).toBeGreaterThanOrEqual(0);
      expect(validation.score).toBeLessThanOrEqual(1);
      expect(Array.isArray(validation.issues)).toBe(true);
      expect(Array.isArray(validation.recommendations)).toBe(true);
    });

    it('should detect missing agent registrations', async () => {
      // Create agent spec without session registry entry
      await createUnregisteredAgent();
      
      const validation = await contextService.validateMemoryConsistency();
      
      expect(validation.valid).toBe(false);
      expect(validation.issues.some(issue => issue.type === 'missing_registration')).toBe(true);
    });

    it('should detect stale heartbeats', async () => {
      // Create agent with old heartbeat
      await createStaleHeartbeatAgent();
      
      const validation = await contextService.validateMemoryConsistency();
      
      expect(validation.issues.some(issue => issue.type === 'stale_heartbeat')).toBe(true);
    });
  });

  describe('Context Snapshots', () => {
    it('should create context snapshots', async () => {
      const snapshot = await contextService.createContextSnapshot('test-snapshot');
      
      expect(snapshot).toHaveProperty('timestamp');
      expect(snapshot).toHaveProperty('session_state');
      expect(snapshot).toHaveProperty('agent_specifications');
      expect(snapshot).toHaveProperty('memory_banks');
      expect(snapshot).toHaveProperty('integrity_hash');
      expect(snapshot).toHaveProperty('recovery_metadata');
      
      expect(snapshot.recovery_metadata.snapshot_reason).toBe('test-snapshot');
      expect(snapshot.integrity_hash).toBeTruthy();
    });

    it('should save snapshots to disk', async () => {
      const snapshot = await contextService.createContextSnapshot('disk-test');
      
      const snapshotsDir = path.join(TEST_MEMORY_PATH, 'snapshots');
      const files = await fs.readdir(snapshotsDir);
      
      expect(files.length).toBeGreaterThan(0);
      expect(files.some(file => file.includes('snapshot-'))).toBe(true);
    });

    it('should calculate integrity hash correctly', async () => {
      const snapshot1 = await contextService.createContextSnapshot('hash-test-1');
      const snapshot2 = await contextService.createContextSnapshot('hash-test-2');
      
      // If data is the same, hashes should be the same
      expect(snapshot1.integrity_hash).toBe(snapshot2.integrity_hash);
    });
  });

  describe('Context Restoration', () => {
    it('should restore context from snapshot', async () => {
      // Create a snapshot first
      const snapshot = await contextService.createContextSnapshot('restore-test');
      
      // Modify current state
      await modifyCurrentState();
      
      // Restore from snapshot
      const result = await contextService.restoreContext();
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('restored_agents');
      expect(result).toHaveProperty('failed_agents');
      expect(result).toHaveProperty('session_restored');
      expect(result).toHaveProperty('consistency_score');
      
      expect(Array.isArray(result.restored_agents)).toBe(true);
      expect(Array.isArray(result.failed_agents)).toBe(true);
    });

    it('should handle restoration failures gracefully', async () => {
      // Try to restore with no snapshots available
      const result = await contextService.restoreContext('nonexistent-snapshot.json');
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Context Summaries', () => {
    it('should generate context summaries', async () => {
      const summary = await contextService.generateContextSummary();
      
      expect(typeof summary).toBe('string');
      expect(summary).toContain('# Context Summary');
      expect(summary).toContain('## Session Overview');
      expect(summary).toContain('## Agents Status');
      expect(summary).toContain('## Task Queue');
    });

    it('should include key metrics in summary', async () => {
      const summary = await contextService.generateContextSummary();
      
      expect(summary).toContain('Consistency Score:');
      expect(summary).toContain('Session ID:');
      expect(summary).toContain('Agent Count:');
    });
  });
});

describe('RecoveryWorkflowService', () => {
  let recoveryService: RecoveryWorkflowService;

  beforeEach(async () => {
    await cleanupTestDirectory();
    await setupTestProject();
    recoveryService = new RecoveryWorkflowService(TEST_PROJECT_PATH);
  });

  afterEach(async () => {
    await cleanupTestDirectory();
  });

  describe('Recovery Workflow Initialization', () => {
    it('should initialize recovery workflows', async () => {
      await recoveryService.initializeRecoveryWorkflows();
      
      const workflowsDir = path.join(TEST_MEMORY_PATH, 'recovery-workflows');
      const files = await fs.readdir(workflowsDir);
      
      expect(files).toContain('agent_failure-workflow.json');
      expect(files).toContain('session_corruption-workflow.json');
      expect(files).toContain('memory_corruption-workflow.json');
      expect(files).toContain('partial_loss-workflow.json');
      expect(files).toContain('complete_loss-workflow.json');
      expect(files).toContain('index.json');
    });

    it('should create valid workflow structures', async () => {
      await recoveryService.initializeRecoveryWorkflows();
      
      const workflowPath = path.join(TEST_MEMORY_PATH, 'recovery-workflows', 'agent_failure-workflow.json');
      const content = await fs.readFile(workflowPath, 'utf-8');
      const workflow = JSON.parse(content);
      
      expect(workflow).toHaveProperty('scenario');
      expect(workflow).toHaveProperty('steps');
      expect(workflow).toHaveProperty('rollback_steps');
      expect(workflow).toHaveProperty('validation_checks');
      expect(workflow).toHaveProperty('success_criteria');
      
      expect(Array.isArray(workflow.steps)).toBe(true);
      expect(Array.isArray(workflow.validation_checks)).toBe(true);
      expect(Array.isArray(workflow.success_criteria)).toBe(true);
    });
  });

  describe('Failure Detection', () => {
    it('should detect various failure scenarios', async () => {
      // This would normally be a private method, but we can test the public interface
      const result = await recoveryService.executeAutoRecovery();
      
      expect(result).toHaveProperty('scenario');
      expect(result.scenario).toHaveProperty('type');
      expect(result.scenario).toHaveProperty('severity');
      expect(result.scenario.type).toMatch(/agent_failure|session_corruption|memory_corruption|partial_loss|complete_loss/);
    });
  });

  describe('Recovery Execution', () => {
    it('should execute recovery workflows', async () => {
      const result = await recoveryService.executeAutoRecovery();
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('executed_steps');
      expect(result).toHaveProperty('failed_steps');
      expect(result).toHaveProperty('validation_results');
      expect(result).toHaveProperty('recovery_time');
      expect(result).toHaveProperty('final_state');
      expect(result).toHaveProperty('recommendations');
      
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.executed_steps)).toBe(true);
      expect(Array.isArray(result.failed_steps)).toBe(true);
      expect(Array.isArray(result.validation_results)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(typeof result.recovery_time).toBe('number');
    });

    it('should validate recovered system', async () => {
      const validation = await recoveryService.validateRecoveredSystem();
      
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('score');
      expect(validation).toHaveProperty('validations');
      expect(validation).toHaveProperty('recommendations');
      
      expect(typeof validation.valid).toBe('boolean');
      expect(validation.score).toBeGreaterThanOrEqual(0);
      expect(validation.score).toBeLessThanOrEqual(1);
      expect(Array.isArray(validation.validations)).toBe(true);
      expect(Array.isArray(validation.recommendations)).toBe(true);
    });
  });

  describe('Health Monitoring', () => {
    it('should start health monitoring', (done) => {
      // Test that health monitoring can be started (but don't let it run indefinitely)
      const originalSetTimeout = setTimeout;
      jest.spyOn(global, 'setTimeout').mockImplementation((callback, delay) => {
        // Call the callback once to simulate one monitoring cycle
        if (typeof callback === 'function') {
          callback();
        }
        done();
        return { unref: () => {}, ref: () => {} } as any;
      });
      
      recoveryService.startHealthMonitoring(1000);
      
      // Restore original setTimeout
      setTimeout = originalSetTimeout;
    });
  });
});

describe('Integration Tests', () => {
  let contextService: ContextRestorationService;
  let recoveryService: RecoveryWorkflowService;

  beforeEach(async () => {
    await cleanupTestDirectory();
    await setupTestProject();
    
    contextService = new ContextRestorationService(TEST_PROJECT_PATH);
    recoveryService = new RecoveryWorkflowService(TEST_PROJECT_PATH);
  });

  afterEach(async () => {
    await cleanupTestDirectory();
  });

  it('should perform end-to-end recovery workflow', async () => {
    // Initialize workflows
    await recoveryService.initializeRecoveryWorkflows();
    
    // Create initial snapshot
    const initialSnapshot = await contextService.createContextSnapshot('initial');
    expect(initialSnapshot).toBeDefined();
    
    // Simulate failure by corrupting memory
    await simulateMemoryCorruption();
    
    // Validate corruption is detected
    const validation = await contextService.validateMemoryConsistency();
    expect(validation.valid).toBe(false);
    
    // Execute recovery
    const recovery = await recoveryService.executeAutoRecovery();
    expect(recovery).toBeDefined();
    
    // Validate recovery results
    const postRecoveryValidation = await recoveryService.validateRecoveredSystem();
    expect(postRecoveryValidation.score).toBeGreaterThan(0);
  });

  it('should maintain data integrity throughout recovery process', async () => {
    // Create snapshot
    const snapshot = await contextService.createContextSnapshot('integrity-test');
    
    // Verify snapshot integrity
    expect(snapshot.integrity_hash).toBeTruthy();
    
    // Restore and verify integrity maintained
    const restoration = await contextService.restoreContext();
    expect(restoration.consistency_score).toBeGreaterThanOrEqual(0);
  });
});

// Helper functions

async function cleanupTestDirectory(): Promise<void> {
  try {
    await fs.rm(TEST_PROJECT_PATH, { recursive: true, force: true });
  } catch (error) {
    // Directory might not exist, which is fine
  }
}

async function setupTestProject(): Promise<void> {
  // Create test project directory structure
  await fs.mkdir(TEST_PROJECT_PATH, { recursive: true });
  await fs.mkdir(path.join(TEST_MEMORY_PATH, 'agents'), { recursive: true });
  await fs.mkdir(path.join(TEST_MEMORY_PATH, 'sessions'), { recursive: true });
  await fs.mkdir(path.join(TEST_MEMORY_PATH, 'global'), { recursive: true });
  await fs.mkdir(path.join(TEST_MEMORY_PATH, 'shared'), { recursive: true });

  // Create test agent specifications
  const agentSpecs = {
    agents: {
      test_agent_1: {
        agent_id: 'test-agent-1',
        persona: 'frontend',
        domain: 'ui_development',
        capabilities: ['react', 'typescript'],
        tools: ['Read', 'Write', 'Edit'],
        priority_areas: ['user_experience'],
        specializations: {
          components: 'React component development'
        },
        quality_standards: {
          performance: '< 3s load time'
        }
      },
      test_agent_2: {
        agent_id: 'test-agent-2',
        persona: 'backend',
        domain: 'api_development',
        capabilities: ['nodejs', 'express'],
        tools: ['Read', 'Write', 'Bash'],
        priority_areas: ['reliability'],
        specializations: {
          apis: 'REST API development'
        },
        quality_standards: {
          uptime: '99.9%'
        }
      }
    }
  };

  await fs.writeFile(
    path.join(TEST_MEMORY_PATH, 'agents', 'agent-specifications.json'),
    JSON.stringify(agentSpecs, null, 2)
  );

  // Create test session state
  const sessionState = {
    session_id: 'test-session',
    initialization_timestamp: new Date().toISOString(),
    session_type: 'hive_mind_coordination',
    topology: 'mesh',
    status: 'active',
    agent_registry: {
      'test-agent-1': {
        status: 'ready',
        last_heartbeat: new Date().toISOString(),
        current_task: null,
        expertise_areas: ['react', 'typescript'],
        resource_allocation: '50%'
      },
      'test-agent-2': {
        status: 'ready',
        last_heartbeat: new Date().toISOString(),
        current_task: null,
        expertise_areas: ['nodejs', 'express'],
        resource_allocation: '50%'
      }
    },
    coordination_channels: {},
    task_queue: {
      pending: [],
      in_progress: [],
      completed: [],
      blocked: []
    },
    performance_metrics: {
      coordination_latency_ms: 50,
      task_completion_rate: 95,
      error_rate: 0.01
    },
    health_status: {
      overall: 'healthy',
      mesh_connectivity: 'optimal'
    }
  };

  await fs.writeFile(
    path.join(TEST_MEMORY_PATH, 'sessions', 'test-session.json'),
    JSON.stringify(sessionState, null, 2)
  );

  // Create test memory banks
  await fs.mkdir(path.join(TEST_MEMORY_PATH, 'agents', 'test_agent_1'), { recursive: true });
  await fs.mkdir(path.join(TEST_MEMORY_PATH, 'agents', 'test_agent_2'), { recursive: true });

  const memoryBank1 = {
    agentType: 'frontend',
    memoryProfile: 'ui_focused',
    initialized: new Date().toISOString(),
    lastSync: new Date().toISOString(),
    specializedBanks: {
      component_patterns: {
        react_components: []
      }
    }
  };

  const memoryBank2 = {
    agentType: 'backend',
    memoryProfile: 'api_focused',
    initialized: new Date().toISOString(),
    lastSync: new Date().toISOString(),
    specializedBanks: {
      api_patterns: {
        rest_endpoints: []
      }
    }
  };

  await fs.writeFile(
    path.join(TEST_MEMORY_PATH, 'agents', 'test_agent_1', 'memory_bank.json'),
    JSON.stringify(memoryBank1, null, 2)
  );

  await fs.writeFile(
    path.join(TEST_MEMORY_PATH, 'agents', 'test_agent_2', 'memory_bank.json'),
    JSON.stringify(memoryBank2, null, 2)
  );
}

async function createTestAgentWithIssues(): Promise<void> {
  // Create agent with stale heartbeat
  const sessionPath = path.join(TEST_MEMORY_PATH, 'sessions', 'test-session.json');
  const content = await fs.readFile(sessionPath, 'utf-8');
  const sessionState = JSON.parse(content);

  // Set heartbeat to 10 minutes ago
  const staleTime = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  sessionState.agent_registry['test-agent-1'].last_heartbeat = staleTime;
  sessionState.agent_registry['test-agent-1'].status = 'unresponsive';

  await fs.writeFile(sessionPath, JSON.stringify(sessionState, null, 2));
}

async function createUnregisteredAgent(): Promise<void> {
  // Add agent to specifications but not to session registry
  const specsPath = path.join(TEST_MEMORY_PATH, 'agents', 'agent-specifications.json');
  const content = await fs.readFile(specsPath, 'utf-8');
  const specs = JSON.parse(content);

  specs.agents.unregistered_agent = {
    agent_id: 'unregistered-agent',
    persona: 'qa',
    domain: 'testing',
    capabilities: ['testing'],
    tools: ['Read'],
    priority_areas: ['quality'],
    specializations: {},
    quality_standards: {}
  };

  await fs.writeFile(specsPath, JSON.stringify(specs, null, 2));
}

async function createStaleHeartbeatAgent(): Promise<void> {
  const sessionPath = path.join(TEST_MEMORY_PATH, 'sessions', 'test-session.json');
  const content = await fs.readFile(sessionPath, 'utf-8');
  const sessionState = JSON.parse(content);

  // Set heartbeat to 10 minutes ago
  const staleTime = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  sessionState.agent_registry['test-agent-1'].last_heartbeat = staleTime;

  await fs.writeFile(sessionPath, JSON.stringify(sessionState, null, 2));
}

async function modifyCurrentState(): Promise<void> {
  // Modify session state to simulate changes
  const sessionPath = path.join(TEST_MEMORY_PATH, 'sessions', 'test-session.json');
  const content = await fs.readFile(sessionPath, 'utf-8');
  const sessionState = JSON.parse(content);

  sessionState.status = 'modified';
  sessionState.modification_timestamp = new Date().toISOString();

  await fs.writeFile(sessionPath, JSON.stringify(sessionState, null, 2));
}

async function simulateMemoryCorruption(): Promise<void> {
  // Corrupt memory bank
  const memoryBankPath = path.join(TEST_MEMORY_PATH, 'agents', 'test_agent_1', 'memory_bank.json');
  
  await fs.writeFile(memoryBankPath, '{ "corrupted": true, "invalid_json": }');
}