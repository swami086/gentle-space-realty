import React from 'react';

interface InitializationScreenProps {
  error: string;
  onRetry?: () => void;
}

export const InitializationScreen: React.FC<InitializationScreenProps> = ({ error, onRetry }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Configuration Required
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          The application needs to be configured before it can start
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Environment Configuration Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <pre className="whitespace-pre-wrap font-mono text-xs bg-red-100 p-2 rounded mt-2">
                      {error}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Setup Instructions
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Copy <code className="bg-blue-100 px-1 rounded">config/frontend.env.example</code> to <code className="bg-blue-100 px-1 rounded">.env.local</code></li>
                      <li>Replace all placeholder values with your actual configuration</li>
                      <li>Ensure all required variables are set</li>
                      <li>Restart the development server</li>
                    </ol>
                    <div className="mt-3">
                      <a 
                        href="/docs/ENVIRONMENT_SETUP.md" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-500 underline"
                      >
                        📖 View detailed setup guide
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {onRetry && (
              <div className="flex justify-center">
                <button
                  onClick={onRetry}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                >
                  🔄 Retry Configuration
                </button>
              </div>
            )}

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Application will automatically restart once properly configured
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};