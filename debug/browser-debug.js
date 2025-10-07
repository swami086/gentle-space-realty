/**
 * Enhanced Browser Debug Script for Admin Portal
 * Copy and paste this into the browser console to monitor the login flow
 */

window.adminDebugger = {
  // Debug state
  debugActive: false,
  logs: [],
  
  // Initialize debugging
  init() {
    console.log('🔧 Admin Portal Debugger Initialized');
    this.debugActive = true;
    this.setupInterceptors();
    this.monitorState();
    return 'Debug mode active. Login with: admin@gentlespace.com / GentleSpace2025!';
  },
  
  // Setup API and navigation interceptors
  setupInterceptors() {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = (...args) => {
      const [url, options] = args;
      console.log('🌐 API Call:', url, options?.method || 'GET');
      
      return originalFetch(...args)
        .then(response => {
          console.log('📥 API Response:', url, response.status, response.statusText);
          return response;
        })
        .catch(error => {
          console.error('❌ API Error:', url, error);
          throw error;
        });
    };
    
    // Monitor URL changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(data, title, url) {
      console.log('🧭 Navigation (pushState):', url);
      return originalPushState.apply(history, arguments);
    };
    
    history.replaceState = function(data, title, url) {
      console.log('🧭 Navigation (replaceState):', url);
      return originalReplaceState.apply(history, arguments);
    };
    
    // Listen for popstate
    window.addEventListener('popstate', (event) => {
      console.log('🧭 Navigation (popstate):', window.location.pathname);
    });
  },
  
  // Monitor admin store state
  monitorState() {
    let lastState = null;
    
    setInterval(() => {
      if (!this.debugActive) return;
      
      // Try to access admin store
      try {
        const adminStore = window.__ZUSTAND_ADMIN_STORE__?.getState?.();
        if (adminStore && JSON.stringify(adminStore) !== JSON.stringify(lastState)) {
          console.log('🔄 Admin Store State Changed:', {
            isAuthenticated: adminStore.isAuthenticated,
            admin: adminStore.admin?.email,
            isLoading: adminStore.isLoading,
            isRestoringAuth: adminStore.isRestoringAuth,
            error: adminStore.error
          });
          lastState = adminStore;
        }
      } catch (e) {
        // Store not available yet
      }
    }, 1000);
  },
  
  // Check current state
  checkState() {
    console.log('🔍 Current State Check:');
    console.log('URL:', window.location.href);
    console.log('Pathname:', window.location.pathname);
    
    try {
      const adminStore = window.__ZUSTAND_ADMIN_STORE__?.getState?.();
      if (adminStore) {
        console.log('Admin Store:', {
          isAuthenticated: adminStore.isAuthenticated,
          admin: adminStore.admin,
          isLoading: adminStore.isLoading,
          isRestoringAuth: adminStore.isRestoringAuth,
          error: adminStore.error,
          inquiries: adminStore.inquiries?.length || 0,
          adminProperties: adminStore.adminProperties?.length || 0
        });
      } else {
        console.log('❌ Admin Store not accessible');
      }
    } catch (e) {
      console.error('Error accessing admin store:', e);
    }
    
    // Check for React errors
    const reactErrorBoundary = document.querySelector('[data-reactroot]');
    if (reactErrorBoundary) {
      console.log('✅ React app root found');
    } else {
      console.log('❌ React app root not found');
    }
    
    // Check for admin components
    const adminElements = document.querySelectorAll('[class*="admin"]');
    console.log('🎯 Admin elements found:', adminElements.length);
    
    return 'State check complete - see console output above';
  },
  
  // Test login manually
  async testLogin(email = 'admin@gentlespace.com', password = 'GentleSpace2025!') {
    console.log('🧪 Testing login with:', email);
    
    try {
      const adminStore = window.__ZUSTAND_ADMIN_STORE__?.getState?.();
      if (!adminStore) {
        return 'Error: Admin store not available';
      }
      
      console.log('📝 Starting login process...');
      const result = await adminStore.login(email, password);
      
      console.log('✅ Login result:', result);
      
      // Wait a bit then check state
      setTimeout(() => {
        this.checkState();
      }, 2000);
      
      return result ? 'Login successful' : 'Login failed';
    } catch (error) {
      console.error('❌ Login test error:', error);
      return 'Login error: ' + error.message;
    }
  },
  
  // Navigate to admin dashboard manually
  goToDashboard() {
    console.log('🧭 Navigating to admin dashboard...');
    window.history.pushState({}, '', '/admin/dashboard');
    
    // Trigger a popstate event to notify React Router
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    
    setTimeout(() => {
      this.checkState();
    }, 1000);
    
    return 'Navigation attempted - check console for results';
  },
  
  // Stop debugging
  stop() {
    this.debugActive = false;
    console.log('🛑 Admin Portal Debugger Stopped');
    return 'Debug mode deactivated';
  },
  
  // Get help
  help() {
    console.log(`
🔧 Admin Portal Debugger Commands:
• adminDebugger.init() - Start debugging
• adminDebugger.checkState() - Check current state
• adminDebugger.testLogin() - Test login with default credentials  
• adminDebugger.testLogin(email, password) - Test login with custom credentials
• adminDebugger.goToDashboard() - Navigate to dashboard manually
• adminDebugger.stop() - Stop debugging
• adminDebugger.help() - Show this help

📋 Debug Process:
1. Run adminDebugger.init()
2. Go to http://localhost:5174/admin
3. Try logging in normally
4. If login fails, run adminDebugger.testLogin()
5. If login succeeds but page is blank, run adminDebugger.goToDashboard()
6. Use adminDebugger.checkState() to check current state at any time
    `);
    return 'Help displayed - see console output above';
  }
};

// Auto-initialize if we're on the admin page
if (window.location.pathname.includes('/admin')) {
  console.log('🎯 Admin page detected - initializing debugger');
  window.adminDebugger.init();
} else {
  console.log('ℹ️ Admin debugger ready. Run adminDebugger.help() for commands');
}