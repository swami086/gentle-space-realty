import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminStore } from '@/store/adminStore';
import { Loader2, Home, Shield, Mail, Lock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';

const AdminLogin: React.FC = () => {
  const [authError, setAuthError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, isAuthenticated, _authOperationInProgress } = useAdminStore();
  const navigate = useNavigate();

  // Clear any existing auth error when component mounts
  useEffect(() => {
    setAuthError(null);
  }, []);
  
  // Handle authentication redirects
  useEffect(() => {
    if (isAuthenticated) {
      console.log('✅ AdminLogin: User authenticated, redirecting to admin dashboard');
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);


  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple simultaneous login attempts
    if (_authOperationInProgress || isLoading) {
      console.warn('⚠️ AdminLogin: Authentication operation already in progress');
      return;
    }
    
    console.log('🔐 AdminLogin: Starting email/password authentication...');
    setAuthError(null);
    
    try {
      const success = await login(email, password);
      
      if (success) {
        console.log('✅ Email/password authentication successful');
        // Navigation will be handled by the authentication effect
      } else {
        console.error('❌ Email/password authentication failed');
        setAuthError('Login failed. Please check your credentials and try again.');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Login failed';
      console.error('❌ Email/password authentication error:', error);
      
      // Simplified error handling
      if (errorMsg.includes('Network')) {
        setAuthError('Network error. Please check your internet connection and try again.');
      } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized') || errorMsg.includes('Invalid credentials')) {
        setAuthError('Invalid credentials. Please check your email and password.');
      } else if (errorMsg.includes('500')) {
        setAuthError('Server error. Please try again later.');
      } else {
        setAuthError('Login failed. Please try again.');
      }
    }
  };


  const handleGoogleSignIn = async () => {
    console.log('🔐 AdminLogin: Google OAuth not yet implemented with Express API...');
    setAuthError('Google sign-in is temporarily unavailable. Please use email/password authentication.');
    
    // TODO: Implement Google OAuth with Express API backend
    // This will require OAuth 2.0 flow implementation on the backend
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Home Button */}
        <div className="flex justify-start mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-600 hover:text-primary-600"
          >
            <Home size={16} />
            <span>Back to Home</span>
          </Button>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Admin Portal
            </CardTitle>
            <CardDescription>
              Secure Express API authentication for admin access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* API Auth Info */}
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Secure Authentication</p>
                <p className="text-xs text-blue-700">Powered by Express API with JWT tokens</p>
              </div>
            </div>

            {/* Error Display */}
            {(error || authError) && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">Authentication Error</p>
                    <p className="text-xs text-red-700 mt-1">{error || authError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Email/Password Login Form */}
            <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@gentlespace.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading || _authOperationInProgress}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading || _authOperationInProgress}
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || _authOperationInProgress}
              >
                {(isLoading || _authOperationInProgress) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Sign In with Email
                  </>
                )}
              </Button>
            </form>


            {/* Default credentials hint for development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-900 mb-2">Development Credentials</p>
                <p className="text-xs text-green-700">
                  Email: admin@gentlespace.com<br />
                  Password: GentleSpace2025!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;