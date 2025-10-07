# Package Scripts Reference - Gentle Space Realty

This document provides a comprehensive reference for all npm scripts available in the Gentle Space Realty project.

## 📋 Quick Start Commands

```bash
# Initial setup for new developers
npm run setup:validate    # Validate environment setup
npm run setup:dev        # Set up development environment
npm run dev             # Start development server
npm test               # Run tests
npm run build          # Build for production
```

## 🏗️ Build & Development Scripts

### Core Development
- **`npm run dev`** - Start Vite development server
- **`npm run build`** - Production build with optimizations
- **`npm run build:dev`** - Development build
- **`npm run build:staging`** - Staging build
- **`npm run build:prod`** - Production build with full optimizations
- **`npm run preview`** - Preview production build locally

### Server Management
- **`npm start`** - Start production server (alias for start:server)
- **`npm run start:server`** - Start Express backend server
- **`npm run start:dev`** - Start both frontend and backend concurrently

## 🧪 Testing Scripts

### Core Testing
- **`npm test`** - Run all tests with Vitest
- **`npm run test:unit`** - Run unit tests only
- **`npm run test:integration`** - Run integration tests only
- **`npm run test:e2e`** - Run end-to-end tests with Playwright
- **`npm run test:watch`** - Run tests in watch mode
- **`npm run test:ui`** - Run tests with Vitest UI
- **`npm run test:coverage`** - Run tests with coverage report
- **`npm run test:all`** - Run all test suites sequentially

### Specialized Testing
- **`npm run test:mock-accounts`** - Test mock account creation suite
- **`npm run test:mock-cleanup`** - Clean up test mock accounts
- **`npm run test:mock-stats`** - Show mock account statistics
- **`npm run test:mock-benchmark`** - Run mock account performance benchmarks

## 🔍 Code Quality Scripts

### Type Checking
- **`npm run typecheck`** - Check TypeScript types for main codebase
- **`npm run typecheck:server`** - Check server-side TypeScript
- **`npm run typecheck:cli`** - Check CLI scripts TypeScript
- **`npm run typecheck:all`** - Check all TypeScript files

### Linting
- **`npm run lint`** - Run ESLint and fix issues automatically
- **`npm run lint:check`** - Run ESLint without fixing (for CI)

## 🗄️ Database Scripts

### Core Database Operations
- **`npm run db:check`** - Verify database connection
- **`npm run db:migrate`** - Run database migrations
- **`npm run db:seed`** - Seed database with sample data
- **`npm run db:reset`** - Drop all database tables
- **`npm run db:setup`** - Run migrations and seeds
- **`npm run db:fresh`** - Reset, migrate, and seed database
- **`npm run db:status`** - Check database migration status

### Database Management Examples
```bash
# Set up database from scratch
npm run db:fresh

# Update database with new migrations
npm run db:migrate

# Add sample data for development
npm run db:seed

# Check if database is accessible
npm run db:check
```

## ✅ Validation Scripts

### Environment Validation
- **`npm run validate:env`** - Validate environment variables
- **`npm run validate:db`** - Validate database connectivity
- **`npm run validate:api`** - Test API endpoints functionality
- **`npm run validate:auth`** - Test authentication system
- **`npm run validate:uploads`** - Test file upload functionality
- **`npm run validate:integration`** - Validate system integration
- **`npm run validate:deployment`** - Validate deployment readiness
- **`npm run validate:all`** - Run all validation checks

### Validation Workflow
```bash
# Quick validation for daily development
npm run validate:env && npm run validate:db

# Full validation before deployment
npm run validate:all

# Specific component validation
npm run validate:auth
npm run validate:uploads
```

## ⚙️ Setup Scripts

### Development Setup
- **`npm run setup:env`** - Create environment configuration from template
- **`npm run setup:db`** - Set up database with migrations and seeds
- **`npm run setup:keys`** - Create Keys directory for service accounts
- **`npm run setup:dev`** - Complete development environment setup
- **`npm run setup:check`** - Validate setup completion
- **`npm run setup:validate`** - Run comprehensive setup validation

### New Developer Onboarding
```bash
# Complete setup for new developers
npm install
npm run setup:dev
npm run setup:validate

# Manual configuration steps
# 1. Add service account keys to Keys/
# 2. Configure .env.development
# 3. Run: npm run validate:all
```

## 🔒 Security Scripts

### Security Scanning
- **`npm run security:scan`** - Run npm audit and Semgrep security scan
- **`npm run security:fix`** - Fix npm security vulnerabilities automatically

### Security Monitoring
```bash
# Regular security checks
npm run security:scan

# Fix known vulnerabilities
npm run security:fix

# Manual security review
npx semgrep --config=auto . --verbose
```

## 📊 Monitoring Scripts

### Performance Monitoring
- **`npm run monitor:memory`** - Monitor memory usage patterns
- **`npm run monitor:performance`** - Monitor application performance

### Monitoring Examples
```bash
# Monitor memory usage during development
npm run monitor:memory

# Check performance metrics
npm run monitor:performance

# Monitor during load testing
npm run monitor:performance &
npm run test:load
```

## 🧹 Maintenance Scripts

### Cleanup Operations
- **`npm run clean`** - Clean build artifacts and cache
- **`npm run clean:all`** - Clean everything including node_modules
- **`npm run reset`** - Complete reset and reinstall
- **`npm run postinstall`** - Post-installation verification (runs automatically)

### Maintenance Examples
```bash
# Clean build artifacts
npm run clean

# Full reset for troubleshooting
npm run reset

# After package.json changes
npm run clean:all
npm install
```

## 🛠️ Utility Scripts

### Mock Account Management
- **`npm run script:mock-account`** - Create individual mock account
- **`npm run test:mock-accounts`** - Run mock account test suite
- **`npm run test:mock-cleanup`** - Clean up all test accounts
- **`npm run test:mock-stats`** - Display mock account statistics
- **`npm run test:mock-benchmark`** - Performance test mock account creation

## 📝 Script Categories by Use Case

### Daily Development Workflow
```bash
npm run dev                    # Start development
npm run test:watch            # Run tests in background
npm run lint                  # Fix code issues
npm run typecheck            # Verify types
```

### Before Committing Code
```bash
npm run test:all             # All tests pass
npm run lint:check           # No linting errors
npm run typecheck:all        # All types valid
npm run security:scan        # No security issues
```

### Deployment Preparation
```bash
npm run validate:all         # All validations pass
npm run build:prod          # Production build successful
npm run test:e2e            # End-to-end tests pass
npm run security:scan        # Security scan clean
```

### Troubleshooting
```bash
npm run setup:validate       # Check environment setup
npm run db:check            # Verify database connection
npm run validate:api        # Test API endpoints
npm run clean && npm install # Reset if needed
```

## 🔧 Environment-Specific Configurations

### Development Environment
```bash
NODE_ENV=development npm run build:dev
NODE_ENV=development npm run test:integration
DEBUG_VITE_CONFIG=true npm run dev
```

### Production Environment
```bash
NODE_ENV=production npm run build:prod
NODE_ENV=production npm run test:all
NODE_ENV=production npm run validate:deployment
```

### Testing Environment
```bash
NODE_ENV=test npm run test:all
NODE_ENV=test npm run db:fresh
NODE_ENV=test npm run validate:integration
```

## 🚨 Error Handling and Troubleshooting

### Common Script Failures

#### Database Connection Issues
```bash
# Check database status
npm run db:check

# Reset database connection
npm run db:fresh

# Verify environment variables
npm run validate:env
```

#### Build Failures
```bash
# Clear cache and rebuild
npm run clean
npm run build

# Check TypeScript issues
npm run typecheck:all

# Reset dependencies
npm run clean:all
npm install
```

#### Test Failures
```bash
# Run tests individually
npm run test:unit
npm run test:integration

# Reset test environment
npm run test:mock-cleanup
npm run db:fresh

# Debug with UI
npm run test:ui
```

### Script Exit Codes

- **0**: Success - Script completed without errors
- **1**: General failure - Script encountered an error
- **2**: Validation failure - Validation checks failed
- **130**: User interruption - Script was cancelled by user

## 📚 Script Dependencies

### Required Global Tools
- **Node.js 18+**: Runtime environment
- **npm 9+**: Package manager
- **Docker** (optional): For database services
- **Git**: Version control

### Script Relationships
```
setup:dev → setup:env + setup:keys + setup:db
validate:all → validate:env + validate:db + validate:api + validate:integration
typecheck:all → typecheck + typecheck:server + typecheck:cli
test:all → test:unit + test:integration + test:e2e
```

## 🔗 Integration with Development Tools

### IDE Integration
Most IDEs can run these scripts directly:
- **VS Code**: Use npm scripts panel or Command Palette
- **WebStorm**: Use npm tool window
- **Vim/Neovim**: Use terminal integration

### Git Hooks Integration
Consider adding these to your git hooks:
```bash
# pre-commit
npm run lint && npm run typecheck

# pre-push  
npm run test:all && npm run security:scan
```

### CI/CD Integration
```yaml
# Example GitHub Actions integration
- name: Install dependencies
  run: npm ci

- name: Validate setup
  run: npm run setup:validate

- name: Run tests
  run: npm run test:all

- name: Security scan
  run: npm run security:scan

- name: Build application
  run: npm run build:prod
```

---

## 🆘 Getting Help

If you encounter issues with any scripts:

1. Check the **ENVIRONMENT_SETUP.md** for setup requirements
2. Run **`npm run setup:validate`** to diagnose issues
3. Check individual script logs for specific error messages
4. Refer to the troubleshooting section above
5. Create an issue with the specific script name and error output

**Last Updated**: September 2024  
**Script Count**: 40+ npm scripts  
**Coverage**: Development, Testing, Deployment, Maintenance