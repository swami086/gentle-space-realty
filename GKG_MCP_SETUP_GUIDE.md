# GitLab Knowledge Graph (GKG) MCP Setup Guide

*Complete configuration guide for using GKG MCP with Claude Code in any project*

## 📋 Overview

GitLab Knowledge Graph (GKG) MCP provides real-time codebase analysis, dependency mapping, and intelligent code search capabilities for Claude Code. This guide enables you to set up GKG for any project from scratch.

## 🔧 Prerequisites

### System Requirements
- **Node.js**: v18+ 
- **VS Code**: Latest version with GitLab extension
- **Claude Code**: Latest CLI version
- **Operating System**: macOS, Linux, or Windows WSL2

### Required Extensions
```bash
# Install VS Code GitLab extension
code --install-extension GitLab.gitlab-workflow
```

---

## ⚙️ GKG MCP Configuration

### 1. **Claude Code MCP Configuration**

Create or update your Claude Code MCP configuration:

**Location**: `~/.claude/mcp_servers.json`

```json
{
  "mcpServers": {
    "gkg": {
      "command": "npx",
      "args": ["@gitlab/mcp-server-gkg"],
      "env": {
        "GKG_SERVER_URL": "http://localhost:27495",
        "GKG_WORKSPACE_PATH": "/path/to/your/project",
        "GKG_AUTO_INDEX": "true",
        "GKG_CACHE_TTL": "3600",
        "GKG_MAX_RESULTS": "100"
      }
    }
  }
}
```

### 2. **Global MCP Server Installation**

```bash
# Install GKG MCP server globally
npm install -g @gitlab/mcp-server-gkg

# Verify installation
gkg --version
```

### 3. **Project-Specific Configuration**

Create `.gkg/config.json` in your project root:

```json
{
  "workspace": {
    "root": ".",
    "exclude": [
      "node_modules/**",
      ".git/**",
      "dist/**",
      "build/**",
      "coverage/**",
      ".next/**",
      ".vscode/**",
      "*.log"
    ],
    "include": [
      "src/**/*.{ts,tsx,js,jsx}",
      "components/**/*.{ts,tsx,js,jsx}",
      "pages/**/*.{ts,tsx,js,jsx}",
      "lib/**/*.{ts,tsx,js,jsx}",
      "utils/**/*.{ts,tsx,js,jsx}",
      "services/**/*.{ts,tsx,js,jsx}",
      "hooks/**/*.{ts,tsx,js,jsx}",
      "types/**/*.{ts,tsx}",
      "backend/**/*.{ts,js}",
      "server/**/*.{ts,js}",
      "api/**/*.{ts,js}",
      "*.{ts,tsx,js,jsx}",
      "*.json",
      "*.md"
    ]
  },
  "indexing": {
    "autoIndex": true,
    "indexOnSave": true,
    "watchMode": true,
    "parallelProcessing": true,
    "maxFileSize": "1MB",
    "batchSize": 50
  },
  "analysis": {
    "includeTypes": true,
    "includeComments": true,
    "includeDependencies": true,
    "includeImports": true,
    "includeExports": true,
    "followReferences": true,
    "maxDepth": 10
  },
  "server": {
    "port": 27495,
    "host": "localhost",
    "cors": true,
    "compression": true,
    "rateLimit": 1000
  }
}
```

---

## 🚀 Initialization Scripts

### 1. **Universal Project Setup Script**

Create `scripts/setup-gkg.sh`:

```bash
#!/bin/bash

# GKG Setup Script for Any Project
# Usage: ./scripts/setup-gkg.sh

set -e

PROJECT_ROOT=$(pwd)
GKG_CONFIG_DIR="$PROJECT_ROOT/.gkg"
CLAUDE_CONFIG_DIR="$HOME/.claude"

echo "🔧 Setting up GKG MCP for project: $(basename $PROJECT_ROOT)"

# Create GKG config directory
mkdir -p "$GKG_CONFIG_DIR"

# Create project-specific GKG config
cat > "$GKG_CONFIG_DIR/config.json" << EOF
{
  "workspace": {
    "root": ".",
    "exclude": [
      "node_modules/**",
      ".git/**",
      "dist/**",
      "build/**",
      "coverage/**",
      ".next/**",
      ".vscode/**",
      "*.log"
    ],
    "include": [
      "src/**/*.{ts,tsx,js,jsx}",
      "components/**/*.{ts,tsx,js,jsx}",
      "pages/**/*.{ts,tsx,js,jsx}",
      "lib/**/*.{ts,tsx,js,jsx}",
      "utils/**/*.{ts,tsx,js,jsx}",
      "services/**/*.{ts,tsx,js,jsx}",
      "hooks/**/*.{ts,tsx,js,jsx}",
      "types/**/*.{ts,tsx}",
      "backend/**/*.{ts,js}",
      "server/**/*.{ts,js}",
      "api/**/*.{ts,js}",
      "*.{ts,tsx,js,jsx}",
      "*.json",
      "*.md"
    ]
  },
  "indexing": {
    "autoIndex": true,
    "indexOnSave": true,
    "watchMode": true,
    "parallelProcessing": true,
    "maxFileSize": "1MB",
    "batchSize": 50
  },
  "analysis": {
    "includeTypes": true,
    "includeComments": true,
    "includeDependencies": true,
    "includeImports": true,
    "includeExports": true,
    "followReferences": true,
    "maxDepth": 10
  },
  "server": {
    "port": 27495,
    "host": "localhost",
    "cors": true,
    "compression": true,
    "rateLimit": 1000
  }
}
EOF

# Create Claude MCP config directory
mkdir -p "$CLAUDE_CONFIG_DIR"

# Update or create Claude MCP servers config
CLAUDE_MCP_CONFIG="$CLAUDE_CONFIG_DIR/mcp_servers.json"

if [ ! -f "$CLAUDE_MCP_CONFIG" ]; then
  cat > "$CLAUDE_MCP_CONFIG" << EOF
{
  "mcpServers": {}
}
EOF
fi

# Add GKG MCP server configuration
python3 << EOF
import json
import os

config_file = "$CLAUDE_MCP_CONFIG"
project_root = "$PROJECT_ROOT"

# Read existing config
with open(config_file, 'r') as f:
    config = json.load(f)

# Add GKG server configuration
config['mcpServers']['gkg'] = {
    "command": "npx",
    "args": ["@gitlab/mcp-server-gkg"],
    "env": {
        "GKG_SERVER_URL": "http://localhost:27495",
        "GKG_WORKSPACE_PATH": project_root,
        "GKG_AUTO_INDEX": "true",
        "GKG_CACHE_TTL": "3600",
        "GKG_MAX_RESULTS": "100"
    }
}

# Write updated config
with open(config_file, 'w') as f:
    json.dump(config, f, indent=2)

print(f"✅ Updated Claude MCP config: {config_file}")
EOF

# Install GKG MCP server if not already installed
if ! command -v gkg &> /dev/null; then
    echo "📦 Installing GKG MCP server globally..."
    npm install -g @gitlab/mcp-server-gkg
fi

# Start GKG server
echo "🚀 Starting GKG server..."
gkg server start --config="$GKG_CONFIG_DIR/config.json" --daemon

# Initial project indexing
echo "📊 Indexing project..."
gkg index --workspace="$PROJECT_ROOT" --config="$GKG_CONFIG_DIR/config.json"

echo "✅ GKG MCP setup complete!"
echo "🌐 GKG Server: http://localhost:27495"
echo "📁 Project: $PROJECT_ROOT"
echo "⚙️  Config: $GKG_CONFIG_DIR/config.json"
echo ""
echo "🔥 Ready to use GKG MCP with Claude Code!"
EOF

chmod +x scripts/setup-gkg.sh
```

### 2. **Package.json Scripts**

Add these scripts to any project's `package.json`:

```json
{
  "scripts": {
    "gkg:setup": "bash scripts/setup-gkg.sh",
    "gkg:start": "gkg server start --config=.gkg/config.json --daemon",
    "gkg:stop": "gkg server stop",
    "gkg:status": "gkg server status",
    "gkg:index": "gkg index --workspace=. --config=.gkg/config.json",
    "gkg:reindex": "gkg index --workspace=. --config=.gkg/config.json --force",
    "gkg:stats": "gkg stats --workspace=.",
    "gkg:health": "curl -s http://localhost:27495/api/health | jq"
  }
}
```

---

## 📝 Claude Code Integration

### 1. **CLAUDE.md Project Configuration**

Add this section to your project's `CLAUDE.md`:

```markdown
## GKG Knowledge Graph Integration

### Quick Start
```bash
# Setup GKG for this project
npm run gkg:setup

# Start GKG server
npm run gkg:start

# Index the project
npm run gkg:index
```

### GKG MCP Tools Available in Claude Code
- `mcp__gkg__repo_map` - Generate project structure maps
- `mcp__gkg__search_codebase_definitions` - Find functions, classes, interfaces
- `mcp__gkg__read_definitions` - Read complete definition implementations
- `mcp__gkg__get_references` - Find all references to a definition
- `mcp__gkg__get_definition` - Go to definition for symbols
- `mcp__gkg__import_usage` - Analyze import patterns
- `mcp__gkg__index_project` - Re-index project for latest changes

### GKG Server Status
- **URL**: http://localhost:27495
- **Status**: `npm run gkg:status`
- **Health Check**: `npm run gkg:health`

### Development Workflow
1. **Code Analysis**: Use GKG tools for understanding codebase structure
2. **Impact Analysis**: Find all references before making changes
3. **Dependency Mapping**: Understand component relationships
4. **Architecture Review**: Generate comprehensive system maps
```

### 2. **VS Code Workspace Configuration**

Create `.vscode/settings.json`:

```json
{
  "gitlab.instanceUrl": "https://gitlab.com",
  "gitlab.gdk.enabled": true,
  "gitlab.gdk.port": 27495,
  "gitlab.workflow.instanceUrl": "https://gitlab.com",
  "gitlab.workflow.enableGkgIntegration": true,
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.next": true,
    "**/coverage": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always"
}
```

---

## 🔄 Usage Patterns

### 1. **Initial Project Analysis**

```bash
# After cloning any new project
npm run gkg:setup
npm run gkg:start
npm run gkg:index

# In Claude Code session
claude code
# Then use: mcp__gkg__repo_map to understand project structure
```

### 2. **Development Workflow**

```bash
# Before making changes
npm run gkg:reindex  # Ensure latest code is indexed

# During development (Claude Code session)
# Use: mcp__gkg__search_codebase_definitions for finding components
# Use: mcp__gkg__get_references for impact analysis
# Use: mcp__gkg__read_definitions for understanding implementations

# After making changes
npm run gkg:reindex  # Update index with changes
```

### 3. **Architecture Documentation**

Use these GKG MCP tools in Claude Code for generating documentation:

```typescript
// Generate project overview
mcp__gkg__repo_map → System architecture understanding

// Create relationship maps  
mcp__gkg__import_usage → Dependency analysis

// Document components
mcp__gkg__search_codebase_definitions → Component cataloging
mcp__gkg__read_definitions → Implementation details
```

---

## 🛠️ Framework-Specific Configurations

### **React/Next.js Projects**
```json
{
  "include": [
    "src/**/*.{ts,tsx,js,jsx}",
    "components/**/*.{ts,tsx}",
    "pages/**/*.{ts,tsx}",
    "app/**/*.{ts,tsx}",
    "hooks/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "utils/**/*.{ts,tsx}",
    "types/**/*.{ts,tsx}",
    "*.config.{js,ts}",
    "*.json"
  ]
}
```

### **Node.js/Express Backend**
```json
{
  "include": [
    "src/**/*.{ts,js}",
    "routes/**/*.{ts,js}",
    "controllers/**/*.{ts,js}",
    "middleware/**/*.{ts,js}",
    "models/**/*.{ts,js}",
    "services/**/*.{ts,js}",
    "utils/**/*.{ts,js}",
    "types/**/*.{ts}",
    "*.{ts,js}",
    "*.json"
  ]
}
```

### **Full-Stack Projects**
```json
{
  "include": [
    "src/**/*.{ts,tsx,js,jsx}",
    "frontend/**/*.{ts,tsx,js,jsx}",
    "backend/**/*.{ts,js}",
    "server/**/*.{ts,js}",
    "client/**/*.{ts,tsx,js,jsx}",
    "shared/**/*.{ts,tsx}",
    "types/**/*.{ts,tsx}",
    "*.config.{js,ts}",
    "*.json"
  ]
}
```

---

## 🚨 Troubleshooting

### Common Issues

**1. GKG Server Not Starting**
```bash
# Check port availability
lsof -i :27495

# Kill existing process if needed
kill $(lsof -t -i:27495)

# Restart server
npm run gkg:start
```

**2. Index Not Updating**
```bash
# Force reindex
npm run gkg:reindex

# Check server logs
gkg server logs
```

**3. Claude Code Not Finding GKG**
```bash
# Verify MCP config
cat ~/.claude/mcp_servers.json

# Test GKG server directly
curl http://localhost:27495/api/health
```

---

## 📊 Performance Optimization

### **Large Projects (>1000 files)**
```json
{
  "indexing": {
    "batchSize": 25,
    "parallelProcessing": true,
    "maxFileSize": "500KB"
  },
  "server": {
    "rateLimit": 500
  }
}
```

### **Small Projects (<100 files)**
```json
{
  "indexing": {
    "batchSize": 100,
    "maxFileSize": "2MB"
  },
  "server": {
    "rateLimit": 2000
  }
}
```

---

## 🎯 Best Practices

### **1. Project Setup Checklist**
- [ ] Run `npm run gkg:setup` in new projects
- [ ] Add GKG scripts to `package.json`
- [ ] Configure `.gkg/config.json` for project type
- [ ] Update `CLAUDE.md` with GKG usage instructions
- [ ] Test GKG server health after setup

### **2. Development Workflow**
- [ ] Start GKG server before Claude Code sessions
- [ ] Use `mcp__gkg__repo_map` for project overview
- [ ] Run `mcp__gkg__index_project` after major changes
- [ ] Use `mcp__gkg__get_references` before refactoring
- [ ] Generate architecture docs with GKG tools

### **3. Maintenance**
- [ ] Weekly: `npm run gkg:reindex` for active projects
- [ ] Monthly: Update GKG MCP server (`npm update -g @gitlab/mcp-server-gkg`)
- [ ] Check server health: `npm run gkg:health`

---

This guide enables you to set up GKG MCP for any project and leverage its powerful codebase analysis capabilities with Claude Code from day one.

*Ready to unlock intelligent code understanding in any project! 🚀*