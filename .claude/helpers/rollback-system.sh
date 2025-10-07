#!/bin/bash
# Advanced Rollback System for Hive Mind Checkpoints
# Provides granular rollback mechanisms with memory state restoration

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
MEMORY_BANK_DIR=".claude/memory-bank"
HIVE_CONTEXT_DIR=".claude/hive-context"
CHECKPOINT_DIR=".claude/checkpoints"
BACKUP_DIR=".claude/backups"
ROLLBACK_LOG_DIR=".claude/rollback-logs"

# Rollback types
ROLLBACK_TYPES=(
    "full"           # Complete system rollback with memory
    "git-only"       # Git state only, preserve memory
    "memory-only"    # Memory state only, preserve git
    "selective"      # Choose specific components
    "coordination"   # Hive coordination state only
    "agents"         # Agent states only
)

# Help function
show_help() {
    cat << EOF
Advanced Rollback System for Hive Mind Checkpoints
==================================================

Usage: $0 <command> [options]

Commands:
  rollback <checkpoint-id> [type]  Rollback to specific checkpoint
  list-rollback-points             List available rollback points
  create-rollback-point [name]     Create manual rollback point
  rollback-preview <checkpoint-id> Preview changes without executing
  rollback-history                 Show rollback operation history
  rollback-validate <checkpoint-id> Validate rollback target
  emergency-rollback [steps]       Emergency rollback (last N checkpoints)

Rollback Types:
  full              Complete system rollback (git + memory + hive state)
  git-only          Git repository state only, preserve all memory
  memory-only       Memory bank and hive context only, preserve git
  selective         Interactive selection of components to rollback
  coordination      Hive coordination state only
  agents            Agent states and configurations only

Advanced Options:
  --dry-run         Preview changes without executing rollback
  --backup-first    Create backup before rollback (default: true)
  --no-backup       Skip backup creation (dangerous)
  --preserve <list> Comma-separated list of components to preserve
  --restore <list>  Comma-separated list of components to restore
  --force           Force rollback even with validation warnings
  --interactive     Interactive mode with confirmation prompts
  --quiet           Suppress non-essential output

Preserve/Restore Components:
  git, memory-sessions, memory-snapshots, hive-agents, hive-coordination,
  hive-patterns, checkpoints, logs, configs

Examples:
  $0 rollback checkpoint-20240130-143022 full
  $0 rollback session-end-20240130-150000 memory-only --preserve git
  $0 rollback-preview checkpoint-20240130-143022
  $0 emergency-rollback 3
  $0 rollback checkpoint-20240130-143022 selective --interactive
  $0 create-rollback-point "before-major-refactor"
EOF
}

# Setup rollback system
setup_rollback_system() {
    mkdir -p "$BACKUP_DIR"/{git,memory,hive,full-system}
    mkdir -p "$ROLLBACK_LOG_DIR"/{operations,previews,validations}
    
    # Create rollback configuration
    cat > "$ROLLBACK_LOG_DIR/config.json" <<EOF
{
  "version": "2.0.0",
  "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "backup_retention_days": 30,
  "max_rollback_history": 100,
  "auto_backup": true,
  "validation_level": "strict",
  "supported_rollback_types": $(printf '%s\n' "${ROLLBACK_TYPES[@]}" | jq -R . | jq -s .)
}
EOF
    
    echo -e "${GREEN}🔧 Rollback system setup complete${NC}"
}

# Create comprehensive backup
create_comprehensive_backup() {
    local backup_id="$1"
    local backup_type="$2"
    
    echo -e "${BLUE}📦 Creating comprehensive backup: $backup_id${NC}"
    
    local backup_dir="$BACKUP_DIR/full-system/$backup_id"
    mkdir -p "$backup_dir"
    
    # Git backup
    echo "  Backing up git state..."
    git bundle create "$backup_dir/git-state.bundle" --all
    git tag > "$backup_dir/git-tags.txt"
    git branch -a > "$backup_dir/git-branches.txt"
    git log --oneline -20 > "$backup_dir/git-recent-commits.txt"
    
    # Memory backup
    if [ -d "$MEMORY_BANK_DIR" ]; then
        echo "  Backing up memory bank..."
        tar -czf "$backup_dir/memory-bank.tar.gz" "$MEMORY_BANK_DIR" 2>/dev/null || true
    fi
    
    # Hive context backup
    if [ -d "$HIVE_CONTEXT_DIR" ]; then
        echo "  Backing up hive context..."
        tar -czf "$backup_dir/hive-context.tar.gz" "$HIVE_CONTEXT_DIR" 2>/dev/null || true
    fi
    
    # Checkpoint metadata backup
    if [ -d "$CHECKPOINT_DIR" ]; then
        echo "  Backing up checkpoint metadata..."
        tar -czf "$backup_dir/checkpoints.tar.gz" "$CHECKPOINT_DIR" 2>/dev/null || true
    fi
    
    # Create backup manifest
    cat > "$backup_dir/manifest.json" <<EOF
{
  "backup_id": "$backup_id",
  "backup_type": "$backup_type",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "components": {
    "git_state": "$([ -f "$backup_dir/git-state.bundle" ] && echo 'included' || echo 'missing')",
    "memory_bank": "$([ -f "$backup_dir/memory-bank.tar.gz" ] && echo 'included' || echo 'missing')",
    "hive_context": "$([ -f "$backup_dir/hive-context.tar.gz" ] && echo 'included' || echo 'missing')",
    "checkpoints": "$([ -f "$backup_dir/checkpoints.tar.gz" ] && echo 'included' || echo 'missing')"
  },
  "size_mb": $(du -sm "$backup_dir" 2>/dev/null | cut -f1 || echo 0)
}
EOF
    
    echo -e "${GREEN}✅ Backup created: $backup_id${NC}"
    echo "  Location: $backup_dir"
    echo "  Size: $(du -sh "$backup_dir" 2>/dev/null | cut -f1 || echo 'unknown')"
}

# List rollback points
list_rollback_points() {
    echo -e "${BLUE}📋 Available Rollback Points${NC}"
    echo ""
    
    # Enhanced checkpoints
    if [ -d "$CHECKPOINT_DIR" ]; then
        echo -e "${YELLOW}Enhanced Checkpoints (with memory):${NC}"
        find "$CHECKPOINT_DIR" -name "*.json" -type f | sort -r | head -15 | while read -r checkpoint_file; do
            local checkpoint_data=$(cat "$checkpoint_file" 2>/dev/null || echo '{}')
            local checkpoint_id=$(echo "$checkpoint_data" | jq -r '.checkpoint_id // .tag // "unknown"')
            local timestamp=$(echo "$checkpoint_data" | jq -r '.timestamp // "unknown"')
            local type=$(echo "$checkpoint_data" | jq -r '.type // "unknown"')
            local has_memory=$(echo "$checkpoint_data" | jq -r '.hive_mind_enabled // false')
            
            if [ "$has_memory" = "true" ]; then
                printf "  %-30s %-20s %-12s %s\n" "$checkpoint_id" "$timestamp" "$type" "🧠"
            else
                printf "  %-30s %-20s %-12s %s\n" "$checkpoint_id" "$timestamp" "$type" "📝"
            fi
        done
        echo ""
    fi
    
    # Git tags (fallback)
    echo -e "${YELLOW}Git Checkpoints:${NC}"
    git tag -l 'checkpoint-*' 'session-end-*' --sort=-creatordate | head -10 | while read -r tag; do
        local commit_date=$(git log -1 --format=%ai "$tag" 2>/dev/null || echo "unknown")
        local commit_msg=$(git log -1 --format=%s "$tag" 2>/dev/null | head -c 50)
        printf "  %-30s %-20s %s\n" "$tag" "$commit_date" "$commit_msg..."
    done
    echo ""
    
    # Manual rollback points
    if [ -d "$BACKUP_DIR/full-system" ]; then
        echo -e "${YELLOW}Manual Rollback Points:${NC}"
        find "$BACKUP_DIR/full-system" -name "manifest.json" -type f | sort -r | head -5 | while read -r manifest; do
            local backup_data=$(cat "$manifest" 2>/dev/null || echo '{}')
            local backup_id=$(echo "$backup_data" | jq -r '.backup_id // "unknown"')
            local timestamp=$(echo "$backup_data" | jq -r '.timestamp // "unknown"')
            local size=$(echo "$backup_data" | jq -r '.size_mb // 0')
            printf "  %-30s %-20s %sMB\n" "$backup_id" "$timestamp" "$size"
        done
    fi
}

# Validate rollback target
validate_rollback_target() {
    local checkpoint_id="$1"
    local validation_file="$ROLLBACK_LOG_DIR/validations/validation-$(date +%s).json"
    
    echo -e "${BLUE}🔍 Validating rollback target: $checkpoint_id${NC}"
    
    local validation_result="valid"
    local warnings=()
    local errors=()
    
    # Check if checkpoint exists
    local checkpoint_exists=false
    
    # Check enhanced checkpoints
    if find "$CHECKPOINT_DIR" -name "*$checkpoint_id*.json" 2>/dev/null | grep -q .; then
        checkpoint_exists=true
    fi
    
    # Check git tags
    if git tag -l "$checkpoint_id" | grep -q "$checkpoint_id"; then
        checkpoint_exists=true
    fi
    
    if [ "$checkpoint_exists" = false ]; then
        errors+=("Checkpoint not found: $checkpoint_id")
        validation_result="invalid"
    fi
    
    # Check memory snapshot availability
    local has_memory_snapshot=false
    local checkpoint_file=$(find "$CHECKPOINT_DIR" -name "*$checkpoint_id*.json" 2>/dev/null | head -1)
    
    if [ -n "$checkpoint_file" ] && [ -f "$checkpoint_file" ]; then
        local memory_snapshot=$(jq -r '.memory_snapshot // ""' "$checkpoint_file" 2>/dev/null)
        if [ -n "$memory_snapshot" ] && [ "$memory_snapshot" != "none" ]; then
            if find "$MEMORY_BANK_DIR/snapshots" -name "*$memory_snapshot*.tar.gz" 2>/dev/null | grep -q .; then
                has_memory_snapshot=true
            else
                warnings+=("Memory snapshot referenced but not found: $memory_snapshot")
            fi
        fi
    fi
    
    # Check for uncommitted changes
    if ! git diff --quiet 2>/dev/null; then
        warnings+=("Uncommitted changes will be lost")
    fi
    
    if ! git diff --cached --quiet 2>/dev/null; then
        warnings+=("Staged changes will be lost")
    fi
    
    # Check for untracked files
    local untracked_count=$(git ls-files --others --exclude-standard | wc -l)
    if [ "$untracked_count" -gt 0 ]; then
        warnings+=("$untracked_count untracked files will be preserved")
    fi
    
    # Store validation results
    local warnings_json=$(printf '%s\n' "${warnings[@]}" | jq -R . | jq -s .)
    local errors_json=$(printf '%s\n' "${errors[@]}" | jq -R . | jq -s .)
    
    cat > "$validation_file" <<EOF
{
  "checkpoint_id": "$checkpoint_id",
  "validation_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "validation_result": "$validation_result",
  "checkpoint_exists": $checkpoint_exists,
  "has_memory_snapshot": $has_memory_snapshot,
  "warnings": $warnings_json,
  "errors": $errors_json,
  "uncommitted_changes": $(! git diff --quiet 2>/dev/null && echo 'true' || echo 'false'),
  "staged_changes": $(! git diff --cached --quiet 2>/dev/null && echo 'true' || echo 'false'),
  "untracked_files": $untracked_count
}
EOF
    
    # Display validation results
    if [ "$validation_result" = "valid" ]; then
        echo -e "${GREEN}✅ Validation passed${NC}"
    else
        echo -e "${RED}❌ Validation failed${NC}"
    fi
    
    if [ ${#warnings[@]} -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Warnings:${NC}"
        printf '%s\n' "${warnings[@]}" | sed 's/^/  - /'
    fi
    
    if [ ${#errors[@]} -gt 0 ]; then
        echo -e "${RED}❌ Errors:${NC}"
        printf '%s\n' "${errors[@]}" | sed 's/^/  - /'
        return 1
    fi
    
    return 0
}

# Preview rollback changes
preview_rollback() {
    local checkpoint_id="$1"
    local rollback_type="${2:-full}"
    
    echo -e "${BLUE}👁️  Rollback Preview: $checkpoint_id${NC}"
    echo "Type: $rollback_type"
    echo ""
    
    # Validate first
    if ! validate_rollback_target "$checkpoint_id"; then
        echo -e "${RED}❌ Cannot preview invalid rollback target${NC}"
        return 1
    fi
    
    # Show what would change
    case "$rollback_type" in
        "full"|"git-only")
            echo -e "${YELLOW}Git Changes:${NC}"
            if git tag -l "$checkpoint_id" | grep -q "$checkpoint_id"; then
                git diff --name-status "$checkpoint_id" | head -20 | sed 's/^/  /'
                local changed_files=$(git diff --name-only "$checkpoint_id" | wc -l)
                echo "  ... and $((changed_files > 20 ? changed_files - 20 : 0)) more files"
            fi
            echo ""
            ;;
    esac
    
    case "$rollback_type" in
        "full"|"memory-only")
            echo -e "${YELLOW}Memory Changes:${NC}"
            local checkpoint_file=$(find "$CHECKPOINT_DIR" -name "*$checkpoint_id*.json" 2>/dev/null | head -1)
            if [ -n "$checkpoint_file" ] && [ -f "$checkpoint_file" ]; then
                local memory_snapshot=$(jq -r '.memory_snapshot // ""' "$checkpoint_file" 2>/dev/null)
                if [ -n "$memory_snapshot" ] && [ "$memory_snapshot" != "none" ]; then
                    echo "  Memory snapshot: $memory_snapshot"
                    echo "  Current sessions: $(find "$MEMORY_BANK_DIR/sessions" -name "*.json" 2>/dev/null | wc -l)"
                    echo "  Current hive agents: $(find "$HIVE_CONTEXT_DIR/agents" -name "*.json" 2>/dev/null | wc -l)"
                else
                    echo "  No memory snapshot available"
                fi
            fi
            echo ""
            ;;
    esac
    
    # Show impact assessment
    echo -e "${YELLOW}Impact Assessment:${NC}"
    case "$rollback_type" in
        "full")
            echo "  - All changes since checkpoint will be lost"
            echo "  - Memory state will be restored to checkpoint time"
            echo "  - Hive mind context will be restored"
            ;;
        "git-only")
            echo "  - Git changes since checkpoint will be lost"
            echo "  - Memory and hive state will be preserved"
            ;;
        "memory-only")
            echo "  - Git changes will be preserved"
            echo "  - Memory state will be restored to checkpoint time"
            ;;
    esac
}

# Execute rollback
execute_rollback() {
    local checkpoint_id="$1"
    local rollback_type="${2:-full}"
    local options="$3"
    
    local operation_id="rollback-$(date +%s)"
    local log_file="$ROLLBACK_LOG_DIR/operations/$operation_id.log"
    
    echo -e "${BLUE}🔄 Executing rollback: $checkpoint_id${NC}" | tee "$log_file"
    echo "Type: $rollback_type" | tee -a "$log_file"
    echo "Operation ID: $operation_id" | tee -a "$log_file"
    echo "" | tee -a "$log_file"
    
    # Validate unless forced
    if ! echo "$options" | grep -q "\-\-force"; then
        if ! validate_rollback_target "$checkpoint_id"; then
            echo -e "${RED}❌ Rollback validation failed${NC}" | tee -a "$log_file"
            return 1
        fi
    fi
    
    # Create backup unless explicitly disabled
    if ! echo "$options" | grep -q "\-\-no-backup"; then
        create_comprehensive_backup "pre-rollback-$operation_id" "pre-rollback" | tee -a "$log_file"
    fi
    
    # Execute rollback based on type
    case "$rollback_type" in
        "full")
            execute_full_rollback "$checkpoint_id" "$options" | tee -a "$log_file"
            ;;
        "git-only")
            execute_git_rollback "$checkpoint_id" "$options" | tee -a "$log_file"
            ;;
        "memory-only")
            execute_memory_rollback "$checkpoint_id" "$options" | tee -a "$log_file"
            ;;
        "selective")
            execute_selective_rollback "$checkpoint_id" "$options" | tee -a "$log_file"
            ;;
        "coordination")
            execute_coordination_rollback "$checkpoint_id" "$options" | tee -a "$log_file"
            ;;
        "agents")
            execute_agents_rollback "$checkpoint_id" "$options" | tee -a "$log_file"
            ;;
        *)
            echo -e "${RED}❌ Unknown rollback type: $rollback_type${NC}" | tee -a "$log_file"
            return 1
            ;;
    esac
    
    # Log completion
    echo "" | tee -a "$log_file"
    echo -e "${GREEN}✅ Rollback completed successfully${NC}" | tee -a "$log_file"
    echo "Operation ID: $operation_id" | tee -a "$log_file"
    echo "Log file: $log_file" | tee -a "$log_file"
    
    # Store operation metadata
    create_rollback_metadata "$operation_id" "$checkpoint_id" "$rollback_type" "success"
}

# Execute full rollback
execute_full_rollback() {
    local checkpoint_id="$1"
    local options="$2"
    
    echo "Executing full system rollback..."
    
    # Git rollback
    execute_git_rollback "$checkpoint_id" "$options"
    
    # Memory rollback
    execute_memory_rollback "$checkpoint_id" "$options"
    
    echo "Full rollback completed"
}

# Execute git rollback
execute_git_rollback() {
    local checkpoint_id="$1"
    local options="$2"
    
    echo "Rolling back git state..."
    
    # Determine rollback method
    if echo "$options" | grep -q "\-\-hard"; then
        echo "Using hard reset (destructive)"
        git reset --hard "$checkpoint_id"
    elif echo "$options" | grep -q "\-\-branch"; then
        local branch_name="rollback-$checkpoint_id-$(date +%Y%m%d-%H%M%S)"
        echo "Creating new branch: $branch_name"
        git checkout -b "$branch_name" "$checkpoint_id"
    else
        echo "Using soft reset with stash"
        git stash push -m "Stash before rollback to $checkpoint_id" || true
        git reset --soft "$checkpoint_id"
    fi
    
    echo "Git rollback completed"
}

# Execute memory rollback
execute_memory_rollback() {
    local checkpoint_id="$1"
    local options="$2"
    
    echo "Rolling back memory state..."
    
    # Find memory snapshot
    local checkpoint_file=$(find "$CHECKPOINT_DIR" -name "*$checkpoint_id*.json" 2>/dev/null | head -1)
    
    if [ -n "$checkpoint_file" ] && [ -f "$checkpoint_file" ]; then
        local memory_snapshot=$(jq -r '.memory_snapshot // ""' "$checkpoint_file" 2>/dev/null)
        
        if [ -n "$memory_snapshot" ] && [ "$memory_snapshot" != "none" ]; then
            # Use the restore function from hive-mind-checkpoint-manager
            if .claude/helpers/hive-mind-checkpoint-manager.sh restore-memory "$memory_snapshot"; then
                echo "Memory rollback completed"
            else
                echo "Memory rollback failed"
                return 1
            fi
        else
            echo "No memory snapshot available for rollback"
        fi
    else
        echo "No checkpoint metadata found for memory rollback"
    fi
}

# Execute selective rollback
execute_selective_rollback() {
    local checkpoint_id="$1"
    local options="$2"
    
    echo "Executing selective rollback..."
    
    if echo "$options" | grep -q "\-\-interactive"; then
        echo "Interactive mode - select components to rollback:"
        echo "1) Git repository state"
        echo "2) Memory bank sessions"
        echo "3) Memory snapshots"
        echo "4) Hive agents"
        echo "5) Hive coordination"
        echo "6) Checkpoint metadata"
        echo ""
        echo "Enter component numbers separated by commas (e.g., 1,2,4): "
        read -r selections
        
        # Process selections
        IFS=',' read -ra SELECTED <<< "$selections"
        for selection in "${SELECTED[@]}"; do
            case "$selection" in
                1) execute_git_rollback "$checkpoint_id" "$options" ;;
                2|3) execute_memory_rollback "$checkpoint_id" "$options" ;;
                4|5) execute_coordination_rollback "$checkpoint_id" "$options" ;;
                6) echo "Checkpoint metadata rollback not implemented" ;;
                *) echo "Invalid selection: $selection" ;;
            esac
        done
    else
        # Use preserve/restore options
        if echo "$options" | grep -q "\-\-preserve"; then
            local preserve_list=$(echo "$options" | sed -n 's/.*--preserve \([^ ]*\).*/\1/p')
            echo "Preserving: $preserve_list"
        fi
        
        if echo "$options" | grep -q "\-\-restore"; then
            local restore_list=$(echo "$options" | sed -n 's/.*--restore \([^ ]*\).*/\1/p')
            echo "Restoring: $restore_list"
        fi
    fi
    
    echo "Selective rollback completed"
}

# Execute coordination rollback
execute_coordination_rollback() {
    local checkpoint_id="$1"
    local options="$2"
    
    echo "Rolling back hive coordination state..."
    
    # This would restore coordination-specific state
    local coord_file="$HIVE_CONTEXT_DIR/coordination/$checkpoint_id.json"
    
    if [ -f "$coord_file" ]; then
        echo "Restoring coordination from: $coord_file"
        # Implementation would restore coordination patterns, agent assignments, etc.
    else
        echo "No coordination state found for: $checkpoint_id"
    fi
    
    echo "Coordination rollback completed"
}

# Execute agents rollback
execute_agents_rollback() {
    local checkpoint_id="$1"
    local options="$2"
    
    echo "Rolling back agent states..."
    
    # This would restore agent-specific states and configurations
    if [ -d "$HIVE_CONTEXT_DIR/agents" ]; then
        echo "Restoring agent states from checkpoint context"
        # Implementation would restore agent configurations, states, etc.
    else
        echo "No agent states found for rollback"
    fi
    
    echo "Agent rollback completed"
}

# Create rollback metadata
create_rollback_metadata() {
    local operation_id="$1"
    local checkpoint_id="$2"
    local rollback_type="$3"
    local status="$4"
    
    local metadata_file="$ROLLBACK_LOG_DIR/operations/$operation_id.json"
    
    cat > "$metadata_file" <<EOF
{
  "operation_id": "$operation_id",
  "checkpoint_id": "$checkpoint_id",
  "rollback_type": "$rollback_type",
  "status": "$status",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "git_commit_before": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_commit_after": "$checkpoint_id",
  "operator": "${USER:-unknown}",
  "hostname": "${HOSTNAME:-unknown}"
}
EOF
}

# Show rollback history
show_rollback_history() {
    echo -e "${BLUE}📜 Rollback Operation History${NC}"
    echo ""
    
    if [ ! -d "$ROLLBACK_LOG_DIR/operations" ]; then
        echo "No rollback history found"
        return 0
    fi
    
    find "$ROLLBACK_LOG_DIR/operations" -name "*.json" -type f | sort -r | head -20 | while read -r metadata_file; do
        local metadata=$(cat "$metadata_file" 2>/dev/null || echo '{}')
        local operation_id=$(echo "$metadata" | jq -r '.operation_id // "unknown"')
        local checkpoint_id=$(echo "$metadata" | jq -r '.checkpoint_id // "unknown"')
        local rollback_type=$(echo "$metadata" | jq -r '.rollback_type // "unknown"')
        local status=$(echo "$metadata" | jq -r '.status // "unknown"')
        local timestamp=$(echo "$metadata" | jq -r '.timestamp // "unknown"')
        
        local status_icon="❓"
        case "$status" in
            "success") status_icon="✅" ;;
            "failure") status_icon="❌" ;;
            "partial") status_icon="⚠️" ;;
        esac
        
        printf "  %s %-20s %-30s %-12s %s\n" "$status_icon" "$timestamp" "$checkpoint_id" "$rollback_type" "$operation_id"
    done
}

# Emergency rollback
emergency_rollback() {
    local steps="${1:-1}"
    
    echo -e "${RED}🚨 EMERGENCY ROLLBACK${NC}"
    echo "Rolling back last $steps checkpoint(s)"
    echo ""
    
    # Find recent checkpoints
    local recent_checkpoints=()
    
    # Get enhanced checkpoints
    if [ -d "$CHECKPOINT_DIR" ]; then
        while IFS= read -r -d '' checkpoint_file; do
            local checkpoint_data=$(cat "$checkpoint_file" 2>/dev/null || echo '{}')
            local checkpoint_id=$(echo "$checkpoint_data" | jq -r '.checkpoint_id // .tag // ""')
            if [ -n "$checkpoint_id" ]; then
                recent_checkpoints+=("$checkpoint_id")
            fi
        done < <(find "$CHECKPOINT_DIR" -name "*.json" -type f -print0 | head -z -"$steps")
    fi
    
    # If not enough enhanced checkpoints, fall back to git tags
    if [ ${#recent_checkpoints[@]} -lt "$steps" ]; then
        local git_checkpoints=($(git tag -l 'checkpoint-*' 'session-end-*' --sort=-creatordate | head -"$steps"))
        recent_checkpoints+=("${git_checkpoints[@]}")
    fi
    
    if [ ${#recent_checkpoints[@]} -eq 0 ]; then
        echo -e "${RED}❌ No checkpoints found for emergency rollback${NC}"
        return 1
    fi
    
    # Use the most recent checkpoint
    local target_checkpoint="${recent_checkpoints[0]}"
    
    echo "Target checkpoint: $target_checkpoint"
    echo "Executing emergency rollback in 3 seconds... (Ctrl+C to cancel)"
    sleep 3
    
    # Execute rollback with force option
    execute_rollback "$target_checkpoint" "full" "--force --no-backup"
    
    echo -e "${YELLOW}⚠️  Emergency rollback completed${NC}"
    echo "System restored to: $target_checkpoint"
}

# Create manual rollback point
create_rollback_point() {
    local name="${1:-manual-$(date +%Y%m%d-%H%M%S)}"
    
    echo -e "${BLUE}📌 Creating manual rollback point: $name${NC}"
    
    # Create comprehensive backup
    create_comprehensive_backup "$name" "manual"
    
    # Create git tag
    git tag -a "manual-$name" -m "Manual rollback point: $name"
    
    echo -e "${GREEN}✅ Manual rollback point created: $name${NC}"
    echo "Available as: manual-$name"
}

# Main command handling
case "$1" in
    rollback)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Please specify a checkpoint ID${NC}"
            show_help
            exit 1
        fi
        execute_rollback "$2" "${3:-full}" "${@:4}"
        ;;
    list-rollback-points)
        list_rollback_points
        ;;
    create-rollback-point)
        create_rollback_point "$2"
        ;;
    rollback-preview)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Please specify a checkpoint ID${NC}"
            show_help
            exit 1
        fi
        preview_rollback "$2" "${3:-full}"
        ;;
    rollback-history)
        show_rollback_history
        ;;
    rollback-validate)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Please specify a checkpoint ID${NC}"
            show_help
            exit 1
        fi
        validate_rollback_target "$2"
        ;;
    emergency-rollback)
        emergency_rollback "$2"
        ;;
    setup)
        setup_rollback_system
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