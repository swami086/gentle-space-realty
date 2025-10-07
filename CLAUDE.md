# Claude Code Project Configuration

## Project Overview

Real estate application with property search, management, and AI-powered features.

## Commands & Scripts

### Development
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run test       # Run tests
npm run lint       # Lint code
npm run typecheck  # Type checking
```

### Backend
```bash
npm run dev:server  # Start backend server
npm run test:server # Test backend
```

## Project Structure

- `/src` - Frontend React application
- `/backend` - Node.js/Express backend
- `/tests` - Test files
- `/docs` - Documentation
- `/scripts` - Utility scripts

## Code Style & Best Practices

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Testing**: Jest for unit tests, comprehensive coverage expected
- **Environment**: Never commit secrets, use .env files
- **Architecture**: Clean separation between frontend/backend

## Environment Variables

Check `.env.example` for required environment variables:
- Database connection strings
- API keys (external services)
- Authentication secrets
- Service URLs

## Development Workflow

1. Install dependencies: `npm install`
2. Set up environment variables
3. Start development servers
4. Write tests alongside features
5. Run linting and type checking before commits

## Git Workflow

- Feature branches for new work
- Pull requests for code review  
- Comprehensive commit messages
- No direct commits to main branch

## Testing

- Unit tests for utilities and services
- Integration tests for API endpoints
- Component tests for React components
- Minimum 80% code coverage expected

## Deployment

Production deployment handled via CI/CD pipeline. Ensure all tests pass and environment variables are properly configured.

## GKG Speed Optimization Rules
*Applicable for all development workflows: SPARC methodology, traditional development, and agent-based coding*

### Universal Query-Plan-Edit-Verify Loop
Enforce a tight "query-plan-edit-verify" loop that uses GKG MCP to gather complete dependency context in one shot, then executes planned edits across all impacted files in a single pass, and re-validates the graph before completion.

### Speed Principles (All Workflows)
- **Minimize human-in-the-loop by default**: Adopt autonomous execution with explicit gates (evidence → plan → patch) so agents proceed without back-and-forth once gates are satisfied, reducing idle time between steps.
- **Exploit GKG's low-latency local indexing**: Rely on the gkg daemon and IDE integration to resolve structure and impact instantly, avoiding slow heuristic searches or multi-step file greps.

### Fast Rules (SPARC & Non-SPARC)
- **Query first, once**: "Use GKG MCP to fetch imports, inbound/outbound call edges, references, and tests for target symbols/files in a single batch before any code writing; do not run separate piecemeal searches".
- **Parallelize graph lookups**: "For multiple symbols/modules, request combined or parallel GKG queries to resolve all dependencies in one turn to reduce latency".

### Tool Selection Guardrails
- **Prefer GKG over generic code search**: "Do not use grep or generic search if GKG results are available; GKG's AST/call edges beat text search for speed and accuracy".
- **Keep toolset lean**: "Allow only GKG MCP for structure and minimal edit tools; disable nonessential tools during feature work to prevent slow or incorrect detours".

### Evidence Format for Speed
- **Require compact evidence**: "Paste a tabular summary of GKG results (file → symbol → relation → line) rather than verbose dumps; include node IDs if present".
- **Demand coverage hash**: "Compute and display a 'coverage list' = set of impacted files/callers from GKG; edits must match this list 1:1".

### Planning Shortcuts
- **SPARC Specification Phase**: Use GKG to identify all affected components during requirements analysis
- **SPARC Architecture Phase**: Leverage GKG call graphs for system design decisions
- **Traditional Development**: Use GKG for impact analysis before any code changes
- **One-pass plan**: "Produce a single change plan that maps each impacted file to its exact edit; no iterative re-planning unless GKG delta reveals misses".
- **Prefer adapters for breadth**: "When GKG shows many callers, generate a thin adapter/shim to minimize per-site changes and keep edits in one patch".

### Edit Execution (Universal)
- **Batch diffs**: "Apply edits across all impacted files in one patch series; avoid serial file-by-file edits that require repeated graph checks".
- **Restrict file churn**: "Never add files or restructure directories unless necessary for the feature; fewer writes shorten review and re-index cycles".
- **SPARC Integration**: Apply batch edits during Refinement phase after Architecture is complete
- **Non-SPARC Integration**: Apply batch edits after complete dependency analysis

### Post-Change Validation
- **Re-index and diff the graph**: "Immediately re-query GKG to verify no residual callers or stale imports; paste a concise delta (removed edges, new edges) before completion".
- **SPARC Completion Phase**: Use GKG validation as final integration check
- **Traditional Development**: Use GKG validation before commit/PR
- **Gate completion on graph clean state**: "Mark complete only when GKG deltas match the plan; if residuals exist, either add a shim or include remaining edits in the same patch".

### Failure Fast Paths
- **If GKG MCP is unavailable, stop**: "Abort coding and request environment fix (start gkg service, select correct workspace repo, re-index); do not fall back to slow text search".
- **If queries return partial results**: Retry with explicit scopes (repo, path, symbol), then proceed; avoid speculative edits without complete graph.

### Performance Optimizations
- **Preload and auto-manage daemon**: Enable the GitLab VS Code extension to autostart the lightweight GKG background service and maintain per-repo graphs for instant queries.
- **Agent coordination**: For multi-agent workflows (SPARC or parallel development), share GKG results between agents to avoid duplicate queries.

### Core GKG Workflow Rules (Universal)
- **Always start with GKG MCP query pass** that enumerates imports, call edges, references, and tests for all target files/symbols; output a compact coverage list and proceed only when complete.
- **Generate one consolidated plan** mapping every impacted file to specific edits; then apply a single batch of diffs across all files; avoid stepwise edits.
- **After edits, re-query GKG** and post a graph delta; complete only if deltas match the plan or a shim isolates residual callers.

### SPARC-Specific Integration
- **Specification**: Use GKG to identify all affected components and dependencies
- **Pseudocode**: Reference GKG call graphs for algorithm design
- **Architecture**: Leverage GKG for system design and component relationships  
- **Refinement**: Apply GKG-validated edits in batch during implementation
- **Completion**: Use GKG delta validation for final integration verification

### Why This Is Fastest
GKG provides a connected map of the project with IDE-managed indexing and MCP access, so agents answer "what else does this change impact?" instantly and confidently, cutting time spent on discovery and rework. This applies whether using SPARC methodology's structured phases or traditional iterative development - the key is leveraging GKG's graph intelligence for comprehensive impact analysis upfront.

## Support

- Check existing issues and documentation
- Follow established patterns in the codebase
- Maintain consistency with project conventions