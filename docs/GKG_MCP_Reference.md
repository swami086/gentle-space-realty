# GKG MCP Reference Documentation

## Overview
The GitLab Knowledge Graph (GKG) server provides Model Context Protocol endpoints to interact with code analysis data. This server offers specialized tools to search and analyze codebases via LLMs.

## Server Information
- **Version**: 0.18.1
- **Port**: 27495
- **Start Command**: `gkg server start --register-mcp ~/.gitlab/duo/mcp.json --detached`
- **Stop Command**: `gkg server stop`
- **Index Command**: `gkg index .`
- **Clean Command**: `gkg clean`

## MCP Endpoints

### HTTP Transport
- **Endpoint**: `http://localhost:27495/mcp`
- **Purpose**: Synchronous tool execution using MCP HTTP transport protocol
- **Usage**: For direct API calls and synchronous operations

### Server-Sent Events (SSE) Transport  
- **Endpoint**: `http://localhost:27495/mcp/sse`
- **Purpose**: Streaming tool execution and real-time communication
- **Usage**: For streaming operations and real-time updates

### Integration
- Endpoints automatically register when started with `--register-mcp` flag
- Designed for AI development tools and IDEs supporting MCP
- Configuration files:
  - `~/.gitlab/duo/mcp.json` - MCP registration
  - `~/.gkg/mcp.settings.json` - Tool configuration

## Available MCP Tools

### 1. list_projects
**Purpose**: Get a list of all projects in the knowledge graph
- **Input**: No parameters required
- **Output**: Array of project objects with `project_path` (absolute filesystem path)
- **Use Case**: When you need to see all indexed projects or find project root directories

### 2. search_codebase_definitions
**Purpose**: Search for functions, classes, methods, constants, interfaces
- **Input**:
  - `project_absolute_path` (string): Project root directory path
  - `search_terms` (string[]): List of definition names to search
  - `page` (integer, optional): Page number (default: 1)
- **Output**: Array of definitions with name, fqn, definition_type, location, context
- **Use Case**: Code exploration, refactoring, debugging, understanding structure

### 3. index_project
**Purpose**: Create or rebuild Knowledge Graph index for a project
- **Input**: `project_absolute_path` (string): Project root directory
- **Output**: Indexing statistics and system messages
- **Use Case**: Refresh index after code changes

### 4. get_references
**Purpose**: Find all references to a code definition across the codebase
- **Input**:
  - `definition_name` (string): Exact identifier name
  - `file_path` (string): File where definition is declared
  - `page` (integer, optional): Page number for pagination
- **Output**: Array of definitions referencing the target symbol
- **Use Case**: Impact analysis, dependency mapping, safe refactoring

### 5. read_definitions
**Purpose**: Read definition bodies for multiple definitions
- **Input**: `definitions` array with `names` and `file_path` objects
- **Output**: Array of definitions with full code bodies
- **Use Case**: Token-efficient reading of multiple definitions from same file

### 6. get_definition
**Purpose**: Navigate directly to definition from a specific line usage
- **Input**:
  - `file_path` (string): File containing symbol usage
  - `line` (string): Exact line of code with symbol
  - `symbol_name` (string): Name of callable symbol
- **Output**: Definition or ImportedSymbol information with code snippet
- **Use Case**: Jump from usage to definition, explore codebase efficiently

### 7. repo_map
**Purpose**: Generate compact, API-style repository map
- **Input**:
  - `project_absolute_path` (string): Project root path
  - `relative_paths` (string[]): Files/directories to include
  - `depth` (integer, optional): Traversal depth (1-3)
  - `show_directories` (boolean, optional): Include ASCII tree
  - `show_definitions` (boolean, optional): Include definitions
  - `page` (integer, optional): Page number
  - `page_size` (integer, optional): Max definitions per page
- **Output**: XML-formatted repository map with directories and definitions
- **Use Case**: Token-efficient repository overview, understanding project structure

## Configuration

### MCP Settings File: `~/.gkg/mcp.settings.json`
```json
{
  "disabled_tools": ["tool_name_1", "tool_name_2"]
}
```

### Custom Configuration Path
Use `--mcp-configuration-path <path>` when starting server to specify custom settings location.

## Speed Optimization Workflow (from CLAUDE.md)

### Universal Query-Plan-Edit-Verify Loop
1. **Query First Once**: Use GKG MCP to fetch imports, call edges, references, tests in single batch
2. **Generate Coverage List**: Create compact tabular summary (file → symbol → relation → line)
3. **One-Pass Plan**: Map each impacted file to specific edits
4. **Batch Edits**: Apply changes across all files in single patch series
5. **Post-Change Validation**: Re-query GKG to verify no residual callers
6. **Gate Completion**: Only complete when GKG deltas match the plan

### Tool Selection Guardrails
- **Prefer GKG over grep**: AST/call edges beat text search for speed and accuracy
- **Keep toolset lean**: Use only GKG MCP for structure analysis
- **Parallelize graph lookups**: Request combined queries for multiple symbols

### Failure Fast Paths
- **If GKG MCP unavailable**: Abort and request environment fix
- **If partial results**: Retry with explicit scopes, avoid speculative edits

### SPARC Integration
- **Specification**: Use GKG to identify affected components
- **Architecture**: Leverage call graphs for system design
- **Refinement**: Apply GKG-validated batch edits
- **Completion**: Use GKG delta validation for final verification

## Server Management

### Starting the Server

**Basic Start**:
```bash
gkg server start
```

**With MCP Registration** (Recommended):
```bash
gkg server start --register-mcp ~/.gitlab/duo/mcp.json
```

**Detached Mode** (Background Process):
```bash
gkg server start --register-mcp ~/.gitlab/duo/mcp.json --detached
```

### Server Options

**Port Configuration**:
- Default port: 27495
- Custom port: `--port <PORT>`

**Configuration Path**:
- Default: `~/.gkg/mcp.settings.json`
- Custom: `--mcp-configuration-path <PATH>`

**MCP Registration**:
- Automatically registers MCP endpoints when `--register-mcp` flag is used
- Creates SSE transport at `http://localhost:27495/mcp/sse`
- Creates HTTP transport at `http://localhost:27495/mcp`

### Stopping the Server

**Graceful Stop**:
```bash
gkg server stop
```

**Force Stop** (If server is unresponsive):
```bash
pkill -9 -f gkg
rm ~/.gkg/gkg.lock  # Remove lock file if needed
```

### Server Signals

**SIGTERM**: Graceful shutdown
- Server completes current operations
- Cleanly closes connections
- Updates lock files

**SIGINT (Ctrl+C)**: Interactive stop
- Same as SIGTERM for graceful shutdown
- Use when running in foreground

**SIGKILL**: Force termination
- Use only when server is unresponsive
- May require manual lock file cleanup

### Process Management

**Check Server Status**:
```bash
gkg server status
```

**View Running Processes**:
```bash
ps aux | grep gkg
```

**Check Port Usage**:
```bash
lsof -i :27495
netstat -an | grep 27495
```

### Troubleshooting Server Issues

**Lock State Problems**:
1. Check for stale processes: `ps aux | grep gkg`
2. Kill processes: `pkill -9 -f gkg`
3. Remove lock file: `rm ~/.gkg/gkg.lock`
4. Clean data directory: `gkg clean`
5. Restart server: `gkg server start --register-mcp ~/.gitlab/duo/mcp.json --detached`

**Port Conflicts**:
- Check what's using port 27495: `lsof -i :27495`
- Use custom port: `gkg server start --port <AVAILABLE_PORT>`
- Update MCP configuration to match custom port

**MCP Registration Issues**:
- Ensure MCP config file exists: `~/.gitlab/duo/mcp.json`
- Verify file permissions and JSON syntax
- Check server logs for registration errors

### Server Logs and Debugging

**Enable Debug Logging**:
```bash
RUST_LOG=debug gkg server start --register-mcp ~/.gitlab/duo/mcp.json
```

**Log Levels**:
- `error`: Error messages only
- `warn`: Warnings and errors
- `info`: General information (default)
- `debug`: Detailed debugging information
- `trace`: Maximum verbosity

### Current Project Status
- **Repositories Indexed**: 5
- **Files Processed**: 184,795
- **Server Status**: Running on port 27495
- **MCP Endpoints**: Available but Claude connection pending protocol handshake

## Usage Examples

### Basic Workflow
1. Start server: `gkg server start --register-mcp ~/.gitlab/duo/mcp.json --detached`
2. List projects: Use `list_projects` tool
3. Search definitions: Use `search_codebase_definitions` with target symbols
4. Get references: Use `get_references` for impact analysis
5. Generate repository map: Use `repo_map` for overview
6. Apply changes and re-index: Use `index_project` to refresh

### Speed-Optimized Feature Development
1. Query GKG for all dependencies in single batch
2. Generate comprehensive coverage list
3. Create consolidated edit plan
4. Apply batch edits across all impacted files
5. Re-query GKG for validation delta
6. Complete only when graph state matches plan

## HTTP Server API

The GitLab Knowledge Graph server provides an HTTP API for programmatic access to the Knowledge Graph, along with real-time SSE events for monitoring progress.

### Base URL
When running locally (default port):
```
http://localhost:27495
```

The server automatically selects port 27495 (0x6b67 - "knowledge graph") when available, or finds an unused port if it's busy.

### Authentication
Currently, the server runs without authentication for local development. The server does check against CORS headers.

### REST API Endpoints

#### Server Information
**GET /api/info**  
Get basic server information including version and port.

Response:
```json
{
  "port": 27495,
  "version": "0.18.1"
}
```

#### Workspace Management
**GET /api/workspace/list**  
List all indexed workspace folders and their projects.

Response:
```json
{
  "workspaces": [
    {
      "workspace_info": {
        "workspace_folder_path": "/path/to/workspace",
        "data_directory_name": "workspace_hash",
        "status": "indexed",
        "last_indexed_at": "2024-01-01T00:00:00Z",
        "project_count": 2
      },
      "projects": [
        {
          "project_path": "/path/to/workspace/project1",
          "project_hash": "project_hash_1",
          "workspace_folder_path": "/path/to/workspace",
          "status": "indexed",
          "database_path": "/data/workspace_hash/project_hash_1/kuzu_db",
          "parquet_directory": "/data/workspace_hash/project_hash_1/parquet_files"
        }
      ]
    }
  ]
}
```

**POST /api/workspace/index**  
Index a new workspace folder or re-index an existing one.

Request Body:
```json
{
  "workspace_folder_path": "/path/to/workspace"
}
```

Response (Success):
```json
{
  "workspace_folder_path": "/path/to/workspace",
  "data_directory_name": "workspace_hash",
  "status": "indexing",
  "last_indexed_at": null,
  "project_count": 2
}
```

Error Responses:
- **400 Bad Request**: Invalid workspace path or no projects found
- **500 Internal Server Error**: Failed to register workspace or dispatch indexing job

**DELETE /api/workspace/delete**  
Delete a workspace and all its associated data.

#### Graph Queries
**GET /api/graph/initial**  
Get initial graph data for visualization.

**GET /api/graph/neighbors**  
Get neighboring nodes for graph exploration.

**GET /api/graph/search**  
Search the knowledge graph for specific patterns.

**GET /api/graph/stats**  
Get statistics about the knowledge graph.

### Server-Sent Events (SSE)
**GET /api/events**  
Connect to the events endpoint for real-time Server-Sent Events during indexing operations.

Headers:
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Connection Event:**
When you first connect, you'll receive a connection confirmation:
```
event: gkg-connection
data: {"type":"connection-established","timestamp":"2024-01-01T00:00:00Z","message":"SSE connection established"}
```

**System Events:**
All system events are sent with the `gkg-event` event type:
```
event: gkg-event
data: {"WorkspaceIndexing":{"Started":{"workspace_folder_info":{...},"projects_to_process":[...],"started_at":"2024-01-01T00:00:00Z"}}}
```

Events include workspace indexing progress, project processing updates, and completion notifications.

### Error Handling
All endpoints return standard HTTP status codes:
- **200**: Success
- **400**: Bad Request - Invalid parameters
- **404**: Not Found - Resource doesn't exist
- **500**: Internal Server Error - Processing failed

Error responses include details:
```json
{
  "error": "Invalid workspace path",
  "code": "INVALID_PATH",
  "details": "Path does not exist or is not accessible"
}
```

### CORS Configuration
The server is configured to accept requests from localhost origins for local development. CORS is handled automatically for cross-origin requests from localhost.

### Example Usage

#### Index a Workspace
```bash
# Start indexing a workspace
curl -X POST http://localhost:27495/api/workspace/index \
  -H "Content-Type: application/json" \
  -d '{"workspace_folder_path": "/path/to/my/workspace"}'
```

#### List Workspaces and Projects
```bash
# Get all workspaces and their projects
curl http://localhost:27495/api/workspace/list
```

#### Server Information
```bash
# Get server info
curl http://localhost:27495/api/info
```

#### Real-time Events with SSE
```javascript
// Connect to Server-Sent Events
const eventSource = new EventSource("http://localhost:27495/api/events");

eventSource.onopen = () => {
  console.log("Connected to SSE stream");
};

eventSource.addEventListener("gkg-connection", (event) => {
  const data = JSON.parse(event.data);
  console.log("Connection established:", data);
});

eventSource.addEventListener("gkg-event", (event) => {
  const data = JSON.parse(event.data);
  console.log("System event:", data);
});

eventSource.onerror = (error) => {
  console.error("SSE connection error:", error);
};
```

### MCP Integration
The server also provides Model Context Protocol endpoints at `/mcp` and `/mcp/sse` for AI tool integration.