import React from 'react';
import * as Sentry from '@sentry/react';

const SentryTestPanel: React.FC = () => {
  const testSentryMessage = () => {
    Sentry.captureMessage('🧪 Manual test message from UI button', 'info');
    console.log('📤 Manual Sentry message sent');
  };

  const testSentryError = () => {
    try {
      throw new Error('🧪 Manual test error from UI - this is intentional');
    } catch (error) {
      Sentry.captureException(error, {
        tags: { test: 'manual', source: 'ui-button' },
        extra: { 
          triggeredBy: 'user-action',
          timestamp: new Date().toISOString() 
        }
      });
      console.log('📤 Manual Sentry error sent');
    }
  };

  const testSentryPerformance = () => {
    const transaction = Sentry.startTransaction({
      name: 'manual-performance-test',
      op: 'user-action'
    });

    // Simulate some work
    setTimeout(() => {
      transaction.finish();
      console.log('📊 Manual performance transaction completed');
    }, 200);

    Sentry.captureMessage('🧪 Manual performance test completed', 'info');
  };

  // Only show in development
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '12px',
      zIndex: 9999,
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#6c757d' }}>
        🧪 Sentry Test Panel
      </div>
      <div style={{ marginBottom: '8px', fontSize: '10px', color: '#28a745' }}>
        ✅ Full UI Tracking Active
      </div>
      <button 
        onClick={testSentryMessage}
        style={{
          margin: '2px',
          padding: '4px 8px',
          fontSize: '10px',
          border: '1px solid #007bff',
          background: '#007bff',
          color: 'white',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        📤 Test Message
      </button>
      <button 
        onClick={testSentryError}
        style={{
          margin: '2px',
          padding: '4px 8px',
          fontSize: '10px',
          border: '1px solid #dc3545',
          background: '#dc3545',
          color: 'white',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        💥 Test Error
      </button>
      <button 
        onClick={testSentryPerformance}
        style={{
          margin: '2px',
          padding: '4px 8px',
          fontSize: '10px',
          border: '1px solid #28a745',
          background: '#28a745',
          color: 'white',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        📊 Test Performance
      </button>
    </div>
  );
};

export default SentryTestPanel;