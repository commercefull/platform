import winston, { format } from 'winston';
import 'winston-daily-rotate-file';
import expressWinston from 'express-winston';
import path from 'path';

function stringify(obj: any) {
  let cache: any[] = [];
  let str = JSON.stringify(obj, function (key, value) {
    if (typeof value === 'object' && value !== null) {
      if (cache.indexOf(value) !== -1) {
        // Circular reference found, discard key
        return;
      }
      // Store value in our collection
      cache.push(value);
    }
    return value;
  });
  cache = []; // reset the cache
  return str;
}

// Custom TransformableInfo interface
export interface TransformableInfo {
  level: string;
  message: unknown;
  [key: string | symbol]: unknown;
  timestamp?: string;
  label?: string;
  metadata?: Record<string, unknown>;
  stack?: string;
  error?: Error;
  context?: string;
  traceId?: string;
  spanId?: string;
  service?: string;
  environment?: string;
  hostname?: string;
  pid?: number;
  application?: string;
  version?: string;
  [key: `_${string}`]: unknown; // Allow for custom fields prefixed with underscore
}

// Define log level type for TypeScript
type LogLevel = 'emergency' | 'alert' | 'critical' | 'error' | 'warning' | 'notice' | 'info' | 'debug' | 'http';

const { combine, timestamp, printf, errors } = format;

const logDir = './../logs';
const isDevelopment = process.env.NODE_ENV !== 'production';

// Define log levels similar to Monolog
const levels = {
  error: 0, // Error conditions
  info: 1, // Informational messages
  debug: 2, // Debug-level messages
  http: 3, // HTTP requests
};

// Unified JSON formatter
const jsonFormatter = printf(({ level, message, timestamp, stack, ...meta }: TransformableInfo) => {
  const logEntry: Record<string, any> = {
    timestamp,
    level,
    message,
  };

  // Add context if meta object is not empty
  if (Object.keys(meta).length > 0) {
    logEntry.context = meta;
  }

  // Add stack trace if it exists
  if (stack) {
    logEntry.stack = stack;
  }

  return stringify(logEntry);
});

// Create transports array based on environment
const transports: winston.transport[] = [
  // Console transport for all environments
  new winston.transports.Console({
    level: isDevelopment ? 'debug' : 'error', // Log everything in dev, only error in prod
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), jsonFormatter),
  } as winston.transports.ConsoleTransportOptions),
];

// File transports for production
if (!isDevelopment) {
  // Error logs (error level only)
  transports.push(
    new winston.transports.DailyRotateFile({
      level: 'error', // Only log errors
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d', // Keep logs for 14 days
      format: combine(timestamp(), errors({ stack: true }), jsonFormatter),
    }),
  );
}

// Create the logger with proper type annotations
const logger: winston.Logger & Record<LogLevel, winston.LeveledLogMethod> = winston.createLogger({
  levels,
  level: isDevelopment ? 'debug' : 'error',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), jsonFormatter),
  defaultMeta: { service: 'commercefull' }, // Add service name to all logs
  transports,
  exitOnError: false, // Do not exit on handled exceptions
}) as winston.Logger & Record<LogLevel, winston.LeveledLogMethod>;

// HTTP request logger middleware
const expressHttpLogger = expressWinston.logger({
  winstonInstance: logger,
  level: 'http', // Always log HTTP requests
  meta: false, // Disable meta to reduce verbosity
  msg: '{{res.statusCode}} {{req.method}} {{req.url}} - {{res.responseTime}}ms',
  expressFormat: false, // Disable express format to use our custom format
  colorize: false, // Disable color codes in logs
  ignoreRoute: req => {
    // Ignore health checks, static assets, and other non-essential routes
    return ['/health', '/favicon.ico', '/assets', '/static', '/socket.io'].some(route => req.path.startsWith(route));
  },
  requestWhitelist: [], // Don't log request headers
  responseWhitelist: ['statusCode'], // Only log status code from response
});

const logRequest = (req: any) => {
  logger.info('Request', stringify(req));
};

// Export the logger and httpLogger
export { logger, expressHttpLogger, logRequest };
