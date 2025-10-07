import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogOut, Settings, Heart } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { AuthModal } from '@/components/auth/AuthModal';
import Logo from './Logo';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const { user, isAuthenticated, logout } = useUserStore();
  const navigate = useNavigate();

  const navigateToSection = (sectionId: string) => {
    // If we're not on the home page, navigate there first
    if (window.location.pathname !== '/') {
      navigate('/', { replace: false });
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // Already on home page, just scroll
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMobileMenuOpen(false);
  };

  const handleAuthClick = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 px-10 py-4 bg-white">
      <div className="flex items-center gap-3 text-gray-900">
        <Logo size="md" />
        <h2 className="text-gray-900 text-xl font-bold">Gentle Space</h2>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-6">
        <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link
            to="/"
            className="hover:text-primary-600 transition-colors"
          >
            Home
          </Link>
          <Link
            to="/properties"
            className="hover:text-primary-600 transition-colors"
          >
            Properties
          </Link>
          <button
            className="hover:text-primary-600 transition-colors"
            onClick={() => navigateToSection('services')}
          >
            Services
          </button>
          <button
            className="hover:text-primary-600 transition-colors"
            onClick={() => navigateToSection('about')}
          >
            About
          </button>
          <button
            className="hover:text-primary-600 transition-colors"
            onClick={() => navigateToSection('faq')}
          >
            FAQ
          </button>
          <button
            className="hover:text-primary-600 transition-colors"
            onClick={() => navigateToSection('contact')}
          >
            Contact
          </button>
        </nav>
        {isAuthenticated ? (
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center"
            >
              <Heart size={14} className="mr-1" />
              Saved ({user?.savedProperties?.length || 0})
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                ) : (
                  <span className="text-primary-600 font-medium text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="text-gray-600 hover:text-red-600 p-1"
                >
                  <LogOut size={14} />
                </Button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="p-2">
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings size={16} />
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => handleAuthClick('login')}
            >
              Sign In
            </Button>
            <Button
              className="bg-primary-600 text-white hover:bg-primary-700"
              onClick={() => handleAuthClick('register')}
            >
              Sign Up
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Menu Button */}
      <Button
        className="md:hidden bg-transparent text-gray-900 hover:bg-gray-100 p-2"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 md:hidden z-50">
          <nav className="flex flex-col p-4 space-y-4">
            <Link
              to="/"
              className="text-gray-600 hover:text-primary-600 transition-colors text-left"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/properties"
              className="text-gray-600 hover:text-primary-600 transition-colors text-left"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Properties
            </Link>
            <button
              className="text-gray-600 hover:text-primary-600 transition-colors text-left"
              onClick={() => navigateToSection('services')}
            >
              Services
            </button>
            <button
              className="text-gray-600 hover:text-primary-600 transition-colors text-left"
              onClick={() => navigateToSection('about')}
            >
              About
            </button>
            <button
              className="text-gray-600 hover:text-primary-600 transition-colors text-left"
              onClick={() => navigateToSection('faq')}
            >
              FAQ
            </button>
            <button
              className="text-gray-600 hover:text-primary-600 transition-colors text-left"
              onClick={() => navigateToSection('contact')}
            >
              Contact
            </button>
            {isAuthenticated ? (
              <div className="space-y-3 mt-4 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigate('/dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full"
                >
                  <Heart size={16} className="mr-2" />
                  Saved Properties ({user?.savedProperties?.length || 0})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-red-600 hover:text-red-700"
                >
                  <LogOut size={16} className="mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mt-4 border-t pt-4">
                <Button
                  variant="ghost"
                  onClick={() => handleAuthClick('login')}
                  className="justify-start"
                >
                  Sign In
                </Button>
                <Button
                  className="bg-primary-600 text-white hover:bg-primary-700 justify-start"
                  onClick={() => handleAuthClick('register')}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </header>
  );
};

export default Header;
