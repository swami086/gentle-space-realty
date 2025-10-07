import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  TestTube, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Download
} from 'lucide-react';
import { MockAccountService } from '../../services/mockAccountService';
import { TestAccountHelper } from '../../utils/testAccountHelper';
import {
  MockAccountType,
  MockAccountTestResult,
  MockAccountStats,
  AccountValidationState
} from '../../types/mockAccount';

interface MockAccountManagerProps {
  onAccountCreated?: (result: MockAccountTestResult) => void;
  onAccountsCleaned?: (count: number) => void;
  className?: string;
}

const MockAccountManager: React.FC<MockAccountManagerProps> = ({
  onAccountCreated,
  onAccountsCleaned,
  className = ''
}) => {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stats, setStats] = useState<MockAccountStats | null>(null);
  const [testResults, setTestResults] = useState<MockAccountTestResult[]>([]);
  const [selectedRole, setSelectedRole] = useState<MockAccountType>(MockAccountType.ADMIN);
  const [emailPrefix, setEmailPrefix] = useState('');
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState<any>(null);

  // Load initial stats
  useEffect(() => {
    loadStats();
  }, []);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const showError = (message: string) => {
    setError(message);
    setSuccess(null);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setError(null);
  };

  const loadStats = async () => {
    try {
      const currentStats = await MockAccountService.getMockAccountStats();
      setStats(currentStats);
    } catch (err) {
      console.error('Failed to load stats:', err);
      showError('Failed to load account statistics');
    }
  };

  const handleCreateAccount = async () => {
    clearMessages();
    setIsLoading(true);

    try {
      const result = await MockAccountService.createQuickTestAccount(
        selectedRole,
        emailPrefix || undefined
      );

      if (result.success) {
        const credentialsMsg = result.credentials ? 
          ` Login with: ${result.credentials.email}` : '';
        showSuccess(`Mock ${selectedRole} account created successfully!${credentialsMsg} Check credentials below.`);
        setTestResults(prev => [result, ...prev]);
        onAccountCreated?.(result);
        await loadStats(); // Refresh stats
        setEmailPrefix(''); // Clear prefix
      } else {
        showError(result.message || 'Failed to create mock account');
      }
    } catch (err) {
      console.error('Account creation error:', err);
      showError('Unexpected error during account creation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTestSuite = async () => {
    clearMessages();
    setIsLoading(true);

    try {
      const suiteResults = await TestAccountHelper.createTestSuite();
      
      showSuccess(
        `Test suite created! ${suiteResults.summary.created} accounts created, ` +
        `${suiteResults.summary.adminAccess} with admin access.`
      );

      // Add all results to the list
      const allResults = [suiteResults.admin, suiteResults.superAdmin, suiteResults.user];
      setTestResults(prev => [...allResults, ...prev]);
      
      // Notify about successful creations
      allResults.forEach(result => {
        if (result.success) {
          onAccountCreated?.(result);
        }
      });

      await loadStats(); // Refresh stats
    } catch (err) {
      console.error('Test suite creation error:', err);
      showError('Failed to create test suite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanupAllAccounts = async () => {
    clearMessages();
    setIsLoading(true);

    try {
      const cleanupResult = await MockAccountService.cleanupAllTestAccounts();
      
      if (cleanupResult.success) {
        showSuccess(`Successfully cleaned up ${cleanupResult.deletedAccounts} test accounts`);
        onAccountsCleaned?.(cleanupResult.deletedAccounts);
        setTestResults([]); // Clear local results
        await loadStats(); // Refresh stats
      } else {
        showError(`Cleanup failed: ${cleanupResult.errors.join(', ')}`);
      }
    } catch (err) {
      console.error('Cleanup error:', err);
      showError('Unexpected error during cleanup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunBenchmark = async () => {
    clearMessages();
    setIsRunningTests(true);

    try {
      const benchmark = await TestAccountHelper.benchmarkAccountOperations(3);
      setBenchmarkResults(benchmark);
      showSuccess('Performance benchmark completed!');
    } catch (err) {
      console.error('Benchmark error:', err);
      showError('Failed to run performance benchmark');
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleGenerateReport = async () => {
    clearMessages();
    setIsLoading(true);

    try {
      const report = await TestAccountHelper.generateTestReport();
      
      // Create downloadable report
      const reportData = JSON.stringify(report, null, 2);
      const blob = new Blob([reportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mock-account-report-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess('Test report generated and downloaded!');
    } catch (err) {
      console.error('Report generation error:', err);
      showError('Failed to generate test report');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case MockAccountType.SUPER_ADMIN:
        return 'destructive';
      case MockAccountType.ADMIN:
        return 'default';
      case MockAccountType.USER:
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getValidationIcon = (result: MockAccountTestResult) => {
    if (!result.validationResults) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }

    const { canLogin, canAccessAdmin } = result.validationResults;
    
    if (canLogin && canAccessAdmin) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (canLogin) {
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mock Account Manager</h2>
          <p className="text-gray-600">Create and manage test accounts for development and testing</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Overview */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Account Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalAccounts}</div>
                <div className="text-sm text-gray-600">Total Accounts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.accountsByRole[MockAccountType.ADMIN]}</div>
                <div className="text-sm text-gray-600">Admins</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.accountsByRole[MockAccountType.SUPER_ADMIN]}</div>
                <div className="text-sm text-gray-600">Super Admins</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.accountsByRole[MockAccountType.USER]}</div>
                <div className="text-sm text-gray-600">Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Create Mock Account
          </CardTitle>
          <CardDescription>
            Create individual test accounts or complete test suites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as MockAccountType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value={MockAccountType.ADMIN}>Admin</option>
                <option value={MockAccountType.SUPER_ADMIN}>Super Admin</option>
                <option value={MockAccountType.USER}>User</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Prefix (Optional)
              </label>
              <input
                type="text"
                value={emailPrefix}
                onChange={(e) => setEmailPrefix(e.target.value)}
                placeholder="e.g., qa-test"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleCreateAccount}
              disabled={isLoading}
              className="flex items-center"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Single Account
            </Button>
            
            <Button
              onClick={handleCreateTestSuite}
              disabled={isLoading}
              variant="outline"
              className="flex items-center"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              Create Test Suite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TestTube className="h-5 w-5 mr-2" />
            Test Operations
          </CardTitle>
          <CardDescription>
            Run performance benchmarks and generate reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleRunBenchmark}
              disabled={isRunningTests}
              variant="outline"
              className="flex items-center"
            >
              {isRunningTests ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4 mr-2" />
              )}
              Run Benchmark
            </Button>
            
            <Button
              onClick={handleGenerateReport}
              disabled={isLoading}
              variant="outline"
              className="flex items-center"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Generate Report
            </Button>
            
            <Button
              onClick={handleCleanupAllAccounts}
              disabled={isLoading}
              variant="destructive"
              className="flex items-center"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Cleanup All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Benchmark Results */}
      {benchmarkResults && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Benchmark Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-700">
                  {benchmarkResults.creation.average.toFixed(0)}ms
                </div>
                <div className="text-sm text-blue-600">Account Creation</div>
                <div className="text-xs text-gray-500">
                  {benchmarkResults.creation.min}-{benchmarkResults.creation.max}ms
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-700">
                  {benchmarkResults.cleanup.average.toFixed(0)}ms
                </div>
                <div className="text-sm text-green-600">Account Cleanup</div>
                <div className="text-xs text-gray-500">
                  {benchmarkResults.cleanup.min}-{benchmarkResults.cleanup.max}ms
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-lg font-semibold text-purple-700">
                  {benchmarkResults.overall.average.toFixed(0)}ms
                </div>
                <div className="text-sm text-purple-600">Overall Average</div>
                <div className="text-xs text-gray-500">
                  Total: {benchmarkResults.overall.total}ms
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Test Results</CardTitle>
            <CardDescription>
              Recently created mock accounts and their validation status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testResults.slice(0, 10).map((result, index) => (
                <div
                  key={`${result.accountId || 'unknown'}-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getValidationIcon(result)}
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {result.profile ? `${result.profile.name} (${result.profile.role})` : 
                         result.accountId ? `Account: ${result.accountId.substring(0, 8)}...` : 'Account Creation'}
                      </div>
                      <div className="text-xs text-gray-600">{result.message}</div>
                      {/* Display login credentials for successful accounts */}
                      {result.success && result.credentials && (
                        <div className="mt-1 p-2 bg-blue-50 rounded border border-blue-200">
                          <div className="text-xs font-medium text-blue-800 mb-1">🔑 Login Credentials:</div>
                          <div className="text-xs text-blue-700">
                            <div className="flex items-center">
                              <span className="font-medium">Email:</span>
                              <code className="ml-1 px-1 bg-blue-100 rounded text-blue-900 select-all">
                                {result.credentials.email}
                              </code>
                            </div>
                            <div className="flex items-center mt-1">
                              <span className="font-medium">Password:</span>
                              <code className="ml-1 px-1 bg-blue-100 rounded text-blue-900 select-all">
                                {result.credentials.password}
                              </code>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {result.validationResults && (
                      <>
                        {result.validationResults.canLogin && (
                          <Badge variant="secondary" className="text-xs">Login ✓</Badge>
                        )}
                        {result.validationResults.canAccessAdmin && (
                          <Badge variant="default" className="text-xs">Admin ✓</Badge>
                        )}
                      </>
                    )}
                    <Badge 
                      variant={result.success ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {result.success ? "Success" : "Failed"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MockAccountManager;