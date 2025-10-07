import { useEffect, useState, useRef } from 'react';
import * as Sentry from '@sentry/react';

interface InitializationService {
  name: string;
  status: 'pending' | 'success' | 'error' | 'timeout';
  startTime: number;
  endTime?: number;
  error?: Error;
  isCritical: boolean;
}

interface InitializationState {
  services: InitializationService[];
  overallStatus: 'initializing' | 'success' | 'partial' | 'failed';
  startTime: number;
  endTime?: number;
}

/**
 * Hook to monitor initialization status of various app services
 * and provide debugging information for blank screen issues
 */
export const useInitializationMonitor = () => {
  const [initState, setInitState] = useState<InitializationState>({
    services: [],
    overallStatus: 'initializing',
    startTime: Date.now(),
  });

  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const DEFAULT_TIMEOUT = 10000; // 10 seconds

  // Register a service for monitoring
  const registerService = (
    serviceName: string, 
    isCritical: boolean = false, 
    timeout: number = DEFAULT_TIMEOUT
  ) => {
    console.log(`📋 InitializationMonitor: Registering service ${serviceName}`);
    
    const service: InitializationService = {
      name: serviceName,
      status: 'pending',
      startTime: Date.now(),
      isCritical,
    };

    setInitState(prev => ({
      ...prev,
      services: [...prev.services.filter(s => s.name !== serviceName), service],
    }));

    // Set timeout for service
    const timeoutId = setTimeout(() => {
      console.warn(`⏰ InitializationMonitor: Service ${serviceName} timed out`);
      markServiceComplete(serviceName, 'timeout');
    }, timeout);

    timeoutRefs.current.set(serviceName, timeoutId);

    return serviceName;
  };

  // Mark a service as complete (success or error)
  const markServiceComplete = (
    serviceName: string, 
    status: 'success' | 'error' | 'timeout',
    error?: Error
  ) => {
    console.log(`✅ InitializationMonitor: Service ${serviceName} completed with status: ${status}`);
    
    // Clear timeout
    const timeoutId = timeoutRefs.current.get(serviceName);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(serviceName);
    }

    setInitState(prev => {
      const updatedServices = prev.services.map(service => 
        service.name === serviceName 
          ? {
              ...service,
              status,
              endTime: Date.now(),
              error,
            }
          : service
      );

      // Determine overall status
      const criticalServices = updatedServices.filter(s => s.isCritical);
      const allServices = updatedServices;
      
      let overallStatus: InitializationState['overallStatus'] = 'success';
      
      // Check if any critical services failed
      const criticalFailures = criticalServices.filter(s => s.status === 'error' || s.status === 'timeout');
      if (criticalFailures.length > 0) {
        overallStatus = 'failed';
      } else if (allServices.some(s => s.status === 'error' || s.status === 'timeout')) {
        overallStatus = 'partial';
      } else if (allServices.every(s => s.status === 'success')) {
        overallStatus = 'success';
      } else {
        overallStatus = 'initializing';
      }

      const newState = {
        ...prev,
        services: updatedServices,
        overallStatus,
        endTime: overallStatus !== 'initializing' ? Date.now() : prev.endTime,
      };

      // Log status change
      if (overallStatus !== prev.overallStatus) {
        console.log(`📊 InitializationMonitor: Overall status changed to ${overallStatus}`);
        logInitializationSummary(newState);
      }

      return newState;
    });
  };

  // Log detailed initialization summary
  const logInitializationSummary = (state: InitializationState) => {
    const totalTime = (state.endTime || Date.now()) - state.startTime;
    
    console.group('📊 Initialization Summary');
    console.log(`Overall Status: ${state.overallStatus}`);
    console.log(`Total Time: ${totalTime}ms`);
    
    state.services.forEach(service => {
      const serviceTime = (service.endTime || Date.now()) - service.startTime;
      console.log(`${service.name}: ${service.status} (${serviceTime}ms) ${service.isCritical ? '[CRITICAL]' : ''}`);
      if (service.error) {
        console.error(`  Error: ${service.error.message}`);
      }
    });
    
    console.groupEnd();

    // Report to Sentry if there are issues
    if (state.overallStatus === 'failed' || state.overallStatus === 'partial') {
      Sentry.withScope(scope => {
        scope.setTag('initialization_monitor', true);
        scope.setTag('overall_status', state.overallStatus);
        scope.setContext('initialization_details', {
          totalTime,
          services: state.services.map(s => ({
            name: s.name,
            status: s.status,
            duration: (s.endTime || Date.now()) - s.startTime,
            isCritical: s.isCritical,
            error: s.error?.message,
          })),
        });

        const failedServices = state.services.filter(s => s.status === 'error' || s.status === 'timeout');
        if (failedServices.length > 0) {
          scope.setLevel(state.overallStatus === 'failed' ? 'error' : 'warning');
          Sentry.captureMessage(
            `Initialization ${state.overallStatus}: ${failedServices.map(s => s.name).join(', ')} failed`,
          );
        }
      });
    }
  };

  // Get current initialization progress
  const getProgress = () => {
    const totalServices = initState.services.length;
    const completedServices = initState.services.filter(s => s.status !== 'pending').length;
    
    return {
      progress: totalServices > 0 ? (completedServices / totalServices) * 100 : 0,
      completed: completedServices,
      total: totalServices,
      status: initState.overallStatus,
    };
  };

  // Check if initialization is taking too long
  const isInitializationStuck = () => {
    const currentTime = Date.now();
    const totalTime = currentTime - initState.startTime;
    const STUCK_THRESHOLD = 15000; // 15 seconds
    
    return totalTime > STUCK_THRESHOLD && initState.overallStatus === 'initializing';
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  // Monitor for stuck initialization
  useEffect(() => {
    if (isInitializationStuck()) {
      console.warn('⚠️ InitializationMonitor: Initialization appears to be stuck');
      
      Sentry.withScope(scope => {
        scope.setTag('initialization_stuck', true);
        scope.setContext('stuck_details', {
          totalTime: Date.now() - initState.startTime,
          pendingServices: initState.services.filter(s => s.status === 'pending').map(s => s.name),
        });
        scope.setLevel('warning');
        Sentry.captureMessage('Initialization stuck - potential blank screen issue');
      });
    }
  }, [initState, initState.startTime]);

  return {
    initState,
    registerService,
    markServiceComplete,
    getProgress,
    isInitializationStuck: isInitializationStuck(),
    logSummary: () => logInitializationSummary(initState),
  };
};

export default useInitializationMonitor;