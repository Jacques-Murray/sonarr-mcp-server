/**
 * Unit tests for SonarrApiClient
 */

import { SonarrApiClient, SonarrApiError } from '../src/api/sonarr-client';
import type { SonarrConfig } from '../src/config/config';

// Mock axios
jest.mock('axios');
import axios from 'axios';
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('SonarrApiClient', () => {
    let client: SonarrApiClient;
    let mockAxiosInstance: any;

    const testConfig: SonarrConfig = {
        url: 'http://localhost:8989',
        apiKey: 'test-api-key',
        timeout: 30,
        maxRetries: 3,
        verifySsl: true
    };

    beforeEach(() => {
        mockAxiosInstance = {
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn(),
            interceptors: {
                request: { use: jest.fn() },
                response: { use: jest.fn() }
            }
        };

        mockAxios.create.mockReturnValue(mockAxiosInstance);
        client = new SonarrApiClient(testConfig);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create axios instance with correct configuration', () => {
            expect(mockAxios.create).toHaveBeenCalledWith({
                baseURL: 'http://localhost:8989/api/v3',
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': 'test-api-key'
                },
                httpsAgent: undefined
            });
        });

        it('should disable SSL verification when verifySsl is false', () => {
            const configWithoutSsl = { ...testConfig, verifySsl: false };
            new SonarrApiClient(configWithoutSsl);

            expect(mockAxios.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    httpsAgent: { rejectUnauthorized: false }
                })
            );
        });
    });

    describe('getSystemStatus', () => {
        it('should fetch system status successfully', async () => {
            const mockStatus = {
                version: '4.0.0',
                osName: 'Linux',
                osVersion: '5.4.0'
            };

            mockAxiosInstance.get.mockResolvedValue({ data: mockStatus });

            const result = await client.getSystemStatus();

            expect(mockAxiosInstance.get).toHaveBeenCalledWith('/system/status');
            expect(result).toEqual(mockStatus);
        });

        it('should handle API errors', async () => {
            const errorResponse = {
                response: {
                    status: 500,
                    statusText: 'Internal Server Error',
                    data: 'Server error'
                }
            };

            mockAxiosInstance.get.mockRejectedValue(errorResponse);

            await expect(client.getSystemStatus()).rejects.toBeDefined();
        });
    });

    describe('getSeries', () => {
        it('should fetch all series successfully', async () => {
            const mockSeries = [
                { id: 1, title: 'Test Series 1' },
                { id: 2, title: 'Test Series 2' }
            ];

            mockAxiosInstance.get.mockResolvedValue({ data: mockSeries });

            const result = await client.getSeries();

            expect(mockAxiosInstance.get).toHaveBeenCalledWith('/series', {
                params: { includeSeasonImages: false }
            });
            expect(result).toEqual(mockSeries);
        });

        it('should include season images when requested', async () => {
            mockAxiosInstance.get.mockResolvedValue({ data: [] });

            await client.getSeries(true);

            expect(mockAxiosInstance.get).toHaveBeenCalledWith('/series', {
                params: { includeSeasonImages: true }
            });
        });
    });

    describe('addSeries', () => {
        it('should add a new series successfully', async () => {
            const seriesData = {
                title: 'New Series',
                titleSlug: 'new-series',
                tvdbId: 12345,
                qualityProfileId: 1,
                languageProfileId: 1,
                rootFolderPath: '/tv',
                monitored: true,
                seasonFolder: true
            };

            const mockResponse = { ...seriesData, id: 1 };
            mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

            const result = await client.addSeries(seriesData);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/series', seriesData);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('searchSeries', () => {
        it('should search for series on TVDB', async () => {
            const mockSearchResults = [
                {
                    tvdbId: 12345,
                    title: 'Search Result',
                    titleSlug: 'search-result',
                    year: 2023
                }
            ];

            mockAxiosInstance.get.mockResolvedValue({ data: mockSearchResults });

            const result = await client.searchSeries('search term');

            expect(mockAxiosInstance.get).toHaveBeenCalledWith('/series/lookup', {
                params: { term: 'search term' }
            });
            expect(result).toEqual(mockSearchResults);
        });
    });

    describe('getQueue', () => {
        it('should fetch download queue successfully', async () => {
            const mockQueue = {
                page: 1,
                pageSize: 20,
                totalRecords: 5,
                records: [
                    { id: 1, title: 'Download 1' },
                    { id: 2, title: 'Download 2' }
                ]
            };

            mockAxiosInstance.get.mockResolvedValue({ data: mockQueue });

            const result = await client.getQueue({ page: 1, pageSize: 20 });

            expect(mockAxiosInstance.get).toHaveBeenCalledWith('/queue', {
                params: { page: 1, pageSize: 20 }
            });
            expect(result).toEqual(mockQueue);
        });
    });

    describe('searchMissingEpisodes', () => {
        it('should trigger search for missing episodes', async () => {
            mockAxiosInstance.post.mockResolvedValue({ data: {} });

            await client.searchAllMissing();

            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/command', {
                name: 'MissingEpisodeSearch'
            });
        });

        it('should trigger search for specific series', async () => {
            mockAxiosInstance.post.mockResolvedValue({ data: {} });

            await client.searchSeriesMissing(123);

            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/command', {
                name: 'SeriesSearch',
                seriesId: 123
            });
        });
    });

    describe('executeWithRetry', () => {
        it('should retry on server errors', async () => {
            const operation = jest.fn()
                .mockRejectedValueOnce(new SonarrApiError('Server error', 500))
                .mockRejectedValueOnce(new SonarrApiError('Server error', 500))
                .mockResolvedValueOnce('success');

            const result = await client.executeWithRetry(operation, 2);

            expect(operation).toHaveBeenCalledTimes(3);
            expect(result).toBe('success');
        });

        it('should not retry on client errors', async () => {
            const operation = jest.fn()
                .mockRejectedValue(new SonarrApiError('Not found', 404));

            await expect(client.executeWithRetry(operation, 2))
                .rejects.toThrow('Not found');

            expect(operation).toHaveBeenCalledTimes(1);
        });
    });

    describe('testConnection', () => {
        it('should test connection successfully', async () => {
            mockAxiosInstance.get.mockResolvedValue({
                data: { version: '4.0.0' }
            });

            await expect(client.testConnection()).resolves.toBeUndefined();
        });

        it('should throw error on connection failure', async () => {
            mockAxiosInstance.get.mockRejectedValue(new Error('Connection failed'));

            await expect(client.testConnection()).rejects.toThrow('Failed to connect to Sonarr');
        });
    });
});