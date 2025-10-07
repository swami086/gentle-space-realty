import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import * as Sentry from '@sentry/react';

const SentryRouteTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Track route changes with detailed context
    const transaction = Sentry.startTransaction({
      name: `Route: ${location.pathname}`,
      op: 'navigation.route'
    });

    Sentry.addBreadcrumb({
      message: `Route Change: ${location.pathname}`,
      category: 'navigation.route',
      level: 'info',
      data: {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
        state: location.state ? 'has-state' : 'no-state',
        timestamp: new Date().toISOString()
      }
    });

    // Set route context for future events
    Sentry.setContext('route', {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      timestamp: new Date().toISOString()
    });

    // Capture route view
    Sentry.captureMessage(`Route View: ${location.pathname}${location.search}`, 'info');

    console.log(`📍 Sentry tracking route: ${location.pathname}`);

    // Finish transaction after component rendering
    setTimeout(() => {
      transaction.finish();
    }, 100);

  }, [location]);

  return null; // This component doesn't render anything
};

export default SentryRouteTracker;