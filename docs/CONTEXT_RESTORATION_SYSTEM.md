# Context Restoration System

A comprehensive context restoration system for recovering lost hive mind state, with advanced algorithms for memory reconstruction, session validation, and automatic recovery workflows.

## Overview

The Context Restoration System provides robust capabilities for:
- **Memory Structure Analysis**: Parse and analyze existing memory banks and session data
- **Context Reconstruction**: Reconstruct agent states and decision history from fragmented data
- **Session State Validation**: Validate memory consistency across sessions with integrity checks
- **Automatic Recovery**: Self-healing workflows for various failure scenarios
- **Rollback Points**: Create snapshots and restore to known good states
- **Memory Integrity**: Comprehensive validation and consistency checks

## Architecture

```
Context Restoration System
├── ContextRestorationService     # Core restoration logic
├── RecoveryWorkflowService      # Automatic recovery workflows  
├── CLI Interface                # Command-line tools
├── Test Suite                   # Comprehensive test coverage
└── Memory Structures            # Analysis of existing memory layout
```

## Key Features

### 🔍 Memory Structure Analysis
- **Agent State Analysis**: Parse and validate individual agent memory banks
- **Session State Reconstruction**: Rebuild session coordination state
- **Dependency Mapping**: Identify relationships between agents and tasks
- **Consistency Scoring**: Calculate overall system health metrics

### 🔄 Context Reconstruction
- **State Rebuilding**: Reconstruct agent states from partial data
- **Decision History**: Recover decision trees and reasoning chains
- **Task Queue Recovery**: Restore pending, active, and completed tasks
- **Coordination Channels**: Rebuild inter-agent communication state

### ✅ Session State Validation
- **Memory Consistency**: Validate data consistency across all components
- **Agent Alignment**: Ensure agent specifications match session registry
- **Timestamp Validation**: Verify temporal consistency of state data
- **Integrity Checking**: Calculate and verify cryptographic hashes

### 🚨 Automatic Recovery Workflows
- **Failure Detection**: Identify and classify different failure scenarios
- **Recovery Strategies**: Execute appropriate recovery workflows
- **Validation Gates**: Comprehensive post-recovery validation
- **Rollback Capability**: Automatic rollback on recovery failure

### 💾 Rollback Point System
- **Snapshot Creation**: Create comprehensive system state snapshots  
- **Integrity Verification**: Cryptographic verification of snapshot data
- **Selective Restoration**: Restore specific components or full system
- **Metadata Tracking**: Track snapshot reasons and recovery metadata

## Usage

### Command Line Interface

```bash
# Analyze current memory structures
npx ts-node scripts/context-restoration-cli.ts analyze --verbose

# Validate memory consistency
npx ts-node scripts/context-restoration-cli.ts validate --json

# Create a context snapshot
npx ts-node scripts/context-restoration-cli.ts snapshot "pre-deployment-backup"

# Restore from latest snapshot
npx ts-node scripts/context-restoration-cli.ts restore --force

# Generate context summary
npx ts-node scripts/context-restoration-cli.ts summary

# Execute automatic recovery
npx ts-node scripts/context-restoration-cli.ts recover --verbose

# Check system health
npx ts-node scripts/context-restoration-cli.ts health

# Start health monitoring
npx ts-node scripts/context-restoration-cli.ts monitor --interval 30

# Initialize recovery workflows
npx ts-node scripts/context-restoration-cli.ts init-workflows
```

### Programmatic Usage

```typescript
import { ContextRestorationService, RecoveryWorkflowService } from './src/services';

// Initialize services
const contextService = new ContextRestorationService();
const recoveryService = new RecoveryWorkflowService();

// Analyze memory structures
const analysis = await contextService.analyzeMemoryStructures();
console.log(`Consistency score: ${analysis.consistency.overall_score}`);

// Validate memory consistency
const validation = await contextService.validateMemoryConsistency();
if (!validation.valid) {
  console.log('Issues found:', validation.issues);
}

// Create snapshot
const snapshot = await contextService.createContextSnapshot('manual-backup');
console.log(`Snapshot created: ${snapshot.timestamp}`);

// Execute recovery if needed
if (!validation.valid) {
  const recovery = await recoveryService.executeAutoRecovery();
  console.log(`Recovery ${recovery.success ? 'succeeded' : 'failed'}`);
}

// Generate summary
const summary = await contextService.generateContextSummary();
console.log(summary);
```

## Memory Structure Analysis

The system analyzes the following memory structures:

### Agent Memory Banks (`/memory/agents/`)
- **Agent Specifications**: Role definitions and capabilities
- **Memory Banks**: Individual agent persistent state
- **Coordination State**: Inter-agent communication history

### Session State (`/memory/sessions/`)  
- **Session Registry**: Active agent registrations
- **Task Queues**: Pending, active, completed, and blocked tasks
- **Performance Metrics**: System health and coordination metrics
- **Coordination Channels**: Communication channel states

### Global Memory (`/memory/global/` & `/memory/shared/`)
- **Shared Knowledge**: Cross-agent shared information
- **System Configuration**: Global system settings
- **Coordination Metadata**: System-wide coordination data

## Recovery Workflows

### Failure Scenarios

The system handles five primary failure scenarios:

1. **Agent Failure** (Low Severity)
   - Individual agents become unresponsive
   - Recovery: Agent restart and state synchronization
   - Estimated recovery time: 15 seconds

2. **Session Corruption** (Medium Severity)  
   - Session state becomes inconsistent
   - Recovery: Session state restoration from snapshot
   - Estimated recovery time: 30 seconds

3. **Memory Corruption** (High Severity)
   - Agent memory banks become corrupted
   - Recovery: Memory bank restoration and agent repair
   - Estimated recovery time: 2 minutes

4. **Partial Loss** (Medium Severity)
   - Multiple agents affected, some data lost
   - Recovery: Selective restoration and synchronization
   - Estimated recovery time: 1 minute

5. **Complete Loss** (Critical Severity)
   - Full system state lost
   - Recovery: Complete restoration from latest snapshot
   - Estimated recovery time: 3 minutes

### Recovery Workflow Structure

Each recovery workflow includes:
- **Scenario Definition**: Failure type, severity, affected components
- **Recovery Steps**: Ordered sequence of recovery actions  
- **Rollback Steps**: Actions to undo changes if recovery fails
- **Validation Checks**: Post-recovery system validation
- **Success Criteria**: Requirements for successful recovery

### Recovery Actions

- **backup**: Create system state backup
- **restore**: Restore from snapshot or backup
- **validate**: Perform consistency and integrity checks
- **reinitialize**: Restart and reinitialize components
- **repair**: Fix corrupted data structures
- **notify**: Send notifications and alerts

## Validation Framework

### Consistency Checks

The system performs comprehensive consistency validation:

- **Agent Registry Consistency**: Ensure all registered agents have specifications
- **Memory Bank Integrity**: Validate memory bank structure and content
- **Timestamp Consistency**: Verify temporal consistency across components
- **Cross-Reference Validation**: Ensure data references are valid
- **Heartbeat Freshness**: Check agent responsiveness and communication

### Integrity Verification

- **Cryptographic Hashes**: SHA-256 hashes for data integrity
- **Structural Validation**: JSON schema validation for data structures  
- **Relationship Validation**: Verify data relationships and dependencies
- **Performance Metrics**: Validate system performance within thresholds

## Configuration

### Recovery Workflow Configuration

```typescript
interface RecoveryPlan {
  scenario: FailureScenario;
  steps: RecoveryStep[];
  rollback_steps: RecoveryStep[];  
  validation_checks: ValidationCheck[];
  success_criteria: string[];
}

interface RecoveryStep {
  id: string;
  description: string;
  action: 'backup' | 'restore' | 'validate' | 'reinitialize' | 'repair' | 'notify';
  parameters: Record<string, any>;
  timeout: number;
  retry_count: number;
  dependencies: string[];
  failure_mode: 'continue' | 'rollback' | 'escalate';
}
```

### Validation Configuration

```typescript
interface ValidationCheck {
  id: string;
  description: string;
  type: 'integrity' | 'consistency' | 'performance' | 'functionality';
  check_function: string;
  pass_criteria: any;
  critical: boolean;
}
```

## Health Monitoring

The system provides continuous health monitoring with:

- **Real-time Health Checks**: Periodic system health evaluation
- **Automatic Recovery Triggers**: Auto-trigger recovery on critical issues
- **Performance Metrics**: Track system performance and efficiency  
- **Alert Generation**: Generate alerts for various severity levels
- **Historical Tracking**: Maintain health history and trends

### Health Monitoring Configuration

```bash
# Start monitoring with 30-second intervals
npx ts-node scripts/context-restoration-cli.ts monitor --interval 30

# Health check categories
- Memory consistency (every check)
- Agent connectivity (every check)  
- Session integrity (every check)
- Performance metrics (every check)
```

## Testing

### Test Coverage

The system includes comprehensive tests:

- **Unit Tests**: Individual service and method testing
- **Integration Tests**: End-to-end workflow testing
- **Failure Simulation**: Test various failure scenarios
- **Recovery Validation**: Verify recovery workflow execution
- **Performance Testing**: Validate system performance under load

### Running Tests

```bash
# Run all context restoration tests
npm test tests/context-restoration.test.ts

# Run specific test suites
npm test -- --grep "Memory Structure Analysis"
npm test -- --grep "Recovery Workflows"
npm test -- --grep "Integration Tests"
```

## File Structure

```
├── src/services/
│   ├── contextRestorationService.ts    # Core restoration logic
│   └── recoveryWorkflowService.ts       # Recovery workflows
├── scripts/
│   └── context-restoration-cli.ts       # Command-line interface
├── tests/
│   └── context-restoration.test.ts      # Test suite
├── memory/
│   ├── agents/                          # Agent memory banks
│   ├── sessions/                        # Session state
│   ├── snapshots/                       # Context snapshots
│   └── recovery-workflows/              # Recovery workflow definitions
└── docs/
    └── CONTEXT_RESTORATION_SYSTEM.md    # This document
```

## API Reference

### ContextRestorationService

- `analyzeMemoryStructures()` - Analyze existing memory structures
- `validateMemoryConsistency()` - Validate memory consistency  
- `createContextSnapshot(reason?)` - Create system snapshot
- `restoreContext(snapshotPath?)` - Restore from snapshot
- `generateContextSummary(snapshot?)` - Generate readable summary

### RecoveryWorkflowService

- `executeAutoRecovery()` - Execute automatic recovery
- `initializeRecoveryWorkflows()` - Initialize workflow definitions
- `startHealthMonitoring(intervalMs?)` - Start health monitoring
- `validateRecoveredSystem()` - Validate post-recovery state

## Best Practices

### Snapshot Management
- Create snapshots before major changes
- Regular automated snapshots during stable periods
- Retain snapshots with meaningful reasons/descriptions
- Monitor snapshot storage usage

### Recovery Workflows  
- Test recovery workflows in non-production environments
- Customize workflows for specific system configurations
- Monitor recovery success rates and adjust strategies
- Maintain rollback capabilities for all recovery actions

### Health Monitoring
- Configure appropriate monitoring intervals based on system load
- Set up alerting for critical health issues
- Review health trends and patterns regularly
- Tune health thresholds based on system characteristics

### Performance Optimization
- Regular consistency validation during low-traffic periods  
- Batch validation operations when possible
- Monitor validation performance and optimize as needed
- Clean up old snapshots and logs periodically

## Troubleshooting

### Common Issues

**High Memory Usage**
- Reduce snapshot retention period
- Optimize memory bank sizes
- Enable compression for large data structures

**Slow Recovery Times**
- Optimize snapshot sizes
- Parallel recovery operations where possible
- Tune recovery step timeouts

**Validation Failures**
- Check agent heartbeat freshness
- Verify memory bank file permissions
- Validate JSON structure integrity

**Recovery Workflow Failures**
- Check recovery workflow definitions
- Verify rollback step availability
- Monitor recovery step timeouts

### Debug Commands

```bash
# Verbose analysis with debug info
npx ts-node scripts/context-restoration-cli.ts analyze --verbose

# Export analysis to JSON for inspection  
npx ts-node scripts/context-restoration-cli.ts analyze --json --output analysis.json

# Test recovery without execution
npx ts-node scripts/context-restoration-cli.ts recover --dry-run

# Validate specific snapshot
npx ts-node scripts/context-restoration-cli.ts validate --snapshot snapshot-file.json
```

## Contributing

### Development Setup

1. Install dependencies: `npm install`
2. Run tests: `npm test`
3. Build system: `npm run build`
4. Run CLI: `npx ts-node scripts/context-restoration-cli.ts`

### Adding New Recovery Workflows

1. Define workflow in `RecoveryWorkflowService`
2. Add validation checks and success criteria
3. Test workflow with failure simulation
4. Update documentation and CLI help

### Extending Validation

1. Add validation functions to `ContextRestorationService`
2. Define validation criteria and thresholds  
3. Add corresponding CLI commands
4. Include tests for new validation logic

---

*The Context Restoration System provides robust recovery capabilities for hive mind architectures, ensuring system resilience and data integrity in distributed agent environments.*