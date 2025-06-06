import winston from 'winston';
import { env } from './environment';

/**
 * Logger configuration
 */
const logLevel = env.MCP_LOG_LEVEL.toLowerCase();

/**
 * Custom log format
 */
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, stack }) => {
        if (stack) {
            return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
        }
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
);

/**
 * Create Winston logger instance
 */
export const logger = winston.createLogger({
    level: logLevel,
    format: logFormat,
    transports: [
        // Console transport for development
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            )
        }),

        // File transport for errors
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 3,
        }),

        // File transport for all logs
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    ],

    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log' })
    ],

    // Handle unhandled promise rejections
    rejectionHandlers: [
        new winston.transports.File({ filename: 'logs/rejections.log' })
    ]
});

/**
 * Add request correlation ID to logs
 */
export function createChildLogger(correlationId: string) {
    return logger.child({ correlationId });
}

/**
 * Log levels for reference:
 * - error: 0
 * - warn: 1  
 * - info: 2
 * - http: 3
 * - verbose: 4
 * - debug: 5
 * - silly: 6
 */