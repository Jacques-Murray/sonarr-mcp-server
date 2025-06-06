#!/usr/bin/env node

/**
 * Sonarr MCP Server Implementation
 *
 * This implements the full Model Context Protocol server for Sonarr,
 * providing tools and resources for AI assistants to interact with Sonarr.
 */

declare const process: {
    argv: string[];
    exit: (code?: number) => never;
    on: (event: string, listener: (...args: any[]) => void) => void;
};

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    McpError,
    ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { logger } from './config/logger';
import { config } from './config/config';
import { validateEnvironment } from './config/environment';
import { SonarrApiClient } from './api/sonarr-client';
import { initializeTools, getAllTools, executeTool } from './tools/index';
import { initializeResources, getAllResources, readResource } from './resources/index';

/**
 * Main Sonarr MCP Server class
 */
export class SonarrMCPServer {
    private server: Server;
    private sonarrClient: SonarrApiClient;

    constructor() {
        this.server = new Server(
            {
                name: config.mcp.name,
                version: config.mcp.version,
            },
            {
                capabilities: {
                    tools: {},
                    resources: {},
                },
            }
        );

        this.sonarrClient = new SonarrApiClient(config.sonarr);
        this.setupHandlers();
    }

    /**
     * Set up MCP protocol handlers
     */
    private setupHandlers(): void {
        // Tools handler
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            const tools = getAllTools();
            return {
                tools: tools.map(tool => ({
                    name: tool.name,
                    description: tool.description,
                    inputSchema: tool.inputSchema,
                })),
            };
        });

        // Tool execution handler
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                logger.info(`Executing tool: ${name}`, { args });
                const result = await executeTool(name, args);
                logger.info(`Tool execution completed: ${name}`);
                return {
                    content: result.content,
                    isError: result.isError
                };
            } catch (error) {
                logger.error(`Tool execution failed: ${name}`, error);

                if (error instanceof McpError) {
                    throw error;
                }

                throw new McpError(
                    ErrorCode.InternalError,
                    `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        });

        // Resources handler
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
            const resources = getAllResources();
            return {
                resources: resources.map(resource => ({
                    uri: resource.uri,
                    name: resource.name,
                    description: resource.description,
                    mimeType: resource.mimeType,
                })),
            };
        });

        // Resource reading handler
        this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const { uri } = request.params;

            try {
                logger.info(`Reading resource: ${uri}`);
                const result = await readResource(uri);
                logger.info(`Resource read completed: ${uri}`);
                return {
                    contents: result.contents
                };
            } catch (error) {
                logger.error(`Resource read failed: ${uri}`, error);

                if (error instanceof McpError) {
                    throw error;
                }

                throw new McpError(
                    ErrorCode.InternalError,
                    `Resource read failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        });
    }

    /**
     * Initialize the MCP server
     */
    async initialize(): Promise<void> {
        try {
            logger.info('='.repeat(60));
            logger.info('Sonarr MCP Server Initialization');
            logger.info('='.repeat(60));

            // Validate environment
            logger.info('Validating environment configuration...');
            validateEnvironment();
            logger.info('✓ Environment validation passed');

            // Test Sonarr connection
            logger.info('Testing Sonarr connection...');
            await this.sonarrClient.testConnection();
            logger.info('✓ Sonarr connection successful');

            // Initialize tools and resources
            logger.info('Initializing MCP tools and resources...');
            await initializeTools(this.sonarrClient);
            await initializeResources(this.sonarrClient);
            logger.info('✓ MCP components initialized');

            // Log configuration summary
            logger.info('Configuration Summary:');
            logger.info(`- Server Name: ${config.mcp.name}`);
            logger.info(`- Version: ${config.mcp.version}`);
            logger.info(`- Log Level: ${config.mcp.logLevel}`);
            logger.info(`- Sonarr URL: ${config.sonarr.url}`);
            logger.info(`- Tools: ${getAllTools().length}`);
            logger.info(`- Resources: ${getAllResources().length}`);

            logger.info('='.repeat(60));
            logger.info('✓ Sonarr MCP Server ready for connections');
            logger.info('='.repeat(60));

        } catch (error) {
            logger.error('MCP Server initialization failed:', error);
            throw error;
        }
    }

    /**
     * Start the MCP server
     */
    async start(): Promise<void> {
        const transport = new StdioServerTransport();

        logger.info('Starting Sonarr MCP Server...');

        await this.server.connect(transport);

        // Keep the process alive
        process.on('SIGINT', async () => {
            logger.info('Received SIGINT, shutting down gracefully...');
            await this.server.close();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            logger.info('Received SIGTERM, shutting down gracefully...');
            await this.server.close();
            process.exit(0);
        });
    }

    /**
     * Run the complete server initialization and startup
     */
    async run(): Promise<void> {
        try {
            await this.initialize();
            await this.start();
        } catch (error) {
            logger.error('Failed to start Sonarr MCP Server:', error);
            process.exit(1);
        }
    }
}

/**
 * Main entry point when run as standalone script
 */
async function main(): Promise<void> {
    const server = new SonarrMCPServer();
    await server.run();
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
    main().catch((error) => {
        logger.error('Fatal error:', error);
        process.exit(1);
    });
}