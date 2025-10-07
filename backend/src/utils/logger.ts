/**
 * Logger Utility
 * Winston-based logging configuration for backend
 */

import winston from 'winston';

/**
 * Create logger instance with configuration
 */
export const createLogger = (level: string = 'info') => {
  return winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: 'gentle-space-realty-api' },
    transports: [
      // Write all logs with importance level of 'error' or less to error.log
      new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      // Write all logs with importance level of 'info' or less to combined.log
      new winston.transports.File({ 
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      // Console output for development
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  });
};