// Load environment variables from .env files
require('dotenv').config();

module.exports = {
  apps: [{
    name: "gentle-space-realty",
    script: "./server/index.js",
    instances: 2,
    exec_mode: "cluster",
    
    // Development Environment - uses .env file variables
    env: {
      NODE_ENV: "development",
      PORT: process.env.PORT || 3000,
      
      // Load Supabase configuration from environment
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      
      // Google OAuth configuration
      VITE_GOOGLE_CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      
      // Debug configuration
      VITE_DEBUG_AUTH: process.env.VITE_DEBUG_AUTH,
      VITE_DEBUG_SUPABASE: process.env.VITE_DEBUG_SUPABASE,
      DEBUG_OAUTH_FLOW: process.env.DEBUG_OAUTH_FLOW,
      
      // Security configuration
      JWT_SECRET: process.env.JWT_SECRET,
      SESSION_SECRET: process.env.SESSION_SECRET,
      
      // Application configuration
      TZ: process.env.TZ || "Asia/Kolkata"
    },
    
    // Production Environment - REQUIRES all environment variables to be properly set
    env_production: {
      NODE_ENV: "production",
      PORT: process.env.PORT || 3000,
      
      // Supabase Configuration - MUST be set via environment variables in production
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
      
      // Server-side Supabase - MUST be set via environment variables in production
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      
      // Google OAuth configuration
      VITE_GOOGLE_CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      
      // Database Configuration - MUST be set via environment variables in production
      DATABASE_URL: process.env.DATABASE_URL,
      
      // Security - MUST be set via environment variables in production (no defaults)
      JWT_SECRET: process.env.JWT_SECRET,
      SESSION_SECRET: process.env.SESSION_SECRET,
      
      // GCP Configuration
      GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT || "sragupathi-641f4622",
      GOOGLE_CLOUD_REGION: process.env.GOOGLE_CLOUD_REGION || "asia-south1",
      GOOGLE_CLOUD_ZONE: process.env.GOOGLE_CLOUD_ZONE || "asia-south1-a",
      
      // Application Configuration
      TZ: process.env.TZ || "Asia/Kolkata",
      ENVIRONMENT: "production",
      
      // Production-specific OAuth settings - Disable debug in production
      VITE_DEBUG_AUTH: "false",
      VITE_DEBUG_SUPABASE: "false"
    },
    
    // Process management
    max_memory_restart: "300M",
    min_uptime: "10s",
    max_restarts: 10,
    restart_delay: 4000,
    
    // Logging
    log_file: "./logs/combined.log",
    out_file: "./logs/out.log",
    error_file: "./logs/error.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    merge_logs: true,
    
    // Monitoring
    watch: false,
    ignore_watch: ["node_modules", "logs", ".git"],
    
    // Advanced settings
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Auto-restart on uncaught exceptions
    autorestart: true,
    
    // Instance variables for cluster mode
    instance_var: "INSTANCE_ID",
    
    // Health monitoring
    health_check_grace_period: 3000,
    health_check_fatal_exceptions: true
  }],
  
  deploy: {
    production: {
      user: "nodejs",
      host: "localhost",
      ref: "origin/main",
      repo: "git@github.com:your-org/gentle-space-realty.git",
      path: "/var/www/gentle-space-realty",
      "post-deploy": "npm install && pm2 reload ecosystem.config.cjs --env production",
      "post-setup": "ls -la"
    }
  }
};
