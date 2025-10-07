import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import PropertiesPage from './pages/PropertiesPage';
import AdminPage from './pages/AdminPage';
import AuthCallback from './pages/AuthCallback';
import { UserDashboard } from './components/user/UserDashboard';
import { FloatingContactForm } from './components/contact/FloatingContactForm';
import { InitializationScreen } from './components/InitializationScreen';
import C1APITest from './components/C1APITest';
import C1ComponentTemplate from './components/ai/C1ComponentTemplate';
import C1RealEstateComponent from './components/ai/C1RealEstateComponent';
import C1ChatComponent from './components/ai/C1ChatComponent';
import C1UISpecWorkflowTest from './components/C1UISpecWorkflowTest';
import { useUserStore } from './store/userStore';
import { initializeSentry } from './utils/sentry';
import { Environment } from '@/config/environment';

const App: React.FC = () => {
  const { initializeAuth } = useUserStore();
  const [initState, setInitState] = useState<'initializing' | 'ready' | 'error'>('ready');
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🚀 App initialization started - simplified authentication flow');
    
    const initialize = async () => {
      try {
        // Suppress browser extension errors globally
        const originalConsoleError = console.error;
        console.error = (...args: any[]) => {
          const message = args.join(' ').toString().toLowerCase();
          if (message.includes('unchecked runtime.lasterror') || 
              message.includes('message channel closed') ||
              message.includes('listener indicated an asynchronous response') ||
              message.includes('chrome-extension://') ||
              message.includes('extension error')) {
            // Suppress browser extension related errors silently
            return;
          }
          originalConsoleError.apply(console, args);
        };

        // Validate environment configuration first
        const validation = Environment.validateEnvironment();
        if (!validation.isValid) {
          const errorMessage = `Environment validation failed:\n${validation.errors.join('\n')}`;
          console.error('❌ Environment validation failed:', validation.errors);
          setInitError(errorMessage);
          setInitState('error');
          return;
        }

        console.log('✅ Environment validation passed');

        // Simplified initialization - remove complex API auth initialization to prevent conflicts
        // with admin authentication flow. Let admin store manage its own auth tokens.
        
        // Initialize user authentication (non-admin)
        try {
          await initializeAuth();
          console.log('✅ User authentication initialized successfully');
        } catch (error) {
          console.error('⚠️ User authentication initialization failed:', error);
          // Non-fatal error - authentication can be retried later
        }
        
        // Initialize Sentry for tracing and debugging
        try {
          initializeSentry();
          console.log('✅ Sentry initialized successfully');
        } catch (error) {
          console.error('⚠️ Sentry initialization failed:', error);
          // Non-fatal error
        }
        
        // Add fade-in animation styles with GSR prefix to avoid Tailwind conflicts
        const style = document.createElement('style');
        style.id = 'startup-inline-styles';
        style.textContent = `
          .gsr-animate-fade-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
          }
          .gsr-line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `;
        // Guard against React 18 StrictMode duplication
        document.getElementById('startup-inline-styles')?.remove();
        document.head.appendChild(style);

        console.log('🎉 App initialization completed successfully');
        // setInitState('ready'); // Already set to ready initially

        return () => {
          if (document.getElementById('startup-inline-styles')) {
            document.head.removeChild(style);
          }
        };
      } catch (error) {
        console.error('❌ Critical initialization error:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown initialization error');
        setInitState('error');
      }
    };

    initialize();
  }, [initializeAuth]);

  // Show initialization error screen
  if (initState === 'error') {
    return (
      <InitializationScreen 
        error={initError || 'Unknown initialization error'}
        onRetry={() => {
          setInitState('initializing');
          setInitError(null);
          window.location.reload();
        }}
      />
    );
  }

  // Show loading screen while initializing
  if (initState === 'initializing') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Initializing Application
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Setting up your environment...
          </p>
        </div>
      </div>
    );
  }

  // Safe environment access for logging
  try {
    if (Environment.isDevelopment() || Environment.isDebugMode()) {
      console.log('🎨 App render started');
    }
  } catch {
    // Safe fallback
  }

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-white">
        <Routes>
          {/* Admin routes without layout */}
          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Dashboard route with layout */}
          <Route path="/dashboard" element={
            <div className="layout-container flex h-full grow flex-col">
              <Header />
              <main className="flex-1">
                <UserDashboard />
              </main>
              <Footer />
              <FloatingContactForm />
            </div>
          } />
          
          {/* Main app routes with shared layout - using catch-all pattern */}
          <Route path="/*" element={
            <div className="layout-container flex h-full grow flex-col">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/properties" element={<PropertiesPage />} />
                  <Route path="/test-c1" element={<C1APITest />} />
                  <Route path="/c1-template" element={<C1ComponentTemplate />} />
                  <Route path="/c1-real-estate" element={<C1RealEstateComponent />} />
                  <Route path="/c1-chat" element={<C1ChatComponent />} />
                  <Route path="/c1-workflow-test" element={<C1UISpecWorkflowTest />} />
                </Routes>
              </main>
              <Footer />
              <FloatingContactForm />
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default App;