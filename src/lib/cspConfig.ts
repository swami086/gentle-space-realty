/**
 * CSP Configuration Utility
 * Provides environment-specific Content Security Policy settings
 */

export interface CSPDirectives {
  defaultSrc?: string[];
  connectSrc?: string[];
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  fontSrc?: string[];
  objectSrc?: string[];
  mediaSrc?: string[];
  frameSrc?: string[];
  workerSrc?: string[];
  childSrc?: string[];
  formAction?: string[];
  frameAncestors?: string[];
  upgradeInsecureRequests?: boolean;
}

export interface CSPConfig {
  directives: CSPDirectives;
  reportOnly?: boolean;
  reportUri?: string;
}

// Environment-specific CSP configurations
const developmentCSP: CSPConfig = {
  directives: {
    defaultSrc: ["'self'"],
    connectSrc: [
      "'self'",
      "https://maps.googleapis.com",
      "https://maps.gstatic.com",
      "http://localhost:*",
      "ws://localhost:*",
      "https://vitejs.dev"
    ],
    scriptSrc: [
      "'self'",
      "'unsafe-eval'",
      "'unsafe-inline'",
      "https://maps.googleapis.com",
      "https://maps.gstatic.com",
      "http://localhost:*"
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://maps.googleapis.com"
    ],
    imgSrc: [
      "'self'",
      "data:",
      "blob:",
      "https:",
      "https://maps.googleapis.com",
      "https://maps.gstatic.com",
      "http://localhost:*"
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
      "data:"
    ],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'self'", "https://maps.google.com"],
    workerSrc: ["'self'", "blob:"],
    childSrc: ["'self'", "blob:"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"]
  },
  reportOnly: false
};

const stagingCSP: CSPConfig = {
  directives: {
    defaultSrc: ["'self'"],
    connectSrc: [
      "'self'",
      "https://maps.googleapis.com",
      "https://maps.gstatic.com"
    ],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'",
      "https://maps.googleapis.com",
      "https://maps.gstatic.com"
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://maps.googleapis.com"
    ],
    imgSrc: [
      "'self'",
      "data:",
      "blob:",
      "https:",
      "https://maps.googleapis.com",
      "https://maps.gstatic.com"
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
      "data:"
    ],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'self'", "https://maps.google.com"],
    workerSrc: ["'self'", "blob:"],
    childSrc: ["'self'", "blob:"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: true
  },
  reportOnly: false
};

const productionCSP: CSPConfig = {
  directives: {
    defaultSrc: ["'self'"],
    connectSrc: [
      "'self'",
      "https://maps.googleapis.com",
      "https://maps.gstatic.com"
    ],
    scriptSrc: [
      "'self'",
      "https://maps.googleapis.com",
      "https://maps.gstatic.com"
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://maps.googleapis.com"
    ],
    imgSrc: [
      "'self'",
      "data:",
      "blob:",
      "https:",
      "https://maps.googleapis.com",
      "https://maps.gstatic.com"
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
      "data:"
    ],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'self'", "https://maps.google.com"],
    workerSrc: ["'self'", "blob:"],
    childSrc: ["'self'", "blob:"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: true
  },
  reportOnly: false
  // reportUri removed - no /api/csp-report endpoint in frontend-only architecture
};

// Environment detection
export function getEnvironment(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
    if (hostname.includes('staging') || hostname.includes('test')) {
      return 'staging';
    }
  }
  return import.meta.env.MODE || 'production';
}

// Get CSP configuration for current environment
export function getCSPConfig(environment?: string): CSPConfig {
  const env = environment || getEnvironment();
  
  switch (env) {
    case 'development':
      return developmentCSP;
    case 'staging':
      return stagingCSP;
    case 'production':
    default:
      return productionCSP;
  }
}

// Generate CSP string from configuration
export function generateCSPString(config: CSPConfig): string {
  const directives: string[] = [];
  
  Object.entries(config.directives).forEach(([key, value]) => {
    if (value === true) {
      // For boolean directives like upgrade-insecure-requests
      directives.push(kebabCase(key));
    } else if (Array.isArray(value) && value.length > 0) {
      directives.push(`${kebabCase(key)} ${value.join(' ')}`);
    }
  });
  
  let cspString = directives.join('; ');
  
  if (config.reportUri) {
    cspString += `; report-uri ${config.reportUri}`;
  }
  
  return cspString;
}

// Helper function to convert camelCase to kebab-case
function kebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

// Supabase-specific CSP helper
export function getSupabaseCSPDirectives(): Partial<CSPDirectives> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseDomain = supabaseUrl ? new URL(supabaseUrl).hostname : '*.supabase.co';
  
  return {
    connectSrc: [
      `https://${supabaseDomain}`,
      `wss://${supabaseDomain}`
    ],
    imgSrc: [`https://${supabaseDomain}`],
    mediaSrc: [`https://${supabaseDomain}`]
  };
}

// Validate CSP compliance
export function validateCSPCompliance(url: string, directive: keyof CSPDirectives): boolean {
  const config = getCSPConfig();
  const directiveValues = config.directives[directive];
  
  if (!directiveValues || !Array.isArray(directiveValues)) {
    return false;
  }
  
  // Check if URL matches any of the allowed sources
  return directiveValues.some(source => {
    if (source === "'self'") {
      return url.startsWith(window.location.origin);
    }
    if (source === "'unsafe-inline'" || source === "'unsafe-eval'") {
      return true;
    }
    if (source === 'data:' || source === 'blob:') {
      return url.startsWith(source);
    }
    if (source === 'https:' || source === 'http:') {
      return url.startsWith(source);
    }
    if (source.includes('*')) {
      const pattern = source.replace(/\*/g, '.*');
      return new RegExp(`^${pattern}`).test(url);
    }
    return url.startsWith(source);
  });
}

// Debug utilities for CSP issues
export const CSPDebug = {
  logConfig: () => {
    const config = getCSPConfig();
    console.group('🔒 CSP Configuration');
    console.log('Environment:', getEnvironment());
    console.log('Config:', config);
    console.log('CSP String:', generateCSPString(config));
    console.groupEnd();
  },
  
  testUrl: (url: string, directive: keyof CSPDirectives) => {
    const isValid = validateCSPCompliance(url, directive);
    console.log(`🔍 CSP Test: ${url} for ${directive}:`, isValid ? '✅ ALLOWED' : '❌ BLOCKED');
    return isValid;
  },
  
  getViolationInfo: (violatedDirective: string, blockedUri: string) => {
    const config = getCSPConfig();
    const directive = violatedDirective.replace(/-/g, '') as keyof CSPDirectives;
    const allowedSources = config.directives[directive] || [];
    
    return {
      violatedDirective,
      blockedUri,
      allowedSources,
      suggestion: `Add '${blockedUri}' to ${violatedDirective} directive`,
      currentConfig: allowedSources
    };
  }
};

// Export default configuration for current environment
export default getCSPConfig();
