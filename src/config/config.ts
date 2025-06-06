import { env } from './environment.js';

/**
 * Sonarr client configuration
 */
export interface SonarrConfig {
    url: string;
    apiKey: string;
    timeout: number;
    maxRetries: number;
    verifySsl: boolean;
}

/**
 * MCP server configuration
 */
export interface McpConfig {
    name: string;
    version: string;
    logLevel: string;
}

/**
 * Feature flags configuration
 */
export interface FeatureConfig {
    enableFileOperations: boolean;
    enableSystemCommands: boolean;
    maxConcurrentRequests: number;
}

/**
 * Application configuration
 */
export interface AppConfig {
    sonarr: SonarrConfig;
    mcp: McpConfig;
    features: FeatureConfig;
}

/**
 * Build configuration from environment variables
 */
export const config: AppConfig = {
    sonarr: {
        url: env.SONARR_API_URL,
        apiKey: env.SONARR_API_KEY,
        timeout: env.SONARR_TIMEOUT,
        maxRetries: env.SONARR_MAX_RETRIES,
        verifySsl: env.SONARR_VERIFY_SSL,
    },
    mcp: {
        name: env.MCP_SERVER_NAME,
        version: env.MCP_SERVER_VERSION,
        logLevel: env.MCP_LOG_LEVEL,
    },
    features: {
        enableFileOperations: env.ENABLE_FILE_OPERATIONS,
        enableSystemCommands: env.ENABLE_SYSTEM_COMMANDS,
        maxConcurrentRequests: env.MAX_CONCURRENT_REQUESTS,
    },
};