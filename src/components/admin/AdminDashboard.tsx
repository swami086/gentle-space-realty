import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminStore } from '@/store/adminStore';
import { DashboardStats } from '@/types/admin';
import { 
  Building, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Phone,
  Mail,
  GitBranch,
  FileCode,
  Database,
  Activity,
  Server
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { 
    dashboardStats, 
    setDashboardStats, 
    inquiries, 
    adminProperties, 
    loading, 
    error, 
    refreshAll, 
    isAuthenticated,
    admin 
  } = useAdminStore();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [gkgStatus, setGkgStatus] = useState<{status: string, stats: any} | null>(null);

  // GKG Status Check - Following pattern discovered via GKG analysis
  useEffect(() => {
    const checkGkgStatus = async () => {
      try {
        const response = await fetch('http://localhost:27495/api/info');
        const info = await response.json();
        const statsResponse = await fetch('http://localhost:27495/api/graph/stats/%2FUsers%2Fswaminathan%2FDownloads%2Fgentle_space_realty_i1aw6b/%2FUsers%2Fswaminathan%2FDownloads%2Fgentle_space_realty_i1aw6b');
        const stats = await statsResponse.json();
        setGkgStatus({ 
          status: 'active', 
          stats: {
            version: info.version,
            nodes: stats.total_nodes,
            files: stats.node_counts?.file_count || 0,
            definitions: stats.node_counts?.definition_count || 0
          }
        });
      } catch (error) {
        setGkgStatus({ status: 'inactive', stats: null });
      }
    };
    checkGkgStatus();
  }, []);

  useEffect(() => {
    // Calculate dashboard stats from current data
    const stats: DashboardStats = {
      totalProperties: adminProperties.length,
      activeProperties: adminProperties.filter(p => p.availability?.available).length,
      totalInquiries: inquiries.length,
      newInquiries: inquiries.filter(i => i.status === 'new').length,
      conversionRate: inquiries.length > 0 ? 
        (inquiries.filter(i => i.status === 'converted').length / inquiries.length) * 100 : 0,
      averageResponseTime: inquiries.filter(i => i.responseTime).length > 0 ?
        inquiries.filter(i => i.responseTime).reduce((acc, i) => acc + (i.responseTime || 0), 0) / 
        inquiries.filter(i => i.responseTime).length : 0,
      monthlyInquiries: [12, 19, 15, 27, 22, 18, 25, 31, 28, 35, 42, inquiries.length],
      inquiriesByStatus: {
        new: inquiries.filter(i => i.status === 'new').length,
        contacted: inquiries.filter(i => i.status === 'contacted').length,
        in_progress: inquiries.filter(i => i.status === 'in_progress').length,
        converted: inquiries.filter(i => i.status === 'converted').length,
        closed: inquiries.filter(i => i.status === 'closed').length,
      }
    };
    
    setDashboardStats(stats);
  }, [inquiries, adminProperties, setDashboardStats]);

  if (!dashboardStats) return null;

  const statCards = [
    {
      title: 'Total Properties',
      value: dashboardStats.totalProperties,
      description: `${dashboardStats.activeProperties} active`,
      icon: Building,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Inquiries',
      value: dashboardStats.totalInquiries,
      description: `${dashboardStats.newInquiries} new`,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Conversion Rate',
      value: `${dashboardStats.conversionRate.toFixed(1)}%`,
      description: 'This month',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Avg Response Time',
      value: `${dashboardStats.averageResponseTime.toFixed(1)}h`,
      description: 'Target: <24h',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const recentInquiries = inquiries.slice(0, 5);
  const hasData = adminProperties.length > 0 || inquiries.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your properties.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Repository Insights Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GitBranch className="h-5 w-5 text-indigo-600" />
            <span>Repository Insights</span>
          </CardTitle>
          <CardDescription>Knowledge Graph Analysis (Powered by GKG)</CardDescription>
        </CardHeader>
        <CardContent>
          {gkgStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <FileCode className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-indigo-900">{gkgStatus.stats?.files || '---'}</div>
                <div className="text-sm text-indigo-700">Files Indexed</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Database className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-900">{gkgStatus.stats?.definitions?.toLocaleString() || '---'}</div>
                <div className="text-sm text-purple-700">Definitions</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Activity className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-900">{gkgStatus.stats?.nodes?.toLocaleString() || '---'}</div>
                <div className="text-sm text-green-700">Total Nodes</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Server className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-900">{gkgStatus.stats?.version || '---'}</div>
                <div className="text-sm text-orange-700">GKG Version</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Loading GKG status...</p>
            </div>
          )}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">GKG Server Status:</span>
              <span className={`flex items-center ${gkgStatus?.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                {gkgStatus?.status === 'active' ? <CheckCircle className="h-4 w-4 mr-1" /> : <AlertCircle className="h-4 w-4 mr-1" />}
                {gkgStatus?.status === 'active' ? 'Active' : 'Inactive'} (localhost:27495)
              </span>
            </div>
            {gkgStatus?.status === 'active' && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">Knowledge Graph:</span>
                <span className="text-blue-600">Real-time API data</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inquiries by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Inquiries by Status</CardTitle>
            <CardDescription>Current status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(dashboardStats.inquiriesByStatus).map(([status, count]) => {
                const statusConfig = {
                  new: { label: 'New', color: 'bg-red-500', textColor: 'text-red-700' },
                  contacted: { label: 'Contacted', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
                  in_progress: { label: 'In Progress', color: 'bg-blue-500', textColor: 'text-blue-700' },
                  converted: { label: 'Converted', color: 'bg-green-500', textColor: 'text-green-700' },
                  closed: { label: 'Closed', color: 'bg-gray-500', textColor: 'text-gray-700' },
                };
                
                const config = statusConfig[status as keyof typeof statusConfig];
                const percentage = dashboardStats.totalInquiries > 0 ? 
                  (count / dashboardStats.totalInquiries) * 100 : 0;

                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
                      <span className="text-sm font-medium text-gray-900">{config.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{count}</span>
                      <span className="text-xs text-gray-500">({percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Inquiries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Inquiries</CardTitle>
            <CardDescription>Latest customer inquiries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInquiries.map((inquiry) => (
                <div key={inquiry.id} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {inquiry.name}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        inquiry.status === 'new' ? 'bg-red-100 text-red-800' :
                        inquiry.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                        inquiry.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        inquiry.status === 'converted' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {inquiry.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {inquiry.company && `${inquiry.company} • `}
                      {new Date(inquiry.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 gsr-line-clamp-2">
                      {inquiry.message}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      {inquiry.email && (
                        <a
                          href={`mailto:${inquiry.email}`}
                          className="flex items-center text-xs text-primary-600 hover:text-primary-700"
                        >
                          <Mail size={12} className="mr-1" />
                          Email
                        </a>
                      )}
                      {inquiry.phone && (
                        <a
                          href={`tel:${inquiry.phone}`}
                          className="flex items-center text-xs text-primary-600 hover:text-primary-700"
                        >
                          <Phone size={12} className="mr-1" />
                          Call
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {recentInquiries.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                  <p>No inquiries yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Development Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-6 bg-gray-50 border-dashed">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Debug Info (Development Only)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Properties: {adminProperties.length}</div>
              <div>Inquiries: {inquiries.length}</div>
              <div>Has Data: {hasData ? 'Yes' : 'No'}</div>
              <div>Loading: {loading?.isLoading ? 'Yes' : 'No'}</div>
              <div>Error: {error || renderError || 'None'}</div>
              <div>Admin: {admin?.email || 'None'}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
