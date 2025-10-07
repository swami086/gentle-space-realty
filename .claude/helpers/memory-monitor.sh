#!/bin/bash
# Memory Monitor for Hive Mind Checkpoint System
# Real-time monitoring of memory usage and performance with automated alerts

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
MONITOR_DIR=".claude/monitoring"
ALERT_THRESHOLD_MB=100
CRITICAL_THRESHOLD_MB=500
MONITOR_INTERVAL=5  # seconds

# Performance thresholds
MEMORY_GROWTH_THRESHOLD=10  # MB per minute
SESSION_COUNT_THRESHOLD=50
CORRUPTED_FILES_THRESHOLD=5
RESPONSE_TIME_THRESHOLD=2000  # milliseconds

# Help function
show_help() {
    cat << EOF
Memory Monitor for Hive Mind Checkpoint System
==============================================

Usage: $0 <command> [options]

Commands:
  status                    Show current memory status
  monitor [duration]        Start real-time monitoring (default: continuous)
  alerts                    Show recent alerts and warnings
  performance              Show performance metrics
  health-check             Run comprehensive health check
  optimize                 Run memory optimization
  report                   Generate detailed memory report
  dashboard               Start interactive monitoring dashboard

Options:
  --interval <seconds>     Monitoring interval (default: 5)
  --threshold <MB>         Alert threshold in MB (default: 100)
  --critical <MB>          Critical threshold in MB (default: 500)
  --json                   Output in JSON format
  --continuous             Run monitoring continuously
  --quiet                  Suppress non-critical output

Examples:
  $0 status
  $0 monitor 300 --interval 10
  $0 health-check --json
  $0 dashboard
EOF
}

# Setup monitoring infrastructure
setup_monitoring() {
    mkdir -p "$MONITOR_DIR"/{logs,alerts,reports,metrics}
    
    # Create monitoring configuration
    cat > "$MONITOR_DIR/config.json" <<EOF
{
  "alert_threshold_mb": $ALERT_THRESHOLD_MB,
  "critical_threshold_mb": $CRITICAL_THRESHOLD_MB,
  "monitor_interval": $MONITOR_INTERVAL,
  "memory_growth_threshold": $MEMORY_GROWTH_THRESHOLD,
  "session_count_threshold": $SESSION_COUNT_THRESHOLD,
  "corrupted_files_threshold": $CORRUPTED_FILES_THRESHOLD,
  "response_time_threshold": $RESPONSE_TIME_THRESHOLD,
  "retention_days": 30,
  "auto_optimize": true
}
EOF
    
    echo -e "${GREEN}📊 Monitoring infrastructure setup complete${NC}"
}

# Get current memory status
get_memory_status() {
    local json_output="$1"
    
    # Calculate sizes
    local memory_size=0
    local hive_size=0
    local checkpoint_size=0
    
    if [ -d "$MEMORY_BANK_DIR" ]; then
        memory_size=$(du -sb "$MEMORY_BANK_DIR" 2>/dev/null | cut -f1 || echo 0)
    fi
    
    if [ -d "$HIVE_CONTEXT_DIR" ]; then
        hive_size=$(du -sb "$HIVE_CONTEXT_DIR" 2>/dev/null | cut -f1 || echo 0)
    fi
    
    if [ -d "$CHECKPOINT_DIR" ]; then
        checkpoint_size=$(du -sb "$CHECKPOINT_DIR" 2>/dev/null | cut -f1 || echo 0)
    fi
    
    # Count files
    local memory_sessions=$(find "$MEMORY_BANK_DIR/sessions" -name "*.json" 2>/dev/null | wc -l || echo 0)
    local memory_snapshots=$(find "$MEMORY_BANK_DIR/snapshots" -name "*.tar.gz" 2>/dev/null | wc -l || echo 0)
    local compressed_sessions=$(find "$MEMORY_BANK_DIR/compressed" -name "*.json.gz" 2>/dev/null | wc -l || echo 0)
    local hive_agents=$(find "$HIVE_CONTEXT_DIR/agents" -name "*.json" 2>/dev/null | wc -l || echo 0)
    local coordination_points=$(find "$HIVE_CONTEXT_DIR/coordination" -name "*.json" 2>/dev/null | wc -l || echo 0)
    
    # Check for corrupted files
    local corrupted_count=0
    if [ -d "$MEMORY_BANK_DIR" ]; then
        for json_file in $(find "$MEMORY_BANK_DIR" -name "*.json" 2>/dev/null); do
            if ! jq empty "$json_file" 2>/dev/null; then
                corrupted_count=$((corrupted_count + 1))
            fi
        done
    fi
    
    # Calculate totals in MB
    local total_size=$((memory_size + hive_size + checkpoint_size))
    local total_mb=$((total_size / 1024 / 1024))
    
    # Determine status
    local status="healthy"
    local alert_level="none"
    
    if [ $total_mb -gt $CRITICAL_THRESHOLD_MB ]; then
        status="critical"
        alert_level="critical"
    elif [ $total_mb -gt $ALERT_THRESHOLD_MB ]; then
        status="warning"
        alert_level="warning"
    elif [ $corrupted_count -gt $CORRUPTED_FILES_THRESHOLD ]; then
        status="corrupted"
        alert_level="error"
    fi
    
    if [ "$json_output" = "--json" ]; then
        cat <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "$status",
  "alert_level": "$alert_level",
  "total_size_mb": $total_mb,
  "memory_bank": {
    "size_mb": $((memory_size / 1024 / 1024)),
    "sessions": $memory_sessions,
    "snapshots": $memory_snapshots,
    "compressed": $compressed_sessions
  },
  "hive_context": {
    "size_mb": $((hive_size / 1024 / 1024)),
    "agents": $hive_agents,
    "coordination_points": $coordination_points
  },
  "checkpoints": {
    "size_mb": $((checkpoint_size / 1024 / 1024))
  },
  "corrupted_files": $corrupted_count,
  "thresholds": {
    "alert_mb": $ALERT_THRESHOLD_MB,
    "critical_mb": $CRITICAL_THRESHOLD_MB
  }
}
EOF
    else
        echo -e "${BLUE}🧠 Hive Mind Memory Status${NC}"
        echo ""
        echo -e "${YELLOW}Overall Status:${NC} $status"
        echo -e "${YELLOW}Total Memory Usage:${NC} ${total_mb}MB"
        echo ""
        echo -e "${CYAN}Memory Bank:${NC}"
        echo "  Size: $((memory_size / 1024 / 1024))MB"
        echo "  Active Sessions: $memory_sessions"
        echo "  Snapshots: $memory_snapshots"
        echo "  Compressed: $compressed_sessions"
        echo ""
        echo -e "${CYAN}Hive Context:${NC}"
        echo "  Size: $((hive_size / 1024 / 1024))MB"
        echo "  Active Agents: $hive_agents"
        echo "  Coordination Points: $coordination_points"
        echo ""
        echo -e "${CYAN}Checkpoints:${NC}"
        echo "  Size: $((checkpoint_size / 1024 / 1024))MB"
        echo ""
        
        if [ $corrupted_count -gt 0 ]; then
            echo -e "${RED}⚠️  Corrupted Files: $corrupted_count${NC}"
        fi
        
        if [ "$status" != "healthy" ]; then
            echo -e "${YELLOW}Status Details:${NC}"
            case "$status" in
                "warning")
                    echo "  Memory usage above alert threshold (${ALERT_THRESHOLD_MB}MB)"
                    ;;
                "critical")
                    echo "  Memory usage above critical threshold (${CRITICAL_THRESHOLD_MB}MB)"
                    echo "  Immediate optimization recommended"
                    ;;
                "corrupted")
                    echo "  Corrupted files detected, validation needed"
                    ;;
            esac
        fi
    fi
    
    # Return status code based on alert level
    case "$alert_level" in
        "critical") return 2 ;;
        "warning"|"error") return 1 ;;
        *) return 0 ;;
    esac
}

# Real-time monitoring
start_monitoring() {
    local duration="$1"
    local interval="${2:-$MONITOR_INTERVAL}"
    local quiet="$3"
    
    setup_monitoring
    
    echo -e "${BLUE}🔍 Starting memory monitoring${NC}"
    if [ -n "$duration" ]; then
        echo "Duration: ${duration}s, Interval: ${interval}s"
    else
        echo "Duration: Continuous, Interval: ${interval}s"
    fi
    echo ""
    
    local start_time=$(date +%s)
    local end_time=$((start_time + duration))
    local iteration=0
    
    # Create log file
    local log_file="$MONITOR_DIR/logs/monitor-$(date +%Y%m%d-%H%M%S).log"
    
    while true; do
        local current_time=$(date +%s)
        
        # Check if we should stop (if duration is specified)
        if [ -n "$duration" ] && [ $current_time -ge $end_time ]; then
            break
        fi
        
        iteration=$((iteration + 1))
        
        # Get current status
        local status_json=$(get_memory_status --json)
        echo "$status_json" >> "$log_file"
        
        # Parse status for alerts
        local alert_level=$(echo "$status_json" | jq -r '.alert_level')
        local total_mb=$(echo "$status_json" | jq -r '.total_size_mb')
        local corrupted=$(echo "$status_json" | jq -r '.corrupted_files')
        
        # Display status (if not quiet)
        if [ "$quiet" != "--quiet" ]; then
            echo -e "${CYAN}[$(date +'%H:%M:%S')] Iteration $iteration:${NC} ${total_mb}MB total"
        fi
        
        # Check for alerts
        case "$alert_level" in
            "critical")
                echo -e "${RED}🚨 CRITICAL: Memory usage critical (${total_mb}MB)${NC}"
                log_alert "critical" "Memory usage critical: ${total_mb}MB"
                ;;
            "warning")
                echo -e "${YELLOW}⚠️  WARNING: Memory usage high (${total_mb}MB)${NC}"
                log_alert "warning" "Memory usage high: ${total_mb}MB"
                ;;
            "error")
                echo -e "${RED}❌ ERROR: $corrupted corrupted files detected${NC}"
                log_alert "error" "Corrupted files detected: $corrupted"
                ;;
        esac
        
        # Sleep for interval
        sleep "$interval"
    done
    
    echo -e "${GREEN}✅ Monitoring completed. Log saved to: $log_file${NC}"
}

# Log alerts
log_alert() {
    local level="$1"
    local message="$2"
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    
    local alert_file="$MONITOR_DIR/alerts/alerts.json"
    
    # Create or append to alerts file
    if [ ! -f "$alert_file" ]; then
        echo '[]' > "$alert_file"
    fi
    
    # Add new alert
    local new_alert="{\"timestamp\": \"$timestamp\", \"level\": \"$level\", \"message\": \"$message\"}"
    local updated_alerts=$(jq ". += [$new_alert]" "$alert_file")
    echo "$updated_alerts" > "$alert_file"
}

# Show recent alerts
show_alerts() {
    local alert_file="$MONITOR_DIR/alerts/alerts.json"
    
    if [ ! -f "$alert_file" ]; then
        echo -e "${GREEN}✅ No alerts recorded${NC}"
        return 0
    fi
    
    echo -e "${BLUE}🚨 Recent Alerts${NC}"
    echo ""
    
    # Show last 20 alerts
    jq -r '.[-20:] | .[] | "\(.timestamp) [\(.level | ascii_upcase)] \(.message)"' "$alert_file" | while read -r alert; do
        local level=$(echo "$alert" | sed -n 's/.*\[\(.*\)\].*/\1/p')
        case "$level" in
            "CRITICAL")
                echo -e "${RED}$alert${NC}"
                ;;
            "WARNING")
                echo -e "${YELLOW}$alert${NC}"
                ;;
            "ERROR")
                echo -e "${RED}$alert${NC}"
                ;;
            *)
                echo "$alert"
                ;;
        esac
    done
}

# Performance metrics
show_performance() {
    echo -e "${BLUE}📈 Performance Metrics${NC}"
    echo ""
    
    # Memory growth rate (based on recent logs)
    local log_dir="$MONITOR_DIR/logs"
    if [ -d "$log_dir" ]; then
        local recent_log=$(find "$log_dir" -name "monitor-*.log" -type f | sort | tail -1)
        if [ -n "$recent_log" ]; then
            local growth_rate=$(calculate_memory_growth "$recent_log")
            echo -e "${CYAN}Memory Growth Rate:${NC} ${growth_rate}MB/min"
        fi
    fi
    
    # File operation times
    echo -e "${CYAN}File Operation Performance:${NC}"
    time_operation "Memory validation" ".claude/helpers/standard-checkpoint-hooks.sh validate-memory"
    time_operation "Memory snapshot" ".claude/helpers/standard-checkpoint-hooks.sh create-snapshot test manual"
    
    # Disk I/O performance
    if command -v iostat >/dev/null 2>&1; then
        echo -e "${CYAN}Disk I/O Performance:${NC}"
        iostat -x 1 1 | grep -E "(Device|\.claude)" | head -5
    fi
}

# Calculate memory growth rate from logs
calculate_memory_growth() {
    local log_file="$1"
    
    # Get first and last entries
    local first_entry=$(head -1 "$log_file")
    local last_entry=$(tail -1 "$log_file")
    
    if [ -n "$first_entry" ] && [ -n "$last_entry" ]; then
        local first_size=$(echo "$first_entry" | jq -r '.total_size_mb // 0')
        local last_size=$(echo "$last_entry" | jq -r '.total_size_mb // 0')
        local first_time=$(echo "$first_entry" | jq -r '.timestamp')
        local last_time=$(echo "$last_entry" | jq -r '.timestamp')
        
        # Calculate time difference in minutes
        local time_diff=$(( ($(date -d "$last_time" +%s) - $(date -d "$first_time" +%s)) / 60 ))
        
        if [ $time_diff -gt 0 ]; then
            local growth=$(( (last_size - first_size) / time_diff ))
            echo "$growth"
        else
            echo "0"
        fi
    else
        echo "0"
    fi
}

# Time an operation
time_operation() {
    local description="$1"
    local command="$2"
    
    local start_time=$(date +%s%3N)
    eval "$command" >/dev/null 2>&1
    local end_time=$(date +%s%3N)
    
    local duration=$((end_time - start_time))
    
    if [ $duration -gt $RESPONSE_TIME_THRESHOLD ]; then
        echo -e "  ${RED}$description: ${duration}ms (SLOW)${NC}"
    else
        echo "  $description: ${duration}ms"
    fi
}

# Comprehensive health check
health_check() {
    local json_output="$1"
    
    echo -e "${BLUE}🏥 Comprehensive Health Check${NC}"
    echo ""
    
    # Check memory status
    local memory_status=$(get_memory_status --json)
    local memory_health=$(echo "$memory_status" | jq -r '.status')
    
    # Check file integrity
    echo "Checking file integrity..."
    local integrity_result=$(.claude/helpers/standard-checkpoint-hooks.sh validate-memory 2>/dev/null)
    local validation_file=$(echo "$integrity_result" | grep -o '/[^ ]*validation[^ ]*\.json' | head -1)
    local integrity_status="healthy"
    
    if [ -n "$validation_file" ] && [ -f "$validation_file" ]; then
        local corrupted=$(jq -r '.corrupted_files // 0' "$validation_file")
        if [ "$corrupted" -gt 0 ]; then
            integrity_status="corrupted"
        fi
    fi
    
    # Check performance
    echo "Checking performance..."
    local perf_start=$(date +%s%3N)
    .claude/helpers/standard-checkpoint-hooks.sh validate-memory >/dev/null 2>&1
    local perf_end=$(date +%s%3N)
    local validation_time=$((perf_end - perf_start))
    
    local performance_status="good"
    if [ $validation_time -gt $RESPONSE_TIME_THRESHOLD ]; then
        performance_status="slow"
    fi
    
    # Check disk space
    local available_space=$(df "$PWD" | tail -1 | awk '{print $4}')
    local available_mb=$((available_space / 1024))
    local disk_status="sufficient"
    
    if [ $available_mb -lt 1000 ]; then
        disk_status="low"
    fi
    
    # Overall health assessment
    local overall_health="healthy"
    if [ "$memory_health" = "critical" ] || [ "$integrity_status" = "corrupted" ]; then
        overall_health="critical"
    elif [ "$memory_health" = "warning" ] || [ "$performance_status" = "slow" ] || [ "$disk_status" = "low" ]; then
        overall_health="warning"
    fi
    
    if [ "$json_output" = "--json" ]; then
        cat <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "overall_health": "$overall_health",
  "memory_health": "$memory_health",
  "integrity_status": "$integrity_status",
  "performance_status": "$performance_status",
  "disk_status": "$disk_status",
  "validation_time_ms": $validation_time,
  "available_disk_mb": $available_mb,
  "recommendations": $(generate_recommendations "$overall_health" "$memory_health" "$integrity_status" "$performance_status" "$disk_status")
}
EOF
    else
        echo -e "${YELLOW}Health Status:${NC}"
        echo "  Overall: $overall_health"
        echo "  Memory: $memory_health"
        echo "  File Integrity: $integrity_status"
        echo "  Performance: $performance_status ($validation_time ms)"
        echo "  Disk Space: $disk_status (${available_mb}MB available)"
        echo ""
        
        echo -e "${YELLOW}Recommendations:${NC}"
        show_recommendations "$overall_health" "$memory_health" "$integrity_status" "$performance_status" "$disk_status"
    fi
}

# Generate recommendations
generate_recommendations() {
    local overall="$1"
    local memory="$2"
    local integrity="$3"
    local performance="$4"
    local disk="$5"
    
    local recommendations="[]"
    
    if [ "$memory" = "critical" ]; then
        recommendations=$(echo "$recommendations" | jq '. += ["Run memory cleanup immediately", "Compress old sessions", "Consider increasing retention thresholds"]')
    elif [ "$memory" = "warning" ]; then
        recommendations=$(echo "$recommendations" | jq '. += ["Schedule memory compression", "Monitor growth rate"]')
    fi
    
    if [ "$integrity" = "corrupted" ]; then
        recommendations=$(echo "$recommendations" | jq '. += ["Backup current state", "Run file integrity repair", "Investigate corruption cause"]')
    fi
    
    if [ "$performance" = "slow" ]; then
        recommendations=$(echo "$recommendations" | jq '. += ["Optimize file operations", "Check disk I/O performance", "Consider SSD upgrade"]')
    fi
    
    if [ "$disk" = "low" ]; then
        recommendations=$(echo "$recommendations" | jq '. += ["Free up disk space", "Move old archives to external storage", "Increase retention cleanup frequency"]')
    fi
    
    echo "$recommendations"
}

# Show recommendations in human-readable format
show_recommendations() {
    local recommendations=$(generate_recommendations "$@")
    echo "$recommendations" | jq -r '.[]' | sed 's/^/  - /'
}

# Memory optimization
optimize_memory() {
    echo -e "${BLUE}🔧 Starting Memory Optimization${NC}"
    echo ""
    
    # Run compression
    echo "Compressing old memory sessions..."
    .claude/helpers/standard-checkpoint-hooks.sh compress-memory 3
    
    # Run cleanup
    echo "Cleaning up expired memory data..."
    .claude/helpers/standard-checkpoint-hooks.sh cleanup-memory 14
    
    # Validate after optimization
    echo "Validating memory state post-optimization..."
    .claude/helpers/standard-checkpoint-hooks.sh validate-memory
    
    echo -e "${GREEN}✅ Memory optimization completed${NC}"
}

# Generate detailed report
generate_report() {
    local report_file="$MONITOR_DIR/reports/memory-report-$(date +%Y%m%d-%H%M%S).json"
    
    echo -e "${BLUE}📊 Generating detailed memory report${NC}"
    
    # Gather comprehensive data
    local memory_status=$(get_memory_status --json)
    local health_check=$(health_check --json)
    
    # Combine into comprehensive report
    local report=$(jq -n \
        --argjson memory "$memory_status" \
        --argjson health "$health_check" \
        '{
            "report_timestamp": (now | strftime("%Y-%m-%dT%H:%M:%SZ")),
            "report_type": "comprehensive_memory_analysis",
            "memory_status": $memory,
            "health_check": $health,
            "system_info": {
                "hostname": $ENV.HOSTNAME,
                "pwd": $ENV.PWD,
                "user": $ENV.USER
            }
        }')
    
    mkdir -p "$(dirname "$report_file")"
    echo "$report" > "$report_file"
    
    echo -e "${GREEN}✅ Report generated: $report_file${NC}"
    echo ""
    echo -e "${YELLOW}Report Summary:${NC}"
    echo "$report" | jq -r '
        "Memory Status: " + .memory_status.status,
        "Overall Health: " + .health_check.overall_health,
        "Total Size: " + (.memory_status.total_size_mb | tostring) + "MB",
        "Active Sessions: " + (.memory_status.memory_bank.sessions | tostring),
        "Snapshots: " + (.memory_status.memory_bank.snapshots | tostring)
    '
}

# Interactive dashboard (basic version)
start_dashboard() {
    echo -e "${BLUE}📊 Starting Memory Monitoring Dashboard${NC}"
    echo ""
    echo "Press Ctrl+C to stop"
    echo ""
    
    trap 'echo -e "\n${YELLOW}Dashboard stopped${NC}"; exit 0' INT
    
    while true; do
        # Clear screen
        clear
        
        echo -e "${BLUE}🧠 Hive Mind Memory Dashboard${NC}"
        echo "Last updated: $(date)"
        echo ""
        
        # Show current status
        get_memory_status
        
        # Show recent alerts (last 3)
        echo ""
        echo -e "${YELLOW}Recent Alerts:${NC}"
        if [ -f "$MONITOR_DIR/alerts/alerts.json" ]; then
            jq -r '.[-3:] | .[] | "\(.timestamp) [\(.level | ascii_upcase)] \(.message)"' "$MONITOR_DIR/alerts/alerts.json" | while read -r alert; do
                echo "  $alert"
            done
        else
            echo "  No alerts"
        fi
        
        echo ""
        echo "Refreshing in 10 seconds... (Ctrl+C to stop)"
        sleep 10
    done
}

# Main command handling
case "$1" in
    status)
        get_memory_status "$2"
        ;;
    monitor)
        shift
        local duration=""
        local interval="$MONITOR_INTERVAL"
        local quiet=""
        
        while [[ $# -gt 0 ]]; do
            case $1 in
                --interval)
                    interval="$2"
                    shift 2
                    ;;
                --quiet)
                    quiet="--quiet"
                    shift
                    ;;
                --continuous)
                    duration=""
                    shift
                    ;;
                *)
                    if [[ $1 =~ ^[0-9]+$ ]]; then
                        duration="$1"
                    fi
                    shift
                    ;;
            esac
        done
        
        start_monitoring "$duration" "$interval" "$quiet"
        ;;
    alerts)
        show_alerts
        ;;
    performance)
        show_performance
        ;;
    health-check)
        health_check "$2"
        ;;
    optimize)
        optimize_memory
        ;;
    report)
        generate_report
        ;;
    dashboard)
        start_dashboard
        ;;
    setup)
        setup_monitoring
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