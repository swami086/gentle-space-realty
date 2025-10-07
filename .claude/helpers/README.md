# Enhanced Checkpoint System with Hive Mind Memory Management

This enhanced checkpoint system provides comprehensive backup and rollback capabilities for hive mind operations with distributed memory management.

## Overview

The system consists of five main components:

1. **Enhanced Standard Checkpoint Hooks** - Extended with memory management
2. **Hive Mind Checkpoint Manager** - Specialized checkpoint management
3. **Memory Monitor** - Real-time monitoring and performance tracking
4. **Rollback System** - Advanced rollback mechanisms with memory restoration
5. **Git-based Checkpoints** - Integration with existing git workflows

## Quick Start

### Setup Infrastructure

```bash
# Setup memory infrastructure
.claude/helpers/standard-checkpoint-hooks.sh setup-infrastructure

# Setup hive mind infrastructure  
.claude/helpers/hive-mind-checkpoint-manager.sh setup-infrastructure

# Setup monitoring
.claude/helpers/memory-monitor.sh setup
```

### Basic Usage

```bash
# Create a checkpoint with memory snapshot
.claude/helpers/standard-checkpoint-hooks.sh post-edit '{"file_path": "src/app.js"}'

# List all checkpoints with memory integration
.claude/helpers/hive-mind-checkpoint-manager.sh list --memory

# Monitor memory status
.claude/helpers/memory-monitor.sh status

# Rollback with memory restoration
.claude/helpers/rollback-system.sh rollback checkpoint-20240130-143022 full
```

## Components

### 1. Enhanced Standard Checkpoint Hooks

Enhanced version of `standard-checkpoint-hooks.sh` with memory management capabilities.

**New Features:**
- Memory snapshots at checkpoint boundaries
- Context preservation triggers
- Memory validation
- Compression for long-running sessions
- Cleanup strategies for expired data

**Usage:**
```bash
# Memory management commands
.claude/helpers/standard-checkpoint-hooks.sh validate-memory
.claude/helpers/standard-checkpoint-hooks.sh compress-memory 7
.claude/helpers/standard-checkpoint-hooks.sh cleanup-memory 30
.claude/helpers/standard-checkpoint-hooks.sh create-snapshot manual
```

### 2. Hive Mind Checkpoint Manager

Specialized checkpoint management for hive mind operations with enhanced memory integration.

**Key Features:**
- Memory-aware checkpoint listing
- Enhanced rollback with memory restoration
- Hive mind status monitoring
- Agent and coordination checkpoint support

**Usage:**
```bash
# List checkpoints with memory filter
.claude/helpers/hive-mind-checkpoint-manager.sh list --memory

# Show enhanced checkpoint details
.claude/helpers/hive-mind-checkpoint-manager.sh show checkpoint-20240130-143022

# Rollback with memory restoration
.claude/helpers/hive-mind-checkpoint-manager.sh rollback checkpoint-20240130-143022 --with-memory

# Hive mind specific operations
.claude/helpers/hive-mind-checkpoint-manager.sh hive-status
.claude/helpers/hive-mind-checkpoint-manager.sh sync-memory
```

### 3. Memory Monitor

Real-time monitoring system for memory usage and performance with automated alerts.

**Features:**
- Real-time memory status monitoring
- Performance metrics tracking
- Health checks with recommendations
- Interactive dashboard
- Automated optimization

**Usage:**
```bash
# Check current memory status
.claude/helpers/memory-monitor.sh status

# Start real-time monitoring
.claude/helpers/memory-monitor.sh monitor 300 --interval 10

# Health check with JSON output
.claude/helpers/memory-monitor.sh health-check --json

# Interactive dashboard
.claude/helpers/memory-monitor.sh dashboard

# Performance analysis
.claude/helpers/memory-monitor.sh performance
```

### 4. Advanced Rollback System

Comprehensive rollback system with granular control over different components.

**Rollback Types:**
- `full` - Complete system rollback (git + memory + hive state)
- `git-only` - Git repository state only, preserve all memory
- `memory-only` - Memory bank and hive context only, preserve git
- `selective` - Interactive selection of components
- `coordination` - Hive coordination state only
- `agents` - Agent states and configurations only

**Usage:**
```bash
# Full system rollback
.claude/helpers/rollback-system.sh rollback checkpoint-20240130-143022 full

# Git-only rollback preserving memory
.claude/helpers/rollback-system.sh rollback checkpoint-20240130-143022 git-only

# Memory-only rollback
.claude/helpers/rollback-system.sh rollback checkpoint-20240130-143022 memory-only

# Preview changes before rollback
.claude/helpers/rollback-system.sh rollback-preview checkpoint-20240130-143022

# Emergency rollback (last N checkpoints)
.claude/helpers/rollback-system.sh emergency-rollback 3

# Create manual rollback point
.claude/helpers/rollback-system.sh create-rollback-point "before-major-refactor"
```

## Memory Management

### Memory Bank Structure

```
.claude/memory-bank/
├── sessions/          # Active memory sessions
├── snapshots/         # Compressed memory snapshots
├── compressed/        # Compressed old sessions
└── temp/             # Temporary processing files
```

### Hive Context Structure

```
.claude/hive-context/
├── agents/           # Agent state information
├── coordination/     # Coordination checkpoints
├── patterns/         # Learned patterns
└── decisions/        # Decision history
```

### Memory Lifecycle

1. **Active Sessions** - Current working memory in `memory-bank/sessions/`
2. **Snapshots** - Point-in-time memory captures in `memory-bank/snapshots/`
3. **Compression** - Old sessions compressed to save space
4. **Cleanup** - Expired data removed based on retention policies

## Automated Triggers

### Context Preservation

- Automatically triggered on file edits
- Task boundary checkpoints
- Session end events
- Critical decision points

### Memory Compression

- Triggered when memory usage exceeds thresholds
- Scheduled compression of old sessions
- Automatic cleanup of expired data

### Monitoring Alerts

- Memory usage warnings (>100MB)
- Critical alerts (>500MB)
- Corrupted file detection
- Performance degradation alerts

## Configuration

### Memory Thresholds

```bash
# In standard-checkpoint-hooks.sh
MEMORY_COMPRESSION_THRESHOLD=50  # MB
MAX_MEMORY_SESSIONS=100

# In memory-monitor.sh
ALERT_THRESHOLD_MB=100
CRITICAL_THRESHOLD_MB=500
```

### Retention Policies

```bash
# Compression after 7 days
compress_memory_sessions 7

# Cleanup after 30 days
perform_memory_cleanup 30
```

## Integration with Existing Systems

### Git Workflow Integration

The enhanced system maintains full compatibility with existing git-based checkpoints while adding memory management capabilities.

### Claude Code Integration

Works seamlessly with Claude Code's existing checkpoint system through the `settings.json` hooks configuration.

### MCP Integration

Supports coordination with MCP servers for distributed hive mind operations.

## Troubleshooting

### Common Issues

1. **Memory Validation Failures**
   ```bash
   .claude/helpers/standard-checkpoint-hooks.sh validate-memory
   ```

2. **High Memory Usage**
   ```bash
   .claude/helpers/memory-monitor.sh optimize
   ```

3. **Corrupted Memory Files**
   ```bash
   .claude/helpers/memory-monitor.sh health-check
   ```

4. **Rollback Failures**
   ```bash
   .claude/helpers/rollback-system.sh rollback-validate checkpoint-id
   ```

### Recovery Procedures

1. **Emergency Recovery**
   ```bash
   .claude/helpers/rollback-system.sh emergency-rollback 1
   ```

2. **Memory State Recovery**
   ```bash
   .claude/helpers/hive-mind-checkpoint-manager.sh restore-memory snapshot-id
   ```

3. **System Health Restoration**
   ```bash
   .claude/helpers/memory-monitor.sh health-check
   .claude/helpers/memory-monitor.sh optimize
   ```

## Performance Monitoring

### Metrics Tracked

- Memory usage and growth rate
- File operation performance
- Compression effectiveness
- Validation response times
- Hive coordination latency

### Dashboard Features

- Real-time memory usage
- Alert history
- Performance trends
- Health status indicators

## Best Practices

1. **Regular Monitoring** - Use the dashboard for ongoing health checks
2. **Proactive Compression** - Enable automatic compression policies
3. **Validation** - Run regular memory validation checks
4. **Backup Strategy** - Maintain multiple rollback points
5. **Performance Optimization** - Monitor and optimize memory usage patterns

## API Reference

### Standard Checkpoint Hooks

- `validate-memory` - Validate current memory state
- `compress-memory [days]` - Compress sessions older than N days
- `cleanup-memory [days]` - Clean up data older than N days
- `create-snapshot [id] [type]` - Create manual memory snapshot
- `setup-infrastructure` - Initialize memory infrastructure

### Hive Mind Checkpoint Manager

- `list [--memory|--hive]` - List checkpoints with filters
- `rollback <id> [--with-memory]` - Enhanced rollback
- `hive-status` - Show hive mind status
- `sync-memory` - Synchronize memory across nodes

### Memory Monitor

- `status [--json]` - Current memory status
- `monitor [duration] [--interval N]` - Real-time monitoring
- `health-check [--json]` - Comprehensive health assessment
- `dashboard` - Interactive monitoring interface

### Rollback System

- `rollback <id> <type>` - Execute rollback
- `rollback-preview <id>` - Preview rollback changes
- `emergency-rollback [steps]` - Emergency recovery
- `create-rollback-point [name]` - Create manual rollback point

## Version History

- **v2.0.0** - Enhanced checkpoint system with hive mind memory management
- **v1.0.0** - Original git-based checkpoint system

## Contributing

When contributing to the checkpoint system:

1. Maintain backward compatibility with existing workflows
2. Follow the established naming conventions for functions and files
3. Include comprehensive error handling and validation
4. Add monitoring and logging for new features
5. Update documentation for any new capabilities