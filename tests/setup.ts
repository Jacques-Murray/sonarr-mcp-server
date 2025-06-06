/**
 * Jest test setup file
 * 
 * This file runs before all tests and sets up the testing environment.
 */

import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set default test environment variables if not provided
process.env.SONARR_API_URL = process.env.SONARR_API_URL || 'http://localhost:8989';
process.env.SONARR_API_KEY = process.env.SONARR_API_KEY || 'test-api-key';
process.env.MCP_LOG_LEVEL = process.env.MCP_LOG_LEVEL || 'ERROR';

// Mock console to reduce test noise
const originalConsole = console;
beforeAll(() => {
    global.console = {
        ...originalConsole,
        log: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };
});

afterAll(() => {
    global.console = originalConsole;
});

// Global test timeout
jest.setTimeout(10000);