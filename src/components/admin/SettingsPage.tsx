import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import GoogleCloudStatus from './GoogleCloudStatus';
import { Settings, Database, Cloud, Shield } from 'lucide-react';

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Settings className="h-8 w-8 text-gray-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage system settings and integrations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Cloud Integration */}
        <GoogleCloudStatus />

        {/* Database Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-green-600" />
              <CardTitle>Database (Supabase)</CardTitle>
            </div>
            <CardDescription>
              Property and inquiry database status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connection Status</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Storage</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Authentication</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Enabled
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>
              Security and authentication settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Admin Authentication</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">RLS Policies</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Enabled
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">HTTPS</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Enforced
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Cloud className="w-5 h-5 text-purple-600" />
              <CardTitle>Integrations</CardTitle>
            </div>
            <CardDescription>
              External service integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">WhatsApp Integration</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email Notifications</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Configured
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Error Monitoring</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Sentry Active
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;