#!/usr/bin/env node

/**
 * Sonarr MCP Server - Main Entry Point
 *
 * This is the main entry point for the Sonarr MCP Server.
 * It can run in two modes:
 * 1. MCP Server mode (default) - Full MCP protocol server
 * 2. Test mode - Basic connectivity and setup testing
 */

declare const process: {
    argv: string[];
    exit: (code?: number) => never;
};

declare const console: {
    error: (...args: any[]) => void;
};

import dotenv from 'dotenv';
import { SonarrMCPServer } from './mcp-server';

// Load environment variables
dotenv.config();

/**
 * Main function
 */
async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const isTestMode = args.includes('--test') || args.includes('-t');

    if (isTestMode) {
        // Import and run the test foundation
        const testModule = await import('./test-foundation');
        const testServer = new testModule.SonarrMCPServer();
        await testServer.initialize();
    } else {
        // Run the full MCP server
        const server = new SonarrMCPServer();
        await server.run();
    }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
    main().catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

// Export the MCP server class
export { SonarrMCPServer } from './mcp-server';