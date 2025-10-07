import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig, loadEnv, Plugin } from "vite";
import path from "path";
// Temporarily commented out CSP plugin to fix server startup
// import { getCSPConfig, generateCSPString, getSupabaseCSPDirectives } from "./src/lib/cspConfig";

// CSP Plugin for Vite - Updated to use new Vite API
const cspPlugin = (env: Record<string, string>, DEBUG: boolean): Plugin => {
  return {
    name: 'csp-plugin',
    transformIndexHtml: {
      order: 'pre',
      handler(html: string, context) {
        if (DEBUG) {
          console.log("🛡️  Applying basic CSP configuration...");
        }
        
        // Simple placeholder replacement without complex CSP logic
        const isDev = context.server !== undefined;
        const devConnectSrc = isDev ? 'http://localhost:* ws://localhost:* wss://localhost:* https://*.ingest.sentry.io' : 'https://*.ingest.sentry.io';
        const devScriptSrc = isDev ? "'unsafe-eval' http://localhost:*" : '';
        
        let processedHtml = html
          .replace('%VITE_DEV_CONNECT_SRC%', devConnectSrc)
          .replace('%VITE_DEV_SCRIPT_SRC%', devScriptSrc)
          .replace('%VITE_CSP_DIRECTIVES%', '')
          .replace('%VITE_SUPABASE_PRECONNECT%', env.VITE_SUPABASE_URL 
            ? `<link rel="preconnect" href="${env.VITE_SUPABASE_URL}" crossorigin>`
            : '')
          .replace(/%VITE_APP_URL%/g, env.VITE_APP_URL || 
            (isDev ? 'http://localhost:5174' : 'https://your-domain.com'));
        
        return processedHtml;
      }
    }
  };
};

// Build plugins array with CSP plugin
const buildPlugins = (env: Record<string, string>, DEBUG: boolean) => {
  return [react(), cspPlugin(env, DEBUG)];
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables using loadEnv for consistent behavior
  const env = loadEnv(mode, process.cwd(), '');
  const DEBUG = env.DEBUG_VITE_CONFIG === 'true';
  
  if (DEBUG) {
    console.log("🔧 Vite Configuration Loading...");
    console.log("📁 Current working directory:", process.cwd());
    console.log("🌍 Environment mode:", mode);
    console.log("🌍 NODE_ENV:", env.NODE_ENV || "development");
  }

  // Path alias configuration with debug logging
  const srcPath = path.resolve(__dirname, "src");
  if (DEBUG) {
    console.log("🔗 Path alias '@' configured to:", srcPath);
  }

  return {
    // Plugin configuration with error handling and fallback
    plugins: buildPlugins(env, DEBUG),
    
    // Public directory configuration
    publicDir: "./public",
    base: "/",
    
    // CSS processing configuration
    css: {
      postcss: {
        plugins: [tailwind()],
      },
    },
    
    // Module resolution with path aliases
    resolve: {
      alias: {
        "@": srcPath,
      },
    },
    
    // Build configuration with asset optimization
    build: {
      sourcemap: true, // Enable source maps for debugging and Sentry error tracking
      assetsDir: "assets", // Directory for static assets in build output
      rollupOptions: {
        output: {
          // Custom asset file naming strategy for better caching and organization
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') ?? [];
            let extType = info[info.length - 1];
            
            // Organize images into images subdirectory
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType ?? '')) {
              extType = 'images';
            } 
            // Organize fonts into fonts subdirectory
            else if (/woff2?|ttf|otf|eot/i.test(extType ?? '')) {
              extType = 'fonts';
            }
            
            return `assets/${extType}/[name].[hash][extname]`;
          },
          // Manual chunks for bundle optimization
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
            router: ['react-router-dom'],
            utils: ['clsx', 'class-variance-authority', 'tailwind-merge'],
            forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
            maps: ['@googlemaps/js-api-loader'],
            motion: ['framer-motion']
          },
        },
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 800,
    },
    
    // Asset inclusion patterns for various image formats
    assetsInclude: [
      '**/*.jpg', 
      '**/*.jpeg', 
      '**/*.png', 
      '**/*.svg', 
      '**/*.gif', 
      '**/*.webp', 
      '**/*.ico'
    ],
    
    // Development server configuration
    server: {
      port: 5174,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
      },
    },
    
    // Preview server configuration for SPA routing
    preview: {
      port: 4173,
      host: true,
      // Enable SPA fallback for client-side routing
      // This ensures all routes serve index.html instead of 404
      open: false,
    },
  };
});