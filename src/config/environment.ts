import { z } from 'zod';

/**
 * Environment variable schema validation
 */
const environmentSchema = z.object({
    // Required Sonarr configuration
    SONARR_API_URL: z.string().url('Invalid Sonarr API URL'),
    SONARR_API_KEY: z.string().min(1, 'Sonarr API key is required'),

    // Optional Sonarr configuration
    SONARR_TIMEOUT: z.coerce.number().min(1).max(300).default(30),
    SONARR_MAX_RETRIES: z.coerce.number().min(0).max(10).default(3),
    SONARR_VERIFY_SSL: z.coerce.boolean().default(true),

    // MCP Server configuration
    MCP_LOG_LEVEL: z.enum(['ERROR', 'WARN', 'INFO', 'DEBUG']).default('INFO'),
    MCP_SERVER_NAME: z.string().default('sonarr-server'),
    MCP_SERVER_VERSION: z.string().default('1.0.0'),

    // Feature flags
    ENABLE_FILE_OPERATIONS: z.coerce.boolean().default(false),
    ENABLE_SYSTEM_COMMANDS: z.coerce.boolean().default(true),
    MAX_CONCURRENT_REQUESTS: z.coerce.number().min(1).max(100).default(10),
});

export type Environment = z.infer<typeof environmentSchema>;

/**
 * Validate environment variables
 */
export function validateEnvironment(): Environment {
    try {
        return environmentSchema.parse(process.env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const issues = error.issues.map(issue =>
                `${issue.path.join('.')}: ${issue.message}`
            ).join('\n');

            throw new Error(`Environment validation failed:\n${issues}`);
        }
        throw error;
    }
}

/**
 * Get parsed and validated environment
 */
export const env = validateEnvironment();