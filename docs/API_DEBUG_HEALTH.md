# Debug and Health API Endpoints

Comprehensive debugging and health monitoring endpoints for the Gentle Space Realty API.

## 🔧 Debug Endpoint (`/api/debug`)

### Overview
The debug endpoint provides comprehensive system diagnostics, environment information, and Supabase integration validation. It includes security measures requiring admin authentication in production.

### Authentication
- **Development**: No authentication required
- **Production**: Requires Bearer token with admin privileges

### GET Requests

#### Basic Debug Information
```
GET /api/debug
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-01-14T12:00:00.000Z",
    "environment": {
      "nodeEnv": "development",
      "version": "1.0.0",
      "platform": "darwin",
      "architecture": "arm64",
      "nodeVersion": "v18.17.0",
      "uptime": 3600,
      "pid": 12345,
      "variables": {
        "VITE_SUPABASE_URL": "https://project...co",
        "VITE_SUPABASE_ANON_KEY": "eyJhbGci...[REDACTED]"
      }
    },
    "system": {
      "hostname": "MacBook-Pro.local",
      "type": "Darwin",
      "release": "24.5.0",
      "arch": "arm64",
      "cpus": 10,
      "memory": {
        "total": 16384,
        "used": 8192,
        "free": 8192,
        "percentage": 50
      },
      "loadAverage": [1.2, 1.1, 1.0],
      "networkInterfaces": 4
    },
    "deployment": {
      "platform": "Vercel",
      "region": "us-east-1",
      "url": "https://gentle-space-realty.vercel.app",
      "branch": "main",
      "commit": "abc12345",
      "buildId": "abc123...",
      "deployedAt": "2025-01-14T11:00:00.000Z"
    },
    "request": {
      "method": "GET",
      "url": "/api/debug",
      "protocol": "https",
      "host": "gentle-space-realty.vercel.app",
      "headers": {
        "origin": "https://gentle-space-realty.vercel.app",
        "userAgent": "Mozilla/5.0...",
        "acceptLanguage": "en-US,en;q=0.9"
      },
      "ip": "192.168.1.100",
      "geo": {
        "country": "US",
        "region": "CA",
        "city": "San Francisco"
      }
    },
    "configuration": {
      "supabase": {
        "configured": true,
        "url": "https://project.supabase.co",
        "hasServiceKey": true,
        "hasAnonKey": true,
        "projectId": "project"
      },
      "cors": {
        "allowedOrigins": 5,
        "currentOrigin": "https://gentle-space-realty.vercel.app",
        "allowed": true
      },
      "api": {
        "timeout": "15000",
        "fallbackEnabled": true,
        "realtimeEnabled": true,
        "rlsEnabled": true
      }
    }
  }
}
```

#### Debug with Database Testing
```
GET /api/debug?testDb=true
```

Includes comprehensive database diagnostics with table accessibility tests and RLS validation.

#### Comprehensive Diagnostics
```
GET /api/debug?comprehensive=true
```

Includes full database diagnostics with detailed service role and anon key testing.

#### Performance Metrics
```
GET /api/debug?performance=true
```

Adds performance testing for API operations, database queries, and system metrics.

#### Configuration Validation
```
GET /api/debug?validate=true
```

Validates environment variables, Supabase configuration, and API settings.

### POST Requests

The debug endpoint supports specific diagnostic tests via POST requests.

#### Connection Test
```json
POST /api/debug
{
  "test": "connection"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "test": "connection",
    "timestamp": "2025-01-14T12:00:00.000Z",
    "results": {
      "status": "success",
      "responseTime": 45,
      "error": null
    }
  }
}
```

#### Query Test
```json
POST /api/debug
{
  "test": "query",
  "parameters": {
    "table": "properties",
    "limit": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "test": "query",
    "results": {
      "status": "success",
      "responseTime": 120,
      "recordCount": 3,
      "totalCount": 15,
      "error": null
    }
  }
}
```

#### CORS Test
```json
POST /api/debug
{
  "test": "cors"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "test": "cors",
    "results": {
      "status": "success",
      "origin": "https://gentle-space-realty.vercel.app",
      "allowed": true,
      "allowedOrigins": ["[PRODUCTION_ORIGINS_HIDDEN]"]
    }
  }
}
```

## 🏥 Health Endpoint (`/api/health`)

### Overview
Production-ready health check endpoint providing comprehensive system status monitoring with configurable thresholds and detailed diagnostics.

### GET Requests

#### Basic Health Check
```
GET /api/health
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-14T12:00:00.000Z",
    "environment": "production",
    "version": "1.0.0",
    "uptime": 3600,
    "checks": {
      "api": {
        "status": "healthy",
        "responseTime": 15
      },
      "database": {
        "status": "healthy",
        "responseTime": 250,
        "details": {
          "serviceRole": {
            "status": "healthy",
            "responseTime": 120,
            "error": null
          },
          "anonKey": {
            "status": "healthy",
            "responseTime": 110,
            "error": null
          },
          "tables": {
            "status": "healthy",
            "accessible": 4,
            "total": 4
          },
          "rls": {
            "status": "healthy",
            "enabled": true,
            "error": null
          },
          "supabaseMCP": {
            "status": "available",
            "projects": 6,
            "activeProject": "Gentle_Space_Sep"
          }
        }
      },
      "environment": {
        "status": "healthy",
        "details": {
          "required": {
            "SUPABASE_URL": {
              "present": true,
              "valid": true,
              "length": 45
            },
            "SUPABASE_SERVICE_ROLE_KEY": {
              "present": true,
              "valid": true,
              "length": 124
            }
          },
          "validation": {
            "requiredCount": 3,
            "missingCount": 0,
            "missingVars": []
          }
        }
      },
      "system": {
        "status": "healthy",
        "details": {
          "memory": {
            "status": "healthy",
            "usage": 45,
            "details": {
              "process": {
                "rss": 128,
                "heapTotal": 64,
                "heapUsed": 32
              },
              "system": {
                "total": 16384,
                "used": 7373,
                "free": 9011,
                "percentage": 45
              }
            }
          },
          "cpu": {
            "status": "healthy",
            "loadAverage": [1.2, 1.1, 1.0],
            "cores": 10,
            "loadPercentage": 12
          }
        }
      }
    },
    "metrics": {
      "memory": {
        "process": { "rss": 128, "heapTotal": 64, "heapUsed": 32 },
        "system": { "total": 16384, "used": 7373, "free": 9011, "percentage": 45 }
      },
      "performance": {
        "totalResponseTime": 275,
        "apiResponseTime": 15,
        "databaseResponseTime": 250
      },
      "deployment": {
        "platform": "Vercel",
        "region": "us-east-1",
        "url": "https://gentle-space-realty.vercel.app",
        "branch": "main",
        "commit": "abc12345"
      }
    }
  },
  "summary": {
    "status": "healthy",
    "timestamp": "2025-01-14T12:00:00.000Z",
    "version": "1.0.0",
    "uptime": 3600,
    "responseTime": 275,
    "issues": []
  },
  "message": "System is healthy"
}
```

#### Detailed Health Check
```
GET /api/health?detailed=true
```

Includes additional endpoint connectivity tests for all API endpoints:

```json
{
  "checks": {
    "endpoints": {
      "status": "healthy",
      "details": {
        "auth": {
          "status": "healthy",
          "responseTime": 45,
          "statusCode": 200
        },
        "properties": {
          "status": "healthy",
          "responseTime": 52,
          "statusCode": 200
        },
        "inquiries": {
          "status": "healthy",
          "responseTime": 38,
          "statusCode": 200
        },
        "debug": {
          "status": "healthy",
          "responseTime": 41,
          "statusCode": 200
        }
      }
    }
  }
}
```

## 📊 Health Status Levels

### Healthy
- All systems operational
- Response times within thresholds
- No critical issues detected

### Degraded
- Non-critical issues detected
- Some services experiencing delays
- Fallback mechanisms may be active

### Unhealthy
- Critical issues detected
- Service disruption likely
- Immediate attention required

## 🔧 Health Check Thresholds

### Response Time Thresholds
- **Healthy**: < 200ms
- **Degraded**: < 1000ms
- **Unhealthy**: > 1000ms

### Memory Usage Thresholds
- **Healthy**: < 70%
- **Degraded**: < 85%
- **Unhealthy**: > 85%

### Database Response Thresholds
- **Healthy**: < 500ms
- **Degraded**: < 2000ms
- **Unhealthy**: > 2000ms

## 🚀 Usage Examples

### Monitoring Integration
```bash
# Basic health check for monitoring
curl -f https://your-app.vercel.app/api/health

# Detailed health with endpoint tests
curl https://your-app.vercel.app/api/health?detailed=true

# Check specific debug information (requires admin auth in production)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     https://your-app.vercel.app/api/debug?comprehensive=true
```

### Automated Testing
```bash
# Run the comprehensive test suite
npm run test:debug-health

# Test specific functionality
node scripts/test-debug-health.js
```

### Production Monitoring
```bash
# Set up health check monitoring (replace with your monitoring service)
curl -X POST "https://your-monitoring-service.com/checks" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gentle Space Realty Health",
    "url": "https://your-app.vercel.app/api/health",
    "method": "GET",
    "expectedStatus": 200,
    "interval": 300,
    "timeout": 30
  }'
```

## 🔐 Security Considerations

### Production Environment
- Debug endpoint requires admin authentication
- Sensitive environment variables are sanitized
- Request origin validation enforced
- Rate limiting recommended

### Development Environment
- All endpoints accessible without authentication
- Full debugging information available
- CORS relaxed for local development

## 🚨 Error Handling

### Common Error Responses

#### Authentication Required (Production)
```json
{
  "success": false,
  "error": "Debug endpoint requires authentication in production",
  "timestamp": "2025-01-14T12:00:00.000Z"
}
```

#### Invalid Test Type
```json
{
  "success": false,
  "error": "Unknown test: invalid_test",
  "availableTests": ["connection", "query", "auth", "cors"]
}
```

#### Database Connection Failed
```json
{
  "success": false,
  "data": {
    "status": "unhealthy",
    "checks": {
      "database": {
        "status": "unhealthy",
        "error": "Connection timeout"
      }
    }
  }
}
```

## 🔧 Integration with Supabase MCP

The health endpoint integrates with the Supabase MCP server for enhanced database validation:

- **Project Detection**: Automatically detects active Supabase projects
- **Enhanced Validation**: Uses MCP tools for comprehensive database health checks
- **Real-time Monitoring**: Integrates with Supabase's real-time capabilities

## 📈 Monitoring Best Practices

1. **Set up automated health checks** every 5 minutes
2. **Monitor response time trends** to detect performance degradation
3. **Alert on status changes** from healthy to degraded/unhealthy
4. **Track memory usage patterns** for capacity planning
5. **Monitor database connection health** for early issue detection
6. **Use detailed health checks** during deployments for validation

## 🛠️ Troubleshooting

### Common Issues

#### Database Connection Issues
- Check Supabase credentials in environment variables
- Verify network connectivity to Supabase
- Ensure RLS policies are properly configured

#### Memory Issues
- Monitor heap usage trends
- Check for memory leaks in application code
- Consider scaling up server resources

#### Slow Response Times
- Optimize database queries
- Check network latency to external services
- Review application performance bottlenecks