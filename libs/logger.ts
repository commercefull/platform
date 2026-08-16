import type { Request, Response } from 'express';
import winston, { format } from 'winston';
import 'winston-daily-rotate-file';
import expressWinston from 'express-winston';
import path from 'path';

interface ExtendedResponse extends Response {
  responseTime?: number;
}

function stringify(obj: unknown) {
  let cache: unknown[] = [];
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
type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'http';

const { combine, timestamp, printf, errors } = format;

const logDir = './logs';
const isDevelopment = process.env.NODE_ENV !== 'production';

// Define log levels similar to Monolog
const levels = {
  error: 0, // Error conditions
  warning: 1, // Warning conditions
  info: 2, // Informational messages
  debug: 3, // Debug-level messages
  http: 4, // HTTP requests
};

// Unified JSON formatter
const jsonFormatter = printf(({ level, message, timestamp, stack, ...meta }: TransformableInfo) => {
  const logEntry: Record<string, unknown> = {
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
    level: process.env.LOG_LEVEL || 'error', // Configurable dev level, warning default
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), jsonFormatter),
  } as winston.transports.ConsoleTransportOptions),
];

// Error file transport — always enabled (dev + prod) so errors are traceable
transports.push(
  new winston.transports.DailyRotateFile({
    level: 'error',
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: combine(timestamp(), errors({ stack: true }), jsonFormatter),
  }),
);

// Additional info-level file transport in production only
if (!isDevelopment) {
  transports.push(
    new winston.transports.DailyRotateFile({
      level: process.env.LOG_LEVEL || 'error',
      filename: path.join(logDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: combine(timestamp(), errors({ stack: true }), jsonFormatter),
    }),
  );
}

// Create the logger with proper type annotations
const logger: winston.Logger & Record<LogLevel, winston.LeveledLogMethod> = winston.createLogger({
  levels,
  level: process.env.LOG_LEVEL || 'error',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), jsonFormatter),
  defaultMeta: { service: 'clinic-organize' }, // Add service name to all logs
  transports,
  exitOnError: false, // Do not exit on handled exceptions
}) as winston.Logger & Record<LogLevel, winston.LeveledLogMethod>;

// Dedicated logger for HTTP access logs — always prints regardless of LOG_LEVEL.
const httpAccessLogger = winston.createLogger({
  levels,
  level: 'http', // Accept all levels up to http
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), jsonFormatter),
  defaultMeta: { service: 'clinic-organize' },
  transports: [
    new winston.transports.Console({
      level: 'http',
      format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), jsonFormatter),
    } as winston.transports.ConsoleTransportOptions),
  ],
});

// HTTP request logger middleware
const expressHttpLogger = expressWinston.logger({
  winstonInstance: httpAccessLogger,
  meta: false, // Disable meta to reduce verbosity
  msg: (req, res) => {
    const isAjax =
      req.headers['x-requested-with'] === 'XMLHttpRequest' ||
      req.path.startsWith('/api/') ||
      req.headers.accept?.includes('application/json');
    const requestType = isAjax ? '[AJAX]' : '[PAGE]';
    return `| ${res.statusCode} | ${requestType} ${req.method} ${req.url} ${(res as ExtendedResponse).responseTime}ms`;
  },
  expressFormat: false, // Disable express format to use our custom format
  colorize: false, // Disable color codes in logs
  ignoreRoute: req => {
    // Ignore health checks, static assets, and other non-essential routes
    return ['/health', '/favicon.ico', '/assets', '/static', '/socket.io'].some(route => req.path.startsWith(route));
  },
  requestWhitelist: [], // Don't log request headers
  responseWhitelist: ['statusCode'], // Only log status code from response
});

const logRequest = (req: Request) => {
  logger.info('Request', stringify(req));
};

// Export the logger and httpLogger
export { logger, expressHttpLogger, logRequest };