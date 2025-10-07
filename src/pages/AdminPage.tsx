import React, { useState, useEffect } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { useTestimonialStore } from '@/store/testimonialStore';
import { useFAQStore } from '@/store/faqStore';
import { mockProperties } from '@/data/mockProperties';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/components/admin/AdminDashboard';
import PropertyManagement from '@/components/admin/PropertyManagement';
import TagManagement from '@/components/admin/TagManagement';
import InquiryManagement from '@/components/admin/InquiryManagement';
import TestimonialManagement from '@/components/admin/TestimonialManagement';
import FAQManagement from '@/components/admin/FAQManagement';
import CompanyManagement from '@/components/admin/CompanyManagement';
import MockAccountManager from '@/components/admin/MockAccountManager';
import SettingsPage from '@/components/admin/SettingsPage';
import ScraperManagement from '@/components/scraper/ScraperManagement';
import SamplePage from '@/components/admin/SamplePage';
import { logComponentEvent } from '@/utils/debugHelper';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';

const AdminPage: React.FC = () => {
  const { 
    isAuthenticated, 
    isRestoringAuth, 
    admin, 
    getCurrentUser,
    setAdminProperties, 
    loadInquiries, 
    _authOperationInProgress
  } = useAdminStore();
  const { loadTestimonials } = useTestimonialStore();
  const { initializeWithMockData } = useFAQStore();
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);
  const [hasAttemptedRestore, setHasAttemptedRestore] = useState(false);
  
  // Determine current page from URL
  const getCurrentPageFromUrl = () => {
    const pathname = window.location.pathname;
    if (pathname.includes('/admin/dashboard')) return 'dashboard';
    if (pathname.includes('/admin/properties')) return 'properties';
    if (pathname.includes('/admin/tags')) return 'tags';
    if (pathname.includes('/admin/inquiries')) return 'inquiries';
    if (pathname.includes('/admin/testimonials')) return 'testimonials';
    if (pathname.includes('/admin/faq')) return 'faq';
    if (pathname.includes('/admin/companies')) return 'companies';
    if (pathname.includes('/admin/scraper')) return 'scraper';
    if (pathname.includes('/admin/sample')) return 'sample';
    if (pathname.includes('/admin/settings')) return 'settings';
    return 'dashboard'; // default
  };
  
  const [currentPage, setCurrentPage] = useState(getCurrentPageFromUrl());

  // Simplified component initialization
  useEffect(() => {
    logComponentEvent('AdminPage', 'mounted', {
      isAuthenticated,
      currentPage,
      hasAdmin: !!admin,
      isRestoringAuth
    });
    
    return () => {
      logComponentEvent('AdminPage', 'unmounted');
    };
  }, []);
  
  // Consolidated authentication effect - single source of truth for authentication handling
  useEffect(() => {
    const handleAuthentication = async () => {
      // Skip authentication handling if auth operation is in progress
      if (_authOperationInProgress) {
        console.log('🔐 AdminPage: Auth operation in progress, skipping authentication handling');
        return;
      }
      
      // Log authentication state change
      logComponentEvent('AdminPage', 'auth_state_change', {
        isAuthenticated,
        hasAdmin: !!admin,
        isRestoringAuth,
        currentPage,
        hasAttemptedRestore
      });
      
      // If not authenticated and haven't attempted restoration yet, attempt session restoration
      if (!isAuthenticated && !isRestoringAuth && !admin && !hasAttemptedRestore) {
        console.log('🔐 AdminPage: Attempting session restoration...');
        setHasAttemptedRestore(true);
        setIsInitializing(true);
        
        try {
          await getCurrentUser();
        } catch (error) {
          console.error('❌ AdminPage: Session restoration failed:', error);
        } finally {
          setIsInitializing(false);
        }
      } else if (isAuthenticated && admin) {
        // Authenticated state - ensure initialization is complete
        setIsInitializing(false);
      }
    };
    
    handleAuthentication();
  }, [isAuthenticated, admin, _authOperationInProgress, currentPage, hasAttemptedRestore]);

  // Track URL changes and update currentPage accordingly
  useEffect(() => {
    const handleUrlChange = () => {
      const newPage = getCurrentPageFromUrl();
      console.log('🔍 AdminPage: URL changed - pathname =', window.location.pathname, 'detected page =', newPage);
      if (newPage !== currentPage) {
        console.log('🔍 AdminPage: Updating currentPage from', currentPage, 'to', newPage);
        setCurrentPage(newPage);
      }
    };

    // Listen for browser navigation events
    window.addEventListener('popstate', handleUrlChange);
    
    // Also check on mount and when isAuthenticated changes
    handleUrlChange();
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [currentPage, isAuthenticated]);

  // Simplified data loading effect - only runs when authenticated
  useEffect(() => {
    const loadData = async () => {
      // Only load data if authenticated, not initializing, and have admin user
      if (!isAuthenticated || isInitializing || !admin || isRestoringAuth) {
        return;
      }

      console.log('📋 AdminPage: Loading admin data...');
      setDataLoadError(null);
      
      try {
        // Load admin data safely with proper error handling
        setAdminProperties(mockProperties);
        
        await Promise.allSettled([
          loadTestimonials().catch(error => {
            console.error('❌ AdminPage: Error loading testimonials:', error);
          }),
          loadInquiries().catch(error => {
            console.error('❌ AdminPage: Error loading inquiries:', error);
          })
        ]);
        
        initializeWithMockData();
        
        console.log('✅ AdminPage: Admin data loading complete');
      } catch (error) {
        const errorMsg = `Failed to load admin data: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error('❌ AdminPage: Critical error loading admin data:', error);
        setDataLoadError(errorMsg);
      }
    };
    
    loadData();
  }, [isAuthenticated, isInitializing, admin, isRestoringAuth]);


  // Simplified retry handler for data loading
  const handleDataRetry = async () => {
    setDataLoadError(null);
    
    // Trigger re-render to attempt data loading again
    useAdminStore.setState({ lastUpdate: Date.now() });
  };


  // Simplified loading state
  if (isInitializing || isRestoringAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isRestoringAuth ? 'Restoring Authentication' : 'Initializing Admin Portal'}
          </h2>
          <p className="text-gray-600">
            {isRestoringAuth 
              ? 'Verifying your credentials and restoring session...' 
              : 'Setting up the admin environment...'}
          </p>
        </div>
      </div>
    );
  }

  // Render login page if not authenticated
  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  // Show data loading error state with retry option
  if (dataLoadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-red-200">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Data Loading Failed</h2>
            <p className="text-gray-600 mb-4">
              We encountered an issue loading your admin data. This might be due to network connectivity or server issues.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-700">
                <strong>Error:</strong> {dataLoadError}
              </p>
            </div>
            <button
              onClick={handleDataRetry}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Loading Data</span>
            </button>
          </div>
        </div>
      </div>
    );
  }


  const renderCurrentPage = () => {
    try {
      switch (currentPage) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'properties':
          return <PropertyManagement />;
        case 'tags':
          return <TagManagement />;
        case 'inquiries':
          return <InquiryManagement />;
        case 'testimonials':
          return <TestimonialManagement />;
        case 'faq':
          return <FAQManagement />;
        case 'companies':
          return <CompanyManagement />;
        case 'scraper':
          return <ScraperManagement />;
        case 'mock-accounts':
          return <MockAccountManager />;
        case 'sample':
          return <SamplePage />;
        case 'settings':
          return <SettingsPage />;
        default:
          return <AdminDashboard />;
      }
    } catch (error) {
      console.error('❌ AdminPage: Error rendering page component:', error);
      return <div>Error loading admin page</div>;
    }
  };

  // Render error state if we have one
  if (renderError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Admin Page Render Error</h1>
          <p className="text-red-600 mb-4">{renderError}</p>
          <button
            onClick={() => setRenderError(null)}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render admin layout with current page
  try {
    return (
      <AdminLayout currentPage={currentPage} onPageChange={setCurrentPage}>
        {renderCurrentPage()}
      </AdminLayout>
    );
  } catch (error) {
    console.error('❌ AdminPage: Error rendering AdminLayout:', error);
    setRenderError(`AdminLayout render error: ${error}`);
    return null;
  }
};

export default AdminPage;
