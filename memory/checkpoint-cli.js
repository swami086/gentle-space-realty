#!/usr/bin/env node

const CheckpointIntegration = require('./checkpoint-integration');
const path = require('path');
const fs = require('fs').promises;

/**
 * Command Line Interface for Memory Checkpoint System
 * Provides easy access to checkpoint operations for developers and system administrators
 */
class CheckpointCLI {
  constructor() {
    this.integration = null;
    this.commands = new Map();
    this.setupCommands();
  }

  /**
   * Setup available CLI commands
   */
  setupCommands() {
    this.commands.set('init', {
      description: 'Initialize checkpoint system',
      usage: 'checkpoint-cli init [--memory-dir <path>] [--checkpoint-dir <path>]',
      handler: this.initializeSystem.bind(this)
    });

    this.commands.set('status', {
      description: 'Show checkpoint system status',
      usage: 'checkpoint-cli status',
      handler: this.showStatus.bind(this)
    });

    this.commands.set('create', {
      description: 'Create manual checkpoint',
      usage: 'checkpoint-cli create <description>',
      handler: this.createCheckpoint.bind(this)
    });

    this.commands.set('list', {
      description: 'List available checkpoints',
      usage: 'checkpoint-cli list [--type <type>] [--limit <number>]',
      handler: this.listCheckpoints.bind(this)
    });

    this.commands.set('restore', {
      description: 'Restore from checkpoint',
      usage: 'checkpoint-cli restore <checkpoint-id>',
      handler: this.restoreCheckpoint.bind(this)
    });

    this.commands.set('rollback', {
      description: 'Rollback to checkpoint',
      usage: 'checkpoint-cli rollback <checkpoint-id>',
      handler: this.rollbackToCheckpoint.bind(this)
    });

    this.commands.set('backup', {
      description: 'Create recovery backup',
      usage: 'checkpoint-cli backup',
      handler: this.createBackup.bind(this)
    });

    this.commands.set('recovery', {
      description: 'Perform system recovery',
      usage: 'checkpoint-cli recovery <failure-type>',
      handler: this.performRecovery.bind(this)
    });

    this.commands.set('cleanup', {
      description: 'Clean up old checkpoints',
      usage: 'checkpoint-cli cleanup [--days <number>]',
      handler: this.cleanupCheckpoints.bind(this)
    });

    this.commands.set('metrics', {
      description: 'Show system metrics',
      usage: 'checkpoint-cli metrics',
      handler: this.showMetrics.bind(this)
    });

    this.commands.set('health', {
      description: 'Run health check',
      usage: 'checkpoint-cli health',
      handler: this.runHealthCheck.bind(this)
    });

    this.commands.set('export', {
      description: 'Export checkpoint data',
      usage: 'checkpoint-cli export <checkpoint-id> <output-file>',
      handler: this.exportCheckpoint.bind(this)
    });

    this.commands.set('import', {
      description: 'Import checkpoint data',
      usage: 'checkpoint-cli import <input-file>',
      handler: this.importCheckpoint.bind(this)
    });

    this.commands.set('help', {
      description: 'Show help information',
      usage: 'checkpoint-cli help [command]',
      handler: this.showHelp.bind(this)
    });
  }

  /**
   * Parse command line arguments
   */
  parseArgs(args) {
    const parsed = {\n      command: args[2],\n      args: args.slice(3),\n      flags: {}\n    };\n\n    // Parse flags\n    for (let i = 0; i < parsed.args.length; i++) {\n      if (parsed.args[i].startsWith('--')) {\n        const flagName = parsed.args[i].substring(2);\n        const flagValue = parsed.args[i + 1];\n        \n        if (flagValue && !flagValue.startsWith('--')) {\n          parsed.flags[flagName] = flagValue;\n          parsed.args.splice(i, 2);\n          i--;\n        } else {\n          parsed.flags[flagName] = true;\n          parsed.args.splice(i, 1);\n          i--;\n        }\n      }\n    }\n\n    return parsed;\n  }\n\n  /**\n   * Initialize checkpoint system\n   */\n  async initializeSystem(args, flags) {\n    try {\n      console.log('🚀 Initializing Memory Checkpoint System...');\n      \n      const options = {\n        memoryDir: flags['memory-dir'] || './memory',\n        checkpointDir: flags['checkpoint-dir'] || './memory/checkpoints'\n      };\n      \n      this.integration = new CheckpointIntegration(options);\n      await this.integration.initialize();\n      \n      console.log('✅ Checkpoint system initialized successfully');\n      console.log(`📁 Memory directory: ${options.memoryDir}`);\n      console.log(`💾 Checkpoint directory: ${options.checkpointDir}`);\n      \n    } catch (error) {\n      console.error('❌ Initialization failed:', error.message);\n      process.exit(1);\n    }\n  }\n\n  /**\n   * Show system status\n   */\n  async showStatus() {\n    try {\n      await this.ensureInitialized();\n      \n      const status = this.integration.getStatus();\n      \n      console.log('\\n📊 Memory Checkpoint System Status');\n      console.log('='.repeat(40));\n      \n      console.log('\\n🔧 Integration:');\n      console.log(`  Initialized: ${status.integration.initialized ? '✅' : '❌'}`);\n      console.log(`  Git Integration: ${status.integration.gitIntegration ? '✅' : '❌'}`);\n      console.log(`  Hook Integration: ${status.integration.hookIntegration ? '✅' : '❌'}`);\n      console.log(`  Monitoring: ${status.integration.monitoring ? '✅' : '❌'}`);\n      \n      console.log('\\n📋 Checkpoints:');\n      console.log(`  Health: ${status.checkpoint.healthy ? '🟢 Healthy' : '🔴 Unhealthy'}`);\n      console.log(`  Active Checkpoints: ${status.checkpoint.metrics.activeCheckpoints}`);\n      console.log(`  Current Session: ${status.checkpoint.metrics.currentSession || 'None'}`);\n      console.log(`  Failed Operations: ${status.checkpoint.metrics.failedOperations}`);\n      \n      if (status.checkpoint.warnings.length > 0) {\n        console.log('\\n⚠️  Warnings:');\n        status.checkpoint.warnings.forEach(warning => console.log(`    - ${warning}`));\n      }\n      \n      console.log('\\n🔄 Recovery:');\n      console.log(`  Auto-recovery: ${status.recovery.enabled ? '✅' : '❌'}`);\n      console.log(`  Total Recoveries: ${status.recovery.totalRecoveries}`);\n      console.log(`  Successful Recoveries: ${status.recovery.successfulRecoveries}`);\n      console.log(`  Available Strategies: ${status.recovery.availableStrategies.join(', ')}`);\n      \n      if (status.recovery.lastRecovery) {\n        const lastRecovery = new Date(status.recovery.lastRecovery.timestamp).toISOString();\n        console.log(`  Last Recovery: ${lastRecovery} (${status.recovery.lastRecovery.success ? '✅' : '❌'})`);\n      }\n      \n    } catch (error) {\n      console.error('❌ Status check failed:', error.message);\n      process.exit(1);\n    }\n  }\n\n  /**\n   * Create manual checkpoint\n   */\n  async createCheckpoint(args) {\n    try {\n      if (args.length === 0) {\n        console.error('❌ Please provide a description for the checkpoint');\n        process.exit(1);\n      }\n      \n      await this.ensureInitialized();\n      \n      const description = args.join(' ');\n      console.log(`📋 Creating checkpoint: ${description}`);\n      \n      const checkpointId = await this.integration.createManualCheckpoint(description);\n      \n      console.log(`✅ Checkpoint created successfully`);\n      console.log(`🔑 Checkpoint ID: ${checkpointId}`);\n      \n    } catch (error) {\n      console.error('❌ Checkpoint creation failed:', error.message);\n      process.exit(1);\n    }\n  }\n\n  /**\n   * List available checkpoints\n   */\n  async listCheckpoints(args, flags) {\n    try {\n      await this.ensureInitialized();\n      \n      const stats = this.integration.checkpointSystem.getCheckpointStats();\n      const limit = parseInt(flags.limit) || 10;\n      const typeFilter = flags.type;\n      \n      console.log('\\n📋 Available Checkpoints');\n      console.log('='.repeat(40));\n      \n      console.log(`\\n📊 Summary:`);\n      console.log(`  Total: ${stats.total}`);\n      console.log(`  By Type:`);\n      Object.entries(stats.byType).forEach(([type, count]) => {\n        console.log(`    ${type}: ${count}`);\n      });\n      \n      if (stats.bySession && Object.keys(stats.bySession).length > 0) {\n        console.log(`  By Session:`);\n        Object.entries(stats.bySession).forEach(([session, count]) => {\n          console.log(`    ${session}: ${count}`);\n        });\n      }\n      \n      console.log('\\n📝 Recent Checkpoints:');\n      const checkpoints = Array.from(this.integration.checkpointSystem.activeCheckpoints.values())\n        .filter(cp => !typeFilter || cp.type === typeFilter)\n        .sort((a, b) => b.timestamp - a.timestamp)\n        .slice(0, limit);\n      \n      if (checkpoints.length === 0) {\n        console.log('  No checkpoints found');\n      } else {\n        checkpoints.forEach(cp => {\n          const date = new Date(cp.timestamp).toLocaleString();\n          console.log(`  🔑 ${cp.id}`);\n          console.log(`     Type: ${cp.type}`);\n          console.log(`     Date: ${date}`);\n          console.log(`     Session: ${cp.sessionId || 'N/A'}`);\n          console.log('');\n        });\n      }\n      \n    } catch (error) {\n      console.error('❌ Failed to list checkpoints:', error.message);\n      process.exit(1);\n    }\n  }\n\n  /**\n   * Restore from checkpoint\n   */\n  async restoreCheckpoint(args) {\n    try {\n      if (args.length === 0) {\n        console.error('❌ Please provide a checkpoint ID');\n        process.exit(1);\n      }\n      \n      await this.ensureInitialized();\n      \n      const checkpointId = args[0];\n      console.log(`🔄 Restoring from checkpoint: ${checkpointId}`);\n      \n      await this.integration.checkpointSystem.restoreFromCheckpoint(checkpointId);\n      \n      console.log('✅ Restore completed successfully');\n      \n    } catch (error) {\n      console.error('❌ Restore failed:', error.message);\n      process.exit(1);\n    }\n  }\n\n  /**\n   * Rollback to checkpoint\n   */\n  async rollbackToCheckpoint(args) {\n    try {\n      if (args.length === 0) {\n        console.error('❌ Please provide a checkpoint ID');\n        process.exit(1);\n      }\n      \n      await this.ensureInitialized();\n      \n      const checkpointId = args[0];\n      console.log(`⏪ Rolling back to checkpoint: ${checkpointId}`);\n      console.log('⚠️  This will create a safety checkpoint before rollback');\n      \n      await this.integration.checkpointSystem.rollbackToPoint(checkpointId);\n      \n      console.log('✅ Rollback completed successfully');\n      \n    } catch (error) {\n      console.error('❌ Rollback failed:', error.message);\n      process.exit(1);\n    }\n  }\n\n  /**\n   * Create recovery backup\n   */\n  async createBackup() {\n    try {\n      await this.ensureInitialized();\n      \n      console.log('💾 Creating recovery backup...');\n      \n      await this.integration.recoverySystem.createRecoveryBackups();\n      \n      console.log('✅ Recovery backup created successfully');\n      \n    } catch (error) {\n      console.error('❌ Backup creation failed:', error.message);\n      process.exit(1);\n    }\n  }\n\n  /**\n   * Perform system recovery\n   */\n  async performRecovery(args) {\n    try {\n      if (args.length === 0) {\n        console.error('❌ Please specify failure type');\n        console.log('Available types: memory_corruption, session_failure, agent_memory_failure, coordination_failure, system_failure');\n        process.exit(1);\n      }\n      \n      await this.ensureInitialized();\n      \n      const failureType = args[0];\n      console.log(`🚨 Performing recovery for: ${failureType}`);\n      \n      const result = await this.integration.recoverySystem.performRecovery(failureType, {});\n      \n      console.log('✅ Recovery completed successfully');\n      console.log(`📋 Strategy: ${result.strategy}`);\n      \n      if (result.checkpointId) {\n        console.log(`🔑 Checkpoint: ${result.checkpointId}`);\n      }\n      \n    } catch (error) {\n      console.error('❌ Recovery failed:', error.message);\n      process.exit(1);\n    }\n  }\n\n  /**\n   * Clean up old checkpoints\n   */\n  async cleanupCheckpoints(args, flags) {\n    try {\n      await this.ensureInitialized();\n      \n      const days = parseInt(flags.days) || 7;\n      console.log(`🧹 Cleaning checkpoints older than ${days} days...`);\n      \n      await this.integration.checkpointSystem.cleanupOldCheckpoints();\n      \n      console.log('✅ Cleanup completed successfully');\n      \n    } catch (error) {\n      console.error('❌ Cleanup failed:', error.message);\n      process.exit(1);\n    }\n  }\n\n  /**\n   * Show system metrics\n   */\n  async showMetrics() {\n    try {\n      await this.ensureInitialized();\n      \n      const memoryUsage = await this.integration.checkpointSystem.getMemoryUsage();\n      const memoryMetrics = await this.integration.checkpointSystem.getMemoryMetrics();\n      \n      console.log('\\n📊 System Metrics');\n      console.log('='.repeat(30));\n      \n      console.log('\\n💾 Memory Usage:');\n      console.log(`  Active Checkpoints: ${memoryUsage.checkpoints}`);\n      console.log(`  Compression Cache: ${memoryUsage.compressionCache}`);\n      console.log(`  Total Memory Size: ${this.formatBytes(memoryUsage.totalMemorySize)}`);\n      console.log(`  Compressed Size: ${this.formatBytes(memoryUsage.compressedSize)}`);\n      \n      console.log('\\n🖥️  Process Metrics:');\n      console.log(`  Heap Used: ${this.formatBytes(memoryMetrics.process.heapUsed)}`);\n      console.log(`  Heap Total: ${this.formatBytes(memoryMetrics.process.heapTotal)}`);\n      console.log(`  RSS: ${this.formatBytes(memoryMetrics.process.rss)}`);\n      console.log(`  External: ${this.formatBytes(memoryMetrics.process.external)}`);\n      \n      console.log('\\n📋 Checkpoint Metrics:');\n      console.log(`  Active: ${memoryMetrics.checkpoints.active}`);\n      console.log(`  Compressed: ${memoryMetrics.checkpoints.compressed}`);\n      console.log(`  Session: ${memoryMetrics.checkpoints.session}`);\n      \n    } catch (error) {\n      console.error('❌ Failed to show metrics:', error.message);\n      process.exit(1);\n    }\n  }\n\n  /**\n   * Run health check\n   */\n  async runHealthCheck() {\n    try {\n      await this.ensureInitialized();\n      \n      console.log('🔍 Running health check...');\n      \n      const health = this.integration.checkpointSystem.getHealthStatus();\n      \n      console.log('\\n🏥 Health Check Results');\n      console.log('='.repeat(30));\n      \n      console.log(`\\n🎯 Overall Health: ${health.healthy ? '🟢 Healthy' : '🔴 Unhealthy'}`);\n      \n      console.log('\\n📊 Metrics:');\n      console.log(`  Active Checkpoints: ${health.metrics.activeCheckpoints}`);\n      console.log(`  Current Session: ${health.metrics.currentSession || 'None'}`);\n      console.log(`  Recovery Mode: ${health.metrics.recoveryMode ? '🔄 Yes' : '❌ No'}`);\n      console.log(`  Failed Operations: ${health.metrics.failedOperations}`);\n      \n      if (health.warnings.length > 0) {\n        console.log('\\n⚠️  Warnings:');\n        health.warnings.forEach(warning => console.log(`    - ${warning}`));\n      } else {\n        console.log('\\n✅ No warnings found');\n      }\n      \n      // Additional checks\n      console.log('\\n🔍 Additional Checks:');\n      \n      // Check if directories exist\n      try {\n        await fs.access('./memory');\n        console.log('  📁 Memory directory: ✅');\n      } catch {\n        console.log('  📁 Memory directory: ❌');\n      }\n      \n      try {\n        await fs.access('./memory/checkpoints');\n        console.log('  💾 Checkpoint directory: ✅');\n      } catch {\n        console.log('  💾 Checkpoint directory: ❌');\n      }\n      \n      try {\n        await fs.access('./.claude/helpers/checkpoint-manager.sh');\n        console.log('  🔧 Git integration: ✅');\n      } catch {\n        console.log('  🔧 Git integration: ❌');\n      }\n      \n    } catch (error) {\n      console.error('❌ Health check failed:', error.message);\n      process.exit(1);\n    }\n  }\n\n  /**\n   * Export checkpoint data\n   */\n  async exportCheckpoint(args) {\n    try {\n      if (args.length < 2) {\n        console.error('❌ Please provide checkpoint ID and output file');\n        process.exit(1);\n      }\n      \n      await this.ensureInitialized();\n      \n      const checkpointId = args[0];\n      const outputFile = args[1];\n      \n      console.log(`📤 Exporting checkpoint: ${checkpointId}`);\n      \n      const checkpoint = await this.integration.checkpointSystem.loadCheckpoint(checkpointId);\n      if (!checkpoint) {\n        console.error(`❌ Checkpoint not found: ${checkpointId}`);\n        process.exit(1);\n      }\n      \n      await fs.writeFile(outputFile, JSON.stringify(checkpoint, null, 2));\n      \n      console.log(`✅ Checkpoint exported to: ${outputFile}`);\n      \n    } catch (error) {\n      console.error('❌ Export failed:', error.message);\n      process.exit(1);\n    }\n  }\n\n  /**\n   * Import checkpoint data\n   */\n  async importCheckpoint(args) {\n    try {\n      if (args.length === 0) {\n        console.error('❌ Please provide input file');\n        process.exit(1);\n      }\n      \n      await this.ensureInitialized();\n      \n      const inputFile = args[0];\n      \n      console.log(`📥 Importing checkpoint from: ${inputFile}`);\n      \n      const checkpointData = JSON.parse(await fs.readFile(inputFile, 'utf8'));\n      \n      // Validate checkpoint\n      if (!this.integration.checkpointSystem.validateCheckpoint(checkpointData)) {\n        console.error('❌ Invalid checkpoint data');\n        process.exit(1);\n      }\n      \n      // Add to active checkpoints\n      this.integration.checkpointSystem.activeCheckpoints.set(checkpointData.id, checkpointData);\n      \n      console.log(`✅ Checkpoint imported: ${checkpointData.id}`);\n      \n    } catch (error) {\n      console.error('❌ Import failed:', error.message);\n      process.exit(1);\n    }\n  }\n\n  /**\n   * Show help information\n   */\n  async showHelp(args) {\n    const command = args[0];\n    \n    if (command && this.commands.has(command)) {\n      const cmd = this.commands.get(command);\n      console.log(`\\n📖 ${command.toUpperCase()}`);\n      console.log('='.repeat(20));\n      console.log(`Description: ${cmd.description}`);\n      console.log(`Usage: ${cmd.usage}`);\n    } else {\n      console.log('\\n🔧 Memory Checkpoint System CLI');\n      console.log('='.repeat(35));\n      console.log('\\nAvailable commands:');\n      \n      for (const [name, cmd] of this.commands) {\n        console.log(`  ${name.padEnd(12)} - ${cmd.description}`);\n      }\n      \n      console.log('\\nUse \"checkpoint-cli help <command>\" for detailed help on a specific command.');\n    }\n  }\n\n  /**\n   * Format bytes to human readable format\n   */\n  formatBytes(bytes) {\n    if (bytes === 0) return '0 B';\n    \n    const k = 1024;\n    const sizes = ['B', 'KB', 'MB', 'GB'];\n    const i = Math.floor(Math.log(bytes) / Math.log(k));\n    \n    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];\n  }\n\n  /**\n   * Ensure system is initialized\n   */\n  async ensureInitialized() {\n    if (!this.integration) {\n      console.log('🚀 Initializing checkpoint system...');\n      this.integration = new CheckpointIntegration();\n      await this.integration.initialize();\n    }\n  }\n\n  /**\n   * Run CLI with provided arguments\n   */\n  async run(args) {\n    try {\n      const parsed = this.parseArgs(args);\n      \n      if (!parsed.command || parsed.command === 'help') {\n        await this.showHelp(parsed.args);\n        return;\n      }\n      \n      if (!this.commands.has(parsed.command)) {\n        console.error(`❌ Unknown command: ${parsed.command}`);\n        console.log('Use \"checkpoint-cli help\" for available commands.');\n        process.exit(1);\n      }\n      \n      const command = this.commands.get(parsed.command);\n      await command.handler(parsed.args, parsed.flags);\n      \n    } catch (error) {\n      console.error('❌ Command execution failed:', error.message);\n      process.exit(1);\n    }\n  }\n}\n\n// Run CLI if this file is executed directly\nif (require.main === module) {\n  const cli = new CheckpointCLI();\n  cli.run(process.argv).catch(error => {\n    console.error('❌ CLI error:', error.message);\n    process.exit(1);\n  });\n}\n\nmodule.exports = CheckpointCLI;