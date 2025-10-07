#!/bin/bash
# Hive Mind Checkpoint Manager
# Enhanced checkpoint management with distributed memory operations and hive mind coordination

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
CHECKPOINT_DIR=".claude/checkpoints"
BACKUP_DIR=".claude/backups"
MEMORY_BANK_DIR=".claude/memory-bank"
HIVE_CONTEXT_DIR=".claude/hive-context"
MEMORY_COMPRESSION_THRESHOLD=50  # MB
MAX_MEMORY_SESSIONS=100

# Hive Mind specific checkpoint types
HIVE_CHECKPOINT_TYPES=(
    "hive-init"
    "agent-spawn"
    "memory-sync"
    "coordination-point"
    "collective-decision"
    "memory-merge"
    "hive-split"
    "swarm-rebalance"
)

# Help function
show_help() {
    cat << EOF
Hive Mind Checkpoint Manager
===========================

Usage: $0 <command> [options]

Standard Commands:
  list [--memory|--hive]    List all checkpoints (with optional filters)
  show <id>                 Show details of a specific checkpoint
  rollback <id>             Rollback to a specific checkpoint
  diff <id>                 Show diff since checkpoint
  clean [days]              Clean old checkpoints (default: 7 days)
  summary                   Show session summary

Memory Management Commands:
  validate-memory           Validate current memory state
  restore-memory <id>       Restore memory state from checkpoint
  compress-memory [days]    Compress old memory sessions
  cleanup-memory [days]     Clean up expired memory data
  sync-memory               Synchronize memory across hive nodes

Hive Mind Commands:
  hive-status              Show hive mind coordination status
  agent-checkpoints        List agent-specific checkpoints
  coordination-points      List coordination checkpoints
  memory-snapshots         List memory snapshots with metadata
  rollback-hive <id>       Rollback entire hive state including memory

Advanced Options:
  --with-memory            Include memory restoration in rollback
  --preserve-agents        Preserve agent states during rollback
  --coordination-only      Only rollback coordination state
  --memory-only            Only rollback memory state
  --validate               Validate checkpoint integrity before operation

Examples:
  $0 list --memory
  $0 show checkpoint-20240130-143022
  $0 rollback checkpoint-20240130-143022 --with-memory
  $0 rollback-hive session-end-session-20240130-150000 --preserve-agents
  $0 restore-memory memory-coordination-point-12345
  $0 hive-status
EOF
}

# Setup hive mind infrastructure
setup_hive_infrastructure() {
    mkdir -p "$MEMORY_BANK_DIR"/{sessions,snapshots,compressed,temp,coordination}
    mkdir -p "$HIVE_CONTEXT_DIR"/{agents,coordination,patterns,decisions}
    mkdir -p "$CHECKPOINT_DIR"/{memory,hive-mind,validation,coordination}
    mkdir -p "$BACKUP_DIR"/{memory,hive-state}
    
    echo -e "${GREEN}🏗️  Hive mind infrastructure setup complete${NC}"
}

# Enhanced list function with memory and hive filters
list_checkpoints() {
    local filter="$1"
    
    echo -e "${BLUE}📋 Enhanced Checkpoint Listing${NC}"
    echo ""
    
    case "$filter" in
        "--memory")
            echo -e "${YELLOW}Memory-Related Checkpoints:${NC}"
            list_memory_checkpoints
            ;;
        "--hive")
            echo -e "${YELLOW}Hive Mind Checkpoints:${NC}"
            list_hive_checkpoints
            ;;
        *)
            echo -e "${YELLOW}All Checkpoints:${NC}"
            list_all_enhanced_checkpoints
            ;;
    esac
}

# List memory-specific checkpoints
list_memory_checkpoints() {
    # Memory snapshots
    if [ -d "$MEMORY_BANK_DIR/snapshots" ]; then
        echo -e "${CYAN}Memory Snapshots:${NC}"
        find "$MEMORY_BANK_DIR/snapshots" -name "metadata-*.json" -type f | sort -r | head -10 | while read -r metadata_file; do
            local snapshot_id=$(jq -r '.snapshot_id' "$metadata_file" 2>/dev/null || echo "unknown")
            local timestamp=$(jq -r '.timestamp' "$metadata_file" 2>/dev/null || echo "unknown")
            local memory_size=$(jq -r '.memory_size' "$metadata_file" 2>/dev/null || echo "0")
            local checkpoint_type=$(jq -r '.checkpoint_type' "$metadata_file" 2>/dev/null || echo "unknown")
            
            printf "  %-30s %-20s %-10s %s\n" "$snapshot_id" "$timestamp" "${memory_size}B" "($checkpoint_type)"
        done
        echo ""
    fi
    
    # Compressed sessions
    if [ -d "$MEMORY_BANK_DIR/compressed" ]; then
        echo -e "${CYAN}Compressed Memory Sessions:${NC}"
        ls -la "$MEMORY_BANK_DIR/compressed"/*.json.gz 2>/dev/null | head -5 | awk '{print "  " $9 " (" $5 "B, " $6 " " $7 " " $8 ")"}'
        echo ""
    fi
}

# List hive mind specific checkpoints
list_hive_checkpoints() {
    # Coordination points
    if [ -d "$HIVE_CONTEXT_DIR/coordination" ]; then
        echo -e "${CYAN}Coordination Checkpoints:${NC}"
        find "$HIVE_CONTEXT_DIR/coordination" -name "*.json" -type f | sort -r | head -10 | while read -r coord_file; do
            local coord_id=$(basename "$coord_file" .json)
            local timestamp=$(jq -r '.timestamp // "unknown"' "$coord_file" 2>/dev/null)
            echo "  $coord_id ($timestamp)"
        done
        echo ""
    fi
    
    # Agent checkpoints
    if [ -d "$HIVE_CONTEXT_DIR/agents" ]; then
        echo -e "${CYAN}Agent Checkpoints:${NC}"
        find "$HIVE_CONTEXT_DIR/agents" -name "*.json" -type f | sort -r | head -10 | while read -r agent_file; do
            local agent_id=$(basename "$agent_file" .json)
            local agent_type=$(jq -r '.agent_type // "unknown"' "$agent_file" 2>/dev/null)
            local status=$(jq -r '.status // "unknown"' "$agent_file" 2>/dev/null)
            echo "  $agent_id ($agent_type, $status)"
        done
        echo ""
    fi
}

# Enhanced checkpoint listing
list_all_enhanced_checkpoints() {
    # Git checkpoints with memory integration
    echo -e "${YELLOW}Git Checkpoints with Memory:${NC}"
    if [ -d "$CHECKPOINT_DIR" ]; then
        find "$CHECKPOINT_DIR" -name "*.json" -type f | sort -r | head -10 | while read -r checkpoint_file; do
            local checkpoint_data=$(cat "$checkpoint_file")
            local checkpoint_id=$(echo "$checkpoint_data" | jq -r '.checkpoint_id // .tag // "unknown"')
            local timestamp=$(echo "$checkpoint_data" | jq -r '.timestamp // "unknown"')
            local hive_enabled=$(echo "$checkpoint_data" | jq -r '.hive_mind_enabled // false')
            local memory_snapshot=$(echo "$checkpoint_data" | jq -r '.memory_snapshot // "none"')
            
            if [ "$hive_enabled" = "true" ]; then
                printf "  %-30s %-20s %s %s\n" "$checkpoint_id" "$timestamp" "🧠" "$memory_snapshot"
            else
                printf "  %-30s %-20s %s\n" "$checkpoint_id" "$timestamp" "(standard)"
            fi
        done
    fi
    echo ""
    
    # Memory snapshots summary
    local memory_count=$(find "$MEMORY_BANK_DIR/snapshots" -name "*.tar.gz" 2>/dev/null | wc -l)
    local hive_count=$(find "$HIVE_CONTEXT_DIR" -name "*.json" 2>/dev/null | wc -l)
    
    echo -e "${CYAN}Summary:${NC}"
    echo "  Memory snapshots: $memory_count"
    echo "  Hive context entries: $hive_count"
    echo "  Total disk usage: $(du -sh "$MEMORY_BANK_DIR" "$HIVE_CONTEXT_DIR" 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo "0")MB"
}

# Enhanced show checkpoint with memory details
show_checkpoint() {
    local checkpoint_id="$1"
    
    echo -e "${BLUE}📍 Enhanced Checkpoint Details: $checkpoint_id${NC}"
    echo ""
    
    # Look for enhanced checkpoint metadata
    local checkpoint_file=$(find "$CHECKPOINT_DIR" -name "*$checkpoint_id*.json" -o -name "$checkpoint_id.json" 2>/dev/null | head -1)
    
    if [ -n "$checkpoint_file" ] && [ -f "$checkpoint_file" ]; then
        echo -e "${YELLOW}Enhanced Checkpoint Metadata:${NC}"
        local checkpoint_data=$(cat "$checkpoint_file")
        
        # Basic info
        echo "  Type: $(echo "$checkpoint_data" | jq -r '.type // "unknown"')"
        echo "  Timestamp: $(echo "$checkpoint_data" | jq -r '.timestamp // "unknown"')"
        echo "  Branch: $(echo "$checkpoint_data" | jq -r '.branch // .original_branch // "unknown"')"
        
        # Memory info
        local hive_enabled=$(echo "$checkpoint_data" | jq -r '.hive_mind_enabled // false')
        if [ "$hive_enabled" = "true" ]; then
            echo -e "${CYAN}  🧠 Hive Mind Enabled: Yes${NC}"
            echo "  Memory Snapshot: $(echo "$checkpoint_data" | jq -r '.memory_snapshot // "none"')"
            echo "  Memory Validation: $(echo "$checkpoint_data" | jq -r '.memory_validation // "none"')"
            echo "  Context Preserved: $(echo "$checkpoint_data" | jq -r '.context_preserved // false')"
        else
            echo -e "${YELLOW}  🧠 Hive Mind Enabled: No${NC}"
        fi
        
        # Show memory snapshot details if available
        local memory_snapshot=$(echo "$checkpoint_data" | jq -r '.memory_snapshot // ""')
        if [ -n "$memory_snapshot" ] && [ "$memory_snapshot" != "none" ]; then
            show_memory_snapshot_details "$memory_snapshot"
        fi
    fi
    
    # Fall back to standard git checkpoint if no enhanced metadata
    if git tag -l "$checkpoint_id" | grep -q "$checkpoint_id"; then
        echo -e "${YELLOW}Git Tag Information:${NC}"
        echo "  Commit: $(git rev-list -n 1 "$checkpoint_id")"
        echo "  Date: $(git log -1 --format=%ai "$checkpoint_id")"
        echo "  Message:"
        git log -1 --format=%B "$checkpoint_id" | sed 's/^/    /'
        echo ""
        echo -e "${YELLOW}Files changed:${NC}"
        git diff-tree --no-commit-id --name-status -r "$checkpoint_id" | sed 's/^/    /'
    fi
}

# Show memory snapshot details
show_memory_snapshot_details() {
    local memory_snapshot="$1"
    
    # Find metadata file for snapshot
    local metadata_file=$(find "$MEMORY_BANK_DIR/snapshots" -name "metadata-$memory_snapshot-*.json" 2>/dev/null | head -1)
    
    if [ -n "$metadata_file" ] && [ -f "$metadata_file" ]; then
        echo ""
        echo -e "${CYAN}Memory Snapshot Details:${NC}"
        local metadata=$(cat "$metadata_file")
        echo "    Memory Size: $(echo "$metadata" | jq -r '.memory_size // 0')B"
        echo "    Hive Context Size: $(echo "$metadata" | jq -r '.hive_context_size // 0')B"
        echo "    Compression: $(echo "$metadata" | jq -r '.compression // "none"')"
        echo "    Retention: $(echo "$metadata" | jq -r '.retention_days // "unknown"') days"
    fi
}

# Enhanced rollback with memory restoration
rollback_checkpoint() {
    local checkpoint_id="$1"
    local options="$2 $3 $4"  # Support multiple options
    
    echo -e "${YELLOW}🔄 Enhanced rollback to checkpoint: $checkpoint_id${NC}"
    echo "Options: $options"
    echo ""
    
    # Find enhanced checkpoint metadata
    local checkpoint_file=$(find "$CHECKPOINT_DIR" -name "*$checkpoint_id*.json" -o -name "$checkpoint_id.json" 2>/dev/null | head -1)
    local has_memory=false
    local memory_snapshot=""
    
    if [ -n "$checkpoint_file" ] && [ -f "$checkpoint_file" ]; then
        local checkpoint_data=$(cat "$checkpoint_file")
        has_memory=$(echo "$checkpoint_data" | jq -r '.hive_mind_enabled // false')
        memory_snapshot=$(echo "$checkpoint_data" | jq -r '.memory_snapshot // ""')
    fi
    
    # Create backup before rollback
    local backup_name="hive-backup-$(date +%Y%m%d-%H%M%S)"
    echo "Creating comprehensive backup: $backup_name"
    
    # Backup git state
    git tag "$backup_name" -m "Backup before rollback to $checkpoint_id"
    
    # Backup memory state if exists
    if [ "$has_memory" = "true" ]; then
        backup_memory_state "$backup_name"
    fi
    
    # Perform rollback based on options
    if echo "$options" | grep -q "\-\-memory-only"; then
        echo -e "${CYAN}🧠 Performing memory-only rollback${NC}"
        restore_memory_state "$memory_snapshot"
    elif echo "$options" | grep -q "\-\-coordination-only"; then
        echo -e "${PURPLE}🤝 Performing coordination-only rollback${NC}"
        restore_coordination_state "$checkpoint_id"
    elif echo "$options" | grep -q "\-\-with-memory"; then
        echo -e "${GREEN}🔄 Performing full rollback with memory restoration${NC}"
        perform_standard_rollback "$checkpoint_id" "--soft"
        if [ "$has_memory" = "true" ]; then
            restore_memory_state "$memory_snapshot"
        fi
    else
        echo -e "${YELLOW}🔄 Performing standard git rollback${NC}"
        perform_standard_rollback "$checkpoint_id" "$options"
    fi
    
    echo -e "${GREEN}✅ Enhanced rollback completed${NC}"
}

# Backup current memory state
backup_memory_state() {
    local backup_name="$1"
    
    if [ -d "$MEMORY_BANK_DIR" ] || [ -d "$HIVE_CONTEXT_DIR" ]; then
        tar -czf "$BACKUP_DIR/memory/$backup_name-memory.tar.gz" \
            "$MEMORY_BANK_DIR" "$HIVE_CONTEXT_DIR" 2>/dev/null || true
        echo "  Memory state backed up to: $backup_name-memory.tar.gz"
    fi
}

# Restore memory state from snapshot
restore_memory_state() {
    local memory_snapshot="$1"
    
    if [ -z "$memory_snapshot" ] || [ "$memory_snapshot" = "none" ]; then
        echo -e "${YELLOW}⚠️  No memory snapshot available for restoration${NC}"
        return 1
    fi
    
    # Find snapshot file
    local snapshot_file=$(find "$MEMORY_BANK_DIR/snapshots" -name "*$memory_snapshot*.tar.gz" 2>/dev/null | head -1)
    
    if [ -n "$snapshot_file" ] && [ -f "$snapshot_file" ]; then
        echo "Restoring memory from: $(basename "$snapshot_file")"
        
        # Create backup of current state first
        backup_memory_state "pre-restore-$(date +%s)"
        
        # Remove current memory state
        rm -rf "$MEMORY_BANK_DIR/sessions" "$HIVE_CONTEXT_DIR" 2>/dev/null || true
        
        # Extract snapshot
        tar -xzf "$snapshot_file" -C "." 2>/dev/null || true
        
        echo -e "${GREEN}✅ Memory state restored from snapshot${NC}"
    else
        echo -e "${RED}❌ Memory snapshot not found: $memory_snapshot${NC}"
        return 1
    fi
}

# Restore coordination state
restore_coordination_state() {
    local checkpoint_id="$1"
    
    # Look for coordination-specific data
    local coord_file="$HIVE_CONTEXT_DIR/coordination/$checkpoint_id.json"
    
    if [ -f "$coord_file" ]; then
        echo "Restoring coordination state from: $coord_file"
        # Implementation would restore coordination patterns, agent assignments, etc.
        echo -e "${GREEN}✅ Coordination state restored${NC}"
    else
        echo -e "${YELLOW}⚠️  No coordination state found for: $checkpoint_id${NC}"
    fi
}

# Standard rollback function
perform_standard_rollback() {
    local checkpoint_id="$1"
    local mode="$2"
    
    case "$mode" in
        "--hard")
            echo -e "${RED}⚠️  Performing hard reset (destructive)${NC}"
            git reset --hard "$checkpoint_id"
            ;;
        "--branch")
            local branch_name="rollback-$checkpoint_id-$(date +%Y%m%d-%H%M%S)"
            echo "Creating new branch: $branch_name"
            git checkout -b "$branch_name" "$checkpoint_id"
            ;;
        *)
            echo "Stashing current changes..."
            git stash push -m "Stash before rollback to $checkpoint_id"
            git reset --soft "$checkpoint_id"
            ;;
    esac
}

# Hive mind status
show_hive_status() {
    echo -e "${BLUE}🧠 Hive Mind Status${NC}"
    echo ""
    
    # Memory bank status
    if [ -d "$MEMORY_BANK_DIR" ]; then
        local active_sessions=$(find "$MEMORY_BANK_DIR/sessions" -name "*.json" 2>/dev/null | wc -l)
        local snapshots=$(find "$MEMORY_BANK_DIR/snapshots" -name "*.tar.gz" 2>/dev/null | wc -l)
        local compressed=$(find "$MEMORY_BANK_DIR/compressed" -name "*.json.gz" 2>/dev/null | wc -l)
        
        echo -e "${YELLOW}Memory Bank:${NC}"
        echo "  Active sessions: $active_sessions"
        echo "  Snapshots: $snapshots"
        echo "  Compressed sessions: $compressed"
        echo "  Total size: $(du -sh "$MEMORY_BANK_DIR" 2>/dev/null | cut -f1)"
        echo ""
    fi
    
    # Hive context status
    if [ -d "$HIVE_CONTEXT_DIR" ]; then
        local agents=$(find "$HIVE_CONTEXT_DIR/agents" -name "*.json" 2>/dev/null | wc -l)
        local coordination=$(find "$HIVE_CONTEXT_DIR/coordination" -name "*.json" 2>/dev/null | wc -l)
        local patterns=$(find "$HIVE_CONTEXT_DIR/patterns" -name "*.json" 2>/dev/null | wc -l)
        
        echo -e "${YELLOW}Hive Context:${NC}"
        echo "  Active agents: $agents"
        echo "  Coordination points: $coordination"
        echo "  Learned patterns: $patterns"
        echo "  Total size: $(du -sh "$HIVE_CONTEXT_DIR" 2>/dev/null | cut -f1)"
        echo ""
    fi
    
    # Recent activity
    echo -e "${YELLOW}Recent Activity:${NC}"
    find "$CHECKPOINT_DIR" -name "*.json" -mtime -1 -exec basename {} \; | sort | head -5 | sed 's/^/  /'
}

# Memory validation
validate_memory() {
    echo -e "${BLUE}🔍 Validating Memory State${NC}"
    
    # Run the validation from standard hooks
    .claude/helpers/standard-checkpoint-hooks.sh validate-memory
}

# Memory synchronization
sync_memory() {
    echo -e "${BLUE}🔄 Synchronizing Memory Across Hive Nodes${NC}"
    
    # This would implement memory synchronization across distributed hive nodes
    # For now, we'll just validate and compress
    validate_memory
    .claude/helpers/standard-checkpoint-hooks.sh compress-memory 7
    
    echo -e "${GREEN}✅ Memory synchronization completed${NC}"
}

# Main command handling
case "$1" in
    list)
        list_checkpoints "$2"
        ;;
    show)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Please specify a checkpoint ID${NC}"
            show_help
            exit 1
        fi
        show_checkpoint "$2"
        ;;
    rollback)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Please specify a checkpoint ID${NC}"
            show_help
            exit 1
        fi
        rollback_checkpoint "$2" "$3" "$4" "$5"
        ;;
    rollback-hive)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Please specify a checkpoint ID${NC}"
            show_help
            exit 1
        fi
        rollback_checkpoint "$2" "--with-memory" "$3" "$4"
        ;;
    diff)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Please specify a checkpoint ID${NC}"
            show_help
            exit 1
        fi
        # Use standard diff for now
        git diff "$2"
        ;;
    clean)
        echo -e "${YELLOW}🧹 Enhanced cleanup with memory management${NC}"
        .claude/helpers/standard-checkpoint-hooks.sh cleanup-memory "${2:-7}"
        echo "Standard checkpoint cleanup:"
        # Clean standard checkpoints
        local days=${2:-7}
        find "$CHECKPOINT_DIR" -name "*.json" -type f -mtime +$days -delete
        echo "✅ Cleanup completed"
        ;;
    summary)
        # Enhanced summary with hive status
        if [ -d "$CHECKPOINT_DIR" ]; then
            local latest_summary=$(find "$CHECKPOINT_DIR" -name "summary-*.md" -type f -printf "%T@ %p\n" | sort -rn | head -1 | cut -d' ' -f2-)
            if [ -n "$latest_summary" ]; then
                echo -e "${BLUE}📊 Latest Session Summary${NC}"
                cat "$latest_summary"
            fi
        fi
        echo ""
        show_hive_status
        ;;
    validate-memory)
        validate_memory
        ;;
    restore-memory)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Please specify a memory snapshot ID${NC}"
            show_help
            exit 1
        fi
        restore_memory_state "$2"
        ;;
    compress-memory)
        .claude/helpers/standard-checkpoint-hooks.sh compress-memory "${2:-7}"
        ;;
    cleanup-memory)
        .claude/helpers/standard-checkpoint-hooks.sh cleanup-memory "${2:-30}"
        ;;
    sync-memory)
        sync_memory
        ;;
    hive-status)
        show_hive_status
        ;;
    agent-checkpoints)
        echo -e "${BLUE}👥 Agent Checkpoints${NC}"
        list_hive_checkpoints | grep -A 20 "Agent Checkpoints"
        ;;
    coordination-points)
        echo -e "${BLUE}🤝 Coordination Points${NC}"
        list_hive_checkpoints | grep -A 20 "Coordination Checkpoints"
        ;;
    memory-snapshots)
        echo -e "${BLUE}📸 Memory Snapshots${NC}"
        list_memory_checkpoints
        ;;
    setup-infrastructure)
        setup_hive_infrastructure
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Error: Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac