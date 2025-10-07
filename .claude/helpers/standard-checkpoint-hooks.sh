#!/bin/bash
# Enhanced checkpoint hook functions with hive mind memory management
# Supports both standard checkpoints and distributed memory operations

# Configuration
MEMORY_BANK_DIR=".claude/memory-bank"
HIVE_CONTEXT_DIR=".claude/hive-context"
MEMORY_COMPRESSION_THRESHOLD=50  # MB
MAX_MEMORY_SESSIONS=100

# Memory management functions
setup_memory_infrastructure() {
    mkdir -p "$MEMORY_BANK_DIR"/{sessions,snapshots,compressed,temp}
    mkdir -p "$HIVE_CONTEXT_DIR"/{agents,coordination,patterns}
    mkdir -p .claude/checkpoints/{memory,hive-mind,validation}
}

# Memory snapshot creation
create_memory_snapshot() {
    local snapshot_id="$1"
    local checkpoint_type="$2"
    local timestamp=$(date +%s)
    
    if [ -d "$MEMORY_BANK_DIR/sessions" ]; then
        # Create memory snapshot
        tar -czf "$MEMORY_BANK_DIR/snapshots/memory-$snapshot_id-$timestamp.tar.gz" \
            "$MEMORY_BANK_DIR/sessions" "$HIVE_CONTEXT_DIR" 2>/dev/null || true
        
        # Store snapshot metadata
        cat > "$MEMORY_BANK_DIR/snapshots/metadata-$snapshot_id-$timestamp.json" <<EOF
{
  "snapshot_id": "$snapshot_id",
  "checkpoint_type": "$checkpoint_type",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "memory_size": $(du -sb "$MEMORY_BANK_DIR/sessions" 2>/dev/null | cut -f1 || echo 0),
  "hive_context_size": $(du -sb "$HIVE_CONTEXT_DIR" 2>/dev/null | cut -f1 || echo 0),
  "compression": "gzip",
  "retention_days": 30
}
EOF
        echo "📸 Created memory snapshot: memory-$snapshot_id-$timestamp"
    fi
}

# Memory validation
validate_memory_state() {
    local validation_id="memory-validation-$(date +%s)"
    local validation_file=".claude/checkpoints/validation/$validation_id.json"
    
    mkdir -p .claude/checkpoints/validation
    
    # Check memory bank integrity
    local memory_sessions=$(find "$MEMORY_BANK_DIR/sessions" -name "*.json" 2>/dev/null | wc -l || echo 0)
    local hive_agents=$(find "$HIVE_CONTEXT_DIR/agents" -name "*.json" 2>/dev/null | wc -l || echo 0)
    local memory_size=$(du -sb "$MEMORY_BANK_DIR" 2>/dev/null | cut -f1 || echo 0)
    
    # Validate JSON integrity
    local corrupted_files=0
    if [ -d "$MEMORY_BANK_DIR/sessions" ]; then
        for json_file in $(find "$MEMORY_BANK_DIR" -name "*.json" 2>/dev/null); do
            if ! jq empty "$json_file" 2>/dev/null; then
                corrupted_files=$((corrupted_files + 1))
            fi
        done
    fi
    
    # Store validation results
    cat > "$validation_file" <<EOF
{
  "validation_id": "$validation_id",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "memory_sessions": $memory_sessions,
  "hive_agents": $hive_agents,
  "memory_size_bytes": $memory_size,
  "corrupted_files": $corrupted_files,
  "status": "$([ $corrupted_files -eq 0 ] && echo 'healthy' || echo 'corrupted')",
  "requires_compression": $([ $memory_size -gt $((MEMORY_COMPRESSION_THRESHOLD * 1024 * 1024)) ] && echo 'true' || echo 'false')
}
EOF
    
    if [ $corrupted_files -eq 0 ]; then
        echo "✅ Memory validation passed: $validation_id"
    else
        echo "⚠️  Memory validation found $corrupted_files corrupted files: $validation_id"
    fi
    
    echo "$validation_file"
}

# Memory compression for long-running sessions
compress_memory_sessions() {
    local compression_threshold_days=${1:-7}
    local compressed_count=0
    
    # Find old session files
    if [ -d "$MEMORY_BANK_DIR/sessions" ]; then
        find "$MEMORY_BANK_DIR/sessions" -name "*.json" -mtime +$compression_threshold_days -type f | while read -r session_file; do
            local basename=$(basename "$session_file" .json)
            local compressed_file="$MEMORY_BANK_DIR/compressed/${basename}.json.gz"
            
            # Compress the file
            gzip -c "$session_file" > "$compressed_file"
            
            # Verify compression integrity
            if gzip -t "$compressed_file" 2>/dev/null; then
                rm "$session_file"
                compressed_count=$((compressed_count + 1))
            else
                rm "$compressed_file"
                echo "⚠️  Failed to compress $session_file"
            fi
        done
    fi
    
    echo "🗜️  Compressed $compressed_count memory session files older than $compression_threshold_days days"
}

# Context preservation trigger
trigger_context_preservation() {
    local context_type="$1"
    local context_data="$2"
    local preservation_id="context-$(date +%s)"
    
    # Store context preservation data
    cat > "$HIVE_CONTEXT_DIR/preservation-$preservation_id.json" <<EOF
{
  "preservation_id": "$preservation_id",
  "context_type": "$context_type",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "data": $context_data,
  "preserved_by": "checkpoint-system"
}
EOF
    
    echo "📋 Context preserved: $preservation_id ($context_type)"
}

# Function to handle pre-edit checkpoints with memory management
pre_edit_checkpoint() {
    local tool_input="$1"
    local file=$(echo "$tool_input" | jq -r '.file_path // empty')
    
    # Setup memory infrastructure if needed
    setup_memory_infrastructure
    
    if [ -n "$file" ]; then
        local checkpoint_branch="checkpoint/pre-edit-$(date +%Y%m%d-%H%M%S)"
        local current_branch=$(git branch --show-current)
        
        # Create checkpoint
        git add -A
        git stash push -m "Pre-edit checkpoint for $file" >/dev/null 2>&1
        git branch "$checkpoint_branch"
        
        # Store metadata with memory integration
        mkdir -p .claude/checkpoints
        local checkpoint_id="pre-edit-$(date +%s)"
        
        # Create memory snapshot
        create_memory_snapshot "$checkpoint_id" "pre-edit"
        
        # Validate memory state
        local validation_file=$(validate_memory_state)
        
        cat > ".claude/checkpoints/$checkpoint_id.json" <<EOF
{
  "checkpoint_id": "$checkpoint_id",
  "branch": "$checkpoint_branch",
  "file": "$file",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "type": "pre-edit",
  "original_branch": "$current_branch",
  "memory_snapshot": "memory-$checkpoint_id",
  "memory_validation": "$(basename "$validation_file")",
  "hive_mind_enabled": true
}
EOF
        
        # Restore working directory
        git stash pop --quiet >/dev/null 2>&1 || true
        
        echo "✅ Created checkpoint: $checkpoint_branch for $file"
    fi
}

# Function to handle post-edit checkpoints
post_edit_checkpoint() {
    local tool_input="$1"
    local file=$(echo "$tool_input" | jq -r '.file_path // empty')
    
    if [ -n "$file" ] && [ -f "$file" ]; then
        # Check if file was modified - first check if file is tracked
        if ! git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
            # File is not tracked, add it first
            git add "$file"
        fi
        
        # Now check if there are changes
        if git diff --cached --quiet "$file" 2>/dev/null && git diff --quiet "$file" 2>/dev/null; then
            echo "ℹ️  No changes to checkpoint for $file"
        else
            local tag_name="checkpoint-$(date +%Y%m%d-%H%M%S)"
            local current_branch=$(git branch --show-current)
            
            # Create commit
            git add "$file"
            if git commit -m "🔖 Checkpoint: Edit $file

Automatic checkpoint created by Claude
- File: $file
- Branch: $current_branch
- Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)

[Auto-checkpoint]" --quiet; then
                # Create tag only if commit succeeded
                git tag -a "$tag_name" -m "Checkpoint after editing $file"
                
                # Store metadata with memory integration
                mkdir -p .claude/checkpoints
                local diff_stats=$(git diff HEAD~1 --stat | tr '\n' ' ' | sed 's/"/\"/g')
                local checkpoint_id="post-edit-$(date +%s)"
                
                # Create memory snapshot
                create_memory_snapshot "$checkpoint_id" "post-edit"
                
                # Trigger context preservation
                local context_data="{\"file\": \"$file\", \"changes\": \"$diff_stats\"}"
                trigger_context_preservation "file-edit" "$context_data"
                
                # Validate memory state
                local validation_file=$(validate_memory_state)
                
                cat > ".claude/checkpoints/$checkpoint_id.json" <<EOF
{
  "checkpoint_id": "$checkpoint_id",
  "tag": "$tag_name",
  "file": "$file",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "type": "post-edit",
  "branch": "$current_branch",
  "diff_summary": "$diff_stats",
  "memory_snapshot": "memory-$checkpoint_id",
  "memory_validation": "$(basename "$validation_file")",
  "context_preserved": true,
  "hive_mind_enabled": true
}
EOF
                
                echo "✅ Created checkpoint: $tag_name for $file"
            else
                echo "ℹ️  No commit created (no changes or commit failed)"
            fi
        fi
    fi
}

# Function to handle task checkpoints
task_checkpoint() {
    local user_prompt="$1"
    local task=$(echo "$user_prompt" | head -c 100 | tr '\n' ' ')
    
    if [ -n "$task" ]; then
        local checkpoint_name="task-$(date +%Y%m%d-%H%M%S)"
        
        # Commit current state
        git add -A
        git commit -m "🔖 Task checkpoint: $task..." --quiet || true
        
        # Store metadata with memory integration
        mkdir -p .claude/checkpoints
        local checkpoint_id="task-$(date +%s)"
        
        # Create memory snapshot for task boundary
        create_memory_snapshot "$checkpoint_id" "task"
        
        # Trigger context preservation for task
        local context_data="{\"task_summary\": \"$task\", \"commit\": \"$(git rev-parse HEAD)\"}"
        trigger_context_preservation "task-boundary" "$context_data"
        
        # Check if memory compression is needed
        local memory_size=$(du -sb "$MEMORY_BANK_DIR" 2>/dev/null | cut -f1 || echo 0)
        if [ $memory_size -gt $((MEMORY_COMPRESSION_THRESHOLD * 1024 * 1024)) ]; then
            compress_memory_sessions 7
        fi
        
        cat > ".claude/checkpoints/$checkpoint_id.json" <<EOF
{
  "checkpoint_id": "$checkpoint_id",
  "checkpoint": "$checkpoint_name",
  "task": "$task",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "commit": "$(git rev-parse HEAD)",
  "memory_snapshot": "memory-$checkpoint_id",
  "context_preserved": true,
  "memory_compressed": $([ $memory_size -gt $((MEMORY_COMPRESSION_THRESHOLD * 1024 * 1024)) ] && echo 'true' || echo 'false'),
  "hive_mind_enabled": true
}
EOF
        
        echo "✅ Created task checkpoint: $checkpoint_name"
    fi
}

# Memory cleanup strategies
perform_memory_cleanup() {
    local retention_days=${1:-30}
    local cleanup_report=".claude/checkpoints/memory-cleanup-$(date +%s).json"
    
    # Clean old memory snapshots
    local snapshots_cleaned=0
    if [ -d "$MEMORY_BANK_DIR/snapshots" ]; then
        snapshots_cleaned=$(find "$MEMORY_BANK_DIR/snapshots" -name "*.tar.gz" -mtime +$retention_days -delete -print | wc -l)
        find "$MEMORY_BANK_DIR/snapshots" -name "metadata-*.json" -mtime +$retention_days -delete
    fi
    
    # Clean old compressed sessions
    local compressed_cleaned=0
    if [ -d "$MEMORY_BANK_DIR/compressed" ]; then
        compressed_cleaned=$(find "$MEMORY_BANK_DIR/compressed" -name "*.json.gz" -mtime +$retention_days -delete -print | wc -l)
    fi
    
    # Clean temporary files
    if [ -d "$MEMORY_BANK_DIR/temp" ]; then
        rm -f "$MEMORY_BANK_DIR/temp"/*
    fi
    
    # Generate cleanup report
    cat > "$cleanup_report" <<EOF
{
  "cleanup_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "retention_days": $retention_days,
  "snapshots_cleaned": $snapshots_cleaned,
  "compressed_files_cleaned": $compressed_cleaned,
  "temp_files_cleaned": true,
  "total_space_freed_mb": "estimated_$(( (snapshots_cleaned + compressed_cleaned) * 5 ))"
}
EOF
    
    echo "🧹 Memory cleanup completed: $snapshots_cleaned snapshots, $compressed_cleaned compressed files"
}

# Function to handle session end with enhanced memory management
session_end_checkpoint() {
    local session_id="session-$(date +%Y%m%d-%H%M%S)"
    local summary_file=".claude/checkpoints/summary-$session_id.md"
    
    # Setup memory infrastructure
    setup_memory_infrastructure
    
    # Create comprehensive memory snapshot
    create_memory_snapshot "$session_id" "session-end"
    
    # Perform final memory validation
    local validation_file=$(validate_memory_state)
    
    # Compress old sessions
    compress_memory_sessions 3
    
    # Perform memory cleanup
    perform_memory_cleanup 30
    
    mkdir -p .claude/checkpoints
    
    # Create enhanced summary with memory statistics
    local memory_stats=$(cat <<EOF
## Memory Bank Statistics
- Active Sessions: $(find "$MEMORY_BANK_DIR/sessions" -name "*.json" 2>/dev/null | wc -l)
- Memory Snapshots: $(find "$MEMORY_BANK_DIR/snapshots" -name "*.tar.gz" 2>/dev/null | wc -l)
- Compressed Sessions: $(find "$MEMORY_BANK_DIR/compressed" -name "*.json.gz" 2>/dev/null | wc -l)
- Hive Context Entries: $(find "$HIVE_CONTEXT_DIR" -name "*.json" 2>/dev/null | wc -l)
- Total Memory Size: $(du -sh "$MEMORY_BANK_DIR" 2>/dev/null | cut -f1)B
- Last Validation: $(basename "$validation_file")
EOF
)
    
    cat > "$summary_file" <<EOF
# Enhanced Session Summary - $(date +'%Y-%m-%d %H:%M:%S')

## Checkpoints Created
$(find .claude/checkpoints -name '*.json' -mtime -1 -exec basename {} \; | sort)

## Files Modified
$(git diff --name-only $(git log --format=%H -n 1 --before="1 hour ago" 2>/dev/null) 2>/dev/null || echo "No files tracked")

## Recent Commits
$(git log --oneline -10 --grep="Checkpoint" || echo "No checkpoint commits")

$memory_stats

## Hive Mind Memory Operations
- Memory snapshots created during session
- Context preservation triggers activated
- Memory validation performed
- Compression applied to old sessions
- Cleanup performed on expired data

## Rollback Instructions
To rollback to a specific checkpoint with memory restoration:
\`\`\`bash
# List all checkpoints with memory support
.claude/helpers/hive-mind-checkpoint-manager.sh list --memory

# Rollback to a checkpoint with memory restoration
.claude/helpers/hive-mind-checkpoint-manager.sh rollback checkpoint-YYYYMMDD-HHMMSS --restore-memory

# Traditional git rollback (memory state not restored)
git checkout checkpoint-YYYYMMDD-HHMMSS
\`\`\`

## Memory Management Commands
\`\`\`bash
# Validate current memory state
.claude/helpers/standard-checkpoint-hooks.sh validate-memory

# Compress old memory sessions
.claude/helpers/standard-checkpoint-hooks.sh compress-memory [days]

# Clean up expired memory data
.claude/helpers/standard-checkpoint-hooks.sh cleanup-memory [retention_days]
\`\`\`
EOF
    
    # Store comprehensive session metadata
    local session_metadata=".claude/checkpoints/session-$session_id.json"
    cat > "$session_metadata" <<EOF
{
  "session_id": "$session_id",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "type": "session-end",
  "memory_snapshot": "memory-$session_id",
  "memory_validation": "$(basename "$validation_file")",
  "memory_compressed": true,
  "memory_cleanup_performed": true,
  "hive_mind_enabled": true,
  "summary_file": "$(basename "$summary_file")"
}
EOF
    
    # Create final checkpoint
    git add -A
    git commit -m "🏁 Enhanced session end checkpoint: $session_id

Memory management:
- Memory snapshot created
- Context preserved
- Memory validation performed
- Compression applied
- Cleanup completed

[Hive-Mind-Checkpoint]" --quiet || true
    git tag -a "session-end-$session_id" -m "End of Claude session with memory management"
    
    echo "✅ Enhanced session summary saved to: $summary_file"
    echo "📌 Final checkpoint with memory: session-end-$session_id"
    echo "🧠 Memory snapshot: memory-$session_id"
    echo "📊 Memory validation: $(basename "$validation_file")"
}

# Main entry point with extended commands
case "$1" in
    pre-edit)
        pre_edit_checkpoint "$2"
        ;;
    post-edit)
        post_edit_checkpoint "$2"
        ;;
    task)
        task_checkpoint "$2"
        ;;
    session-end)
        session_end_checkpoint
        ;;
    validate-memory)
        validate_memory_state
        ;;
    compress-memory)
        compress_memory_sessions "${2:-7}"
        ;;
    cleanup-memory)
        perform_memory_cleanup "${2:-30}"
        ;;
    create-snapshot)
        create_memory_snapshot "${2:-manual-$(date +%s)}" "${3:-manual}"
        ;;
    setup-infrastructure)
        setup_memory_infrastructure
        echo "✅ Memory infrastructure setup completed"
        ;;
    *)
        echo "Usage: $0 {pre-edit|post-edit|task|session-end|validate-memory|compress-memory|cleanup-memory|create-snapshot|setup-infrastructure} [input]"
        echo ""
        echo "Memory management commands:"
        echo "  validate-memory              - Validate current memory state"
        echo "  compress-memory [days]       - Compress memory sessions older than [days] (default: 7)"
        echo "  cleanup-memory [days]        - Clean up memory data older than [days] (default: 30)"
        echo "  create-snapshot [id] [type]  - Create manual memory snapshot"
        echo "  setup-infrastructure         - Setup memory bank infrastructure"
        exit 1
        ;;
esac
