import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Beaker, 
  Activity, 
  Zap, 
  Database, 
  Code2, 
  Cpu, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Lightbulb,
  FileCode,
  GitBranch
} from 'lucide-react';

const SamplePage: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<string>('overview');
  const [isRunning, setIsRunning] = useState(false);
  
  const demos = [
    {
      id: 'overview',
      name: 'Overview',
      icon: Info,
      description: 'Sample page demonstrating admin functionality',
    },
    {
      id: 'data-visualization',
      name: 'Data Visualization',
      icon: Activity,
      description: 'Charts and graphs demo',
    },
    {
      id: 'performance',
      name: 'Performance Metrics',
      icon: Zap,
      description: 'System performance indicators',
    },
    {
      id: 'database',
      name: 'Database Operations',
      icon: Database,
      description: 'Database connectivity and operations',
    },
    {
      id: 'api-testing',
      name: 'API Testing',
      icon: Code2,
      description: 'Test API endpoints and responses',
    },
    {
      id: 'system-health',
      name: 'System Health',
      icon: Cpu,
      description: 'Monitor system resources and health',
    },
  ];

  const sampleMetrics = {
    totalRequests: 12847,
    successRate: 98.7,
    averageResponseTime: 145,
    activeUsers: 234,
    systemLoad: 23,
    memoryUsage: 67,
  };

  const handleRunDemo = async () => {
    setIsRunning(true);
    // Simulate API call or processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRunning(false);
  };

  const renderDemoContent = () => {
    switch (activeDemo) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Lightbulb className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Welcome to the Sample Page</h3>
                  <p className="text-blue-800 mb-4">
                    This is a demonstration page showcasing various admin portal capabilities. 
                    It serves as a template for adding new functionality to your admin system.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-200 text-blue-800 text-sm rounded-full">Demo Content</span>
                    <span className="px-3 py-1 bg-green-200 text-green-800 text-sm rounded-full">Interactive</span>
                    <span className="px-3 py-1 bg-purple-200 text-purple-800 text-sm rounded-full">Responsive</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(sampleMetrics).map(([key, value]) => {
                const config = {
                  totalRequests: { label: 'Total Requests', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
                  successRate: { label: 'Success Rate', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', suffix: '%' },
                  averageResponseTime: { label: 'Avg Response Time', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-100', suffix: 'ms' },
                  activeUsers: { label: 'Active Users', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100' },
                  systemLoad: { label: 'System Load', icon: Cpu, color: 'text-orange-600', bg: 'bg-orange-100', suffix: '%' },
                  memoryUsage: { label: 'Memory Usage', icon: Database, color: 'text-indigo-600', bg: 'bg-indigo-100', suffix: '%' },
                };

                const item = config[key as keyof typeof config];
                return (
                  <Card key={key} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">{item.label}</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {typeof value === 'number' ? value.toLocaleString() : value}
                            {item.suffix || ''}
                          </p>
                        </div>
                        <div className={`p-3 rounded-full ${item.bg}`}>
                          <item.icon className={`h-5 w-5 ${item.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 'data-visualization':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Sample Data Visualization</span>
                </CardTitle>
                <CardDescription>Interactive charts and graphs would go here</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Chart Placeholder</p>
                    <p className="text-sm">Integration with chart library would render here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'performance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    <span>Performance Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: 'CPU Usage', value: 23, color: 'bg-green-500' },
                    { label: 'Memory Usage', value: 67, color: 'bg-yellow-500' },
                    { label: 'Disk I/O', value: 12, color: 'bg-blue-500' },
                    { label: 'Network', value: 89, color: 'bg-red-500' },
                  ].map((metric) => (
                    <div key={metric.label} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700">{metric.label}</span>
                        <span className="text-gray-600">{metric.value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${metric.color}`}
                          style={{ width: `${metric.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Cpu className="h-5 w-5 text-blue-600" />
                    <span>System Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { service: 'Web Server', status: 'running', icon: CheckCircle, color: 'text-green-600' },
                    { service: 'Database', status: 'running', icon: CheckCircle, color: 'text-green-600' },
                    { service: 'Cache Server', status: 'warning', icon: AlertTriangle, color: 'text-yellow-600' },
                    { service: 'API Gateway', status: 'running', icon: CheckCircle, color: 'text-green-600' },
                  ].map((service) => (
                    <div key={service.service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{service.service}</span>
                      <div className="flex items-center space-x-2">
                        <service.icon className={`h-4 w-4 ${service.color}`} />
                        <span className={`text-sm capitalize ${service.color}`}>{service.status}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return (
          <Card>
            <CardContent className="p-12 text-center">
              <Beaker className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Demo Coming Soon</h3>
              <p className="text-gray-600">This demo section is under development.</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sample Page</h1>
          <p className="text-gray-600 mt-2">Demonstration of admin portal capabilities and components.</p>
        </div>
        <Button 
          onClick={handleRunDemo} 
          disabled={isRunning}
          className="flex items-center space-x-2"
        >
          <Beaker className={`h-4 w-4 ${isRunning ? 'animate-pulse' : ''}`} />
          <span>{isRunning ? 'Running...' : 'Run Demo'}</span>
        </Button>
      </div>

      {/* Demo Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileCode className="h-5 w-5" />
            <span>Demo Sections</span>
          </CardTitle>
          <CardDescription>Select a demo to explore different features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {demos.map((demo) => (
              <button
                key={demo.id}
                onClick={() => setActiveDemo(demo.id)}
                className={`p-4 rounded-lg text-left transition-colors ${
                  activeDemo === demo.id
                    ? 'bg-primary-100 border-2 border-primary-300 text-primary-800'
                    : 'bg-gray-50 border-2 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <demo.icon className={`h-6 w-6 mb-2 ${
                  activeDemo === demo.id ? 'text-primary-600' : 'text-gray-600'
                }`} />
                <h4 className="font-medium text-sm mb-1">{demo.name}</h4>
                <p className="text-xs opacity-80 line-clamp-2">{demo.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Content */}
      {renderDemoContent()}

      {/* Development Info */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-dashed border-gray-300 bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-600">
              <GitBranch className="h-4 w-4" />
              <span className="text-sm">Development Info</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Active Demo: {activeDemo}</div>
              <div>Demo Running: {isRunning ? 'Yes' : 'No'}</div>
              <div>Component: SamplePage.tsx</div>
              <div>Route: /admin/sample</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SamplePage;