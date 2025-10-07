import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAdminStore } from '@/store/adminStore';
import { useTestimonialStore } from '@/store/testimonialStore';
import { 
  LayoutDashboard, 
  Building, 
  Users, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Settings,
  Home,
  MessageSquare,
  Tag,
  HelpCircle,
  Building2,
  TestTube,
  Globe,
  Beaker
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentPage, onPageChange }) => {
  const { admin, logout, inquiries } = useAdminStore();
  const { testimonials } = useTestimonialStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const newInquiriesCount = inquiries.filter(i => i.status === 'new').length;
  const pendingTestimonialsCount = testimonials.filter(t => t.status === 'pending').length;

  const navigation = [
    {
      name: 'Dashboard',
      id: 'dashboard',
      icon: LayoutDashboard,
      current: currentPage === 'dashboard',
    },
    {
      name: 'Properties',
      id: 'properties',
      icon: Building,
      current: currentPage === 'properties',
    },
    {
      name: 'Tags',
      id: 'tags',
      icon: Tag,
      current: currentPage === 'tags',
    },
    {
      name: 'Inquiries',
      id: 'inquiries',
      icon: Users,
      current: currentPage === 'inquiries',
      badge: newInquiriesCount > 0 ? newInquiriesCount : undefined,
    },
    {
      name: 'Testimonials',
      id: 'testimonials',
      icon: MessageSquare,
      current: currentPage === 'testimonials',
      badge: pendingTestimonialsCount > 0 ? pendingTestimonialsCount : undefined,
    },
    {
      name: 'FAQ Management',
      id: 'faq',
      icon: HelpCircle,
      current: currentPage === 'faq',
    },
    {
      name: 'Companies',
      id: 'companies',
      icon: Building2,
      current: currentPage === 'companies',
    },
    {
      name: 'Property Scraper',
      id: 'scraper',
      icon: Globe,
      current: currentPage === 'scraper',
    },
    {
      name: 'Mock Accounts',
      id: 'mock-accounts',
      icon: TestTube,
      current: currentPage === 'mock-accounts',
    },
    {
      name: 'Sample',
      id: 'sample',
      icon: Beaker,
      current: currentPage === 'sample',
    },
    {
      name: 'Settings',
      id: 'settings',
      icon: Settings,
      current: currentPage === 'settings',
    },
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Logo size="sm" />
            <span className="text-lg font-bold text-gray-900">Admin Portal</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </Button>
        </div>

        <nav className="mt-6 px-3 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  onPageChange(item.id);
                  setSidebarOpen(false);
                  // Update URL to match the selected page
                  const newPath = item.id === 'dashboard' ? '/admin' : `/admin/${item.id}`;
                  window.history.pushState(null, '', newPath);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  item.current
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center">
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>

        <div className="mt-auto p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-medium text-sm">
                {admin?.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {admin?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {admin?.email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-gray-600 hover:text-red-600 hover:border-red-300"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </Button>

            <div className="flex items-center space-x-4 ml-auto">
              {/* Home Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-primary-600"
                title="Go to Homepage"
              >
                <Home size={16} />
                <span className="hidden sm:inline">Home</span>
              </Button>

              <Button variant="ghost" size="sm" className="relative">
                <Bell size={20} />
                {newInquiriesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {newInquiriesCount}
                  </span>
                )}
              </Button>
              
              <div className="text-sm text-gray-600 hidden sm:block">
                Welcome back, {admin?.name}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="min-h-screen p-4 lg:p-6">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
