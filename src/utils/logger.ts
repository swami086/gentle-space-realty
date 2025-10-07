/**
 * Frontend Logger Utility
 * Simple logging utility for browser environment
 */

import { Environment } from '../config/environment';

export interface Logger {
  info: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  error: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
}

/**
 * Create a logger instance with consistent formatting
 */
export function createLogger(): Logger {
  const isDebug = Environment.isDebugMode();
  const isDevelopment = Environment.isDevelopment();

  const formatMessage = (level: string, message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (meta) {
      return `${prefix} ${message}`;
    }
    return `${prefix} ${message}`;
  };

  return {
    info: (message: string, meta?: any) => {
      if (isDevelopment || isDebug) {
        if (meta) {
          console.info(formatMessage('info', message), meta);
        } else {
          console.info(formatMessage('info', message));
        }
      }
    },

    warn: (message: string, meta?: any) => {
      if (meta) {
        console.warn(formatMessage('warn', message), meta);
      } else {
        console.warn(formatMessage('warn', message));
      }
    },

    error: (message: string, meta?: any) => {
      if (meta) {
        console.error(formatMessage('error', message), meta);
      } else {
        console.error(formatMessage('error', message));
      }
    },

    debug: (message: string, meta?: any) => {
      if (isDebug) {
        if (meta) {
          console.debug(formatMessage('debug', message), meta);
        } else {
          console.debug(formatMessage('debug', message));
        }
      }
    }
  };
}

// Default logger instance
export const logger = createLogger();

// Export default
export default createLogger;