/**
 * Unit tests for MCP Tools
 */

import { SonarrApiClient } from '../src/api/sonarr-client';
import { initializeTools, getAllTools, executeTool } from '../src/tools/index';

// Mock the Sonarr API client
jest.mock('../src/api/sonarr-client');

describe('MCP Tools', () => {
    let mockClient: jest.Mocked<SonarrApiClient>;

    beforeEach(() => {
        mockClient = {
            searchSeries: jest.fn(),
            addSeries: jest.fn(),
            getSeries: jest.fn(),
            getQualityProfiles: jest.fn(),
            getLanguageProfiles: jest.fn(),
            getSeriesById: jest.fn(),
            updateSeries: jest.fn(),
            deleteSeries: jest.fn(),
            getEpisodesBySeries: jest.fn(),
            searchEpisodes: jest.fn(),
            searchSeriesMissing: jest.fn(),
            searchAllMissing: jest.fn(),
            getQueue: jest.fn(),
            removeFromQueue: jest.fn(),
            getHistory: jest.fn(),
            getSystemStatus: jest.fn(),
            getDiskSpace: jest.fn(),
            getCalendar: jest.fn(),
            getWantedMissing: jest.fn(),
            getWantedCutoffUnmet: jest.fn(),
            getEpisodeById: jest.fn(),
            updateEpisodes: jest.fn(),
        } as any;
    });

    beforeEach(async () => {
        // Clear the tools registry before each test
        const tools = getAllTools();
        tools.length = 0;

        // Initialize tools with mock client
        await initializeTools(mockClient);
    });

    describe('Tool Initialization', () => {
        it('should register all required tools', async () => {
            const tools = getAllTools();
            const toolNames = tools.map(t => t.name);

            expect(toolNames).toContain('add_series');
            expect(toolNames).toContain('list_series');
            expect(toolNames).toContain('search_missing_episodes');
            expect(toolNames).toContain('manage_queue');
            expect(toolNames).toContain('system_status');
            expect(toolNames).toContain('get_calendar');
            expect(tools.length).toBeGreaterThan(5);
        });

        it('should have proper tool schemas', () => {
            const tools = getAllTools();
            const addSeriesTool = tools.find(t => t.name === 'add_series');

            expect(addSeriesTool).toBeDefined();
            expect(addSeriesTool!.description).toBe('Add a new TV series to Sonarr');
            expect(addSeriesTool!.inputSchema.type).toBe('object');
            expect(addSeriesTool!.inputSchema.required).toContain('query');
            expect(addSeriesTool!.inputSchema.required).toContain('rootFolder');
            expect(addSeriesTool!.inputSchema.required).toContain('qualityProfile');
        });
    });

    describe('Add Series Tool', () => {
        it('should add series successfully', async () => {
            const mockSearchResults = [{
                title: 'Test Series',
                titleSlug: 'test-series',
                tvdbId: 12345,
                year: 2023,
                images: []
            }];

            const mockQualityProfiles = [{
                id: 1,
                name: 'HD-1080p',
                upgradeAllowed: true,
                cutoff: 1,
                items: []
            }];

            const mockLanguageProfiles = [{
                id: 1,
                name: 'English',
                upgradeAllowed: true,
                cutoff: { id: 1, name: 'English' },
                languages: []
            }];

            const mockAddedSeries = {
                id: 1,
                title: 'Test Series',
                year: 2023,
                path: '/tv/Test Series',
                monitored: true,
                seasonCount: 5
            };

            mockClient.searchSeries.mockResolvedValue(mockSearchResults);
            mockClient.getQualityProfiles.mockResolvedValue(mockQualityProfiles);
            mockClient.getLanguageProfiles.mockResolvedValue(mockLanguageProfiles);
            mockClient.addSeries.mockResolvedValue(mockAddedSeries as any);

            const result = await executeTool('add_series', {
                query: 'Test Series',
                rootFolder: '/tv',
                qualityProfile: 'HD-1080p'
            });

            expect(result.isError).toBeFalsy();
            expect(result.content).toHaveLength(2);
            expect(result.content[0]?.type).toBe('text');
            if (result.content[0]?.type === 'text') {
                expect(result.content[0].text).toContain('Successfully added series: Test Series');
            }
            expect(result.content[1]?.type).toBe('json');
        });

        it('should handle series not found', async () => {
            mockClient.searchSeries.mockResolvedValue([]);

            const result = await executeTool('add_series', {
                query: 'NonExistent Series',
                rootFolder: '/tv',
                qualityProfile: 'HD-1080p'
            });

            expect(result.isError).toBe(true);
            if (result.content[0]?.type === 'text') {
                expect(result.content[0].text).toContain('No series found matching');
            }
        });

        it('should handle invalid quality profile', async () => {
            const mockSearchResults = [{
                title: 'Test Series',
                titleSlug: 'test-series',
                tvdbId: 12345,
                images: []
            }];

            const mockQualityProfiles = [{
                id: 1,
                name: 'HD-1080p',
                upgradeAllowed: true,
                cutoff: 1,
                items: []
            }];

            mockClient.searchSeries.mockResolvedValue(mockSearchResults);
            mockClient.getQualityProfiles.mockResolvedValue(mockQualityProfiles);

            const result = await executeTool('add_series', {
                query: 'Test Series',
                rootFolder: '/tv',
                qualityProfile: 'NonExistent'
            });

            expect(result.isError).toBe(true);
            if (result.content[0]?.type === 'text') {
                expect(result.content[0].text).toContain('Quality profile "NonExistent" not found');
            }
        });
    });

    describe('List Series Tool', () => {
        it('should list all series', async () => {
            const mockSeries = [
                {
                    id: 1,
                    title: 'Series 1',
                    year: 2023,
                    status: 'continuing',
                    monitored: true,
                    seasonCount: 3,
                    episodeCount: 30,
                    episodeFileCount: 25,
                    sizeOnDisk: 5000000000, // 5GB
                    network: 'HBO'
                },
                {
                    id: 2,
                    title: 'Series 2',
                    year: 2022,
                    status: 'ended',
                    monitored: false,
                    seasonCount: 2,
                    episodeCount: 20,
                    episodeFileCount: 20,
                    sizeOnDisk: 3000000000, // 3GB
                    network: 'Netflix'
                }
            ];

            mockClient.getSeries.mockResolvedValue(mockSeries as any);

            const result = await executeTool('list_series', {});

            expect(result.isError).toBeFalsy();
            expect(result.content).toHaveLength(2);
            if (result.content[0]?.type === 'text') {
                expect(result.content[0].text).toContain('Found 2 series');
            }

            const jsonContent = result.content[1];
            expect(jsonContent?.type).toBe('json');
            if (jsonContent?.type === 'json') {
                expect(jsonContent.json).toHaveLength(2);
                expect(jsonContent.json[0].sizeOnDisk).toBe('4.66 GB');
            }
        });

        it('should filter series by monitoring status', async () => {
            const mockSeries = [
                { id: 1, title: 'Series 1', monitored: true, status: 'continuing' },
                { id: 2, title: 'Series 2', monitored: false, status: 'ended' }
            ];

            mockClient.getSeries.mockResolvedValue(mockSeries as any);

            const result = await executeTool('list_series', { monitored: true });

            if (result.content[0]?.type === 'text') {
                expect(result.content[0].text).toContain('Found 1 series (monitored: true)');
            }
        });
    });

    describe('Search Missing Episodes Tool', () => {
        it('should search all missing episodes', async () => {
            mockClient.searchAllMissing.mockResolvedValue();

            const result = await executeTool('search_missing_episodes', {});

            expect(result.isError).toBeFalsy();
            if (result.content[0]?.type === 'text') {
                expect(result.content[0].text).toContain('Started search for all missing episodes');
            }
            expect(mockClient.searchAllMissing).toHaveBeenCalled();
        });

        it('should search missing episodes for specific series', async () => {
            mockClient.searchSeriesMissing.mockResolvedValue();

            const result = await executeTool('search_missing_episodes', { seriesId: 123 });

            expect(result.isError).toBeFalsy();
            if (result.content[0]?.type === 'text') {
                expect(result.content[0].text).toContain('Started search for missing episodes in series ID 123');
            }
            expect(mockClient.searchSeriesMissing).toHaveBeenCalledWith(123);
        });

        it('should search missing episodes for specific season', async () => {
            const mockEpisodes = [
                { id: 1, seasonNumber: 2, hasFile: false, monitored: true },
                { id: 2, seasonNumber: 2, hasFile: false, monitored: true },
                { id: 3, seasonNumber: 2, hasFile: true, monitored: true }
            ];

            mockClient.getEpisodesBySeries.mockResolvedValue(mockEpisodes as any);
            mockClient.searchEpisodes.mockResolvedValue();

            const result = await executeTool('search_missing_episodes', {
                seriesId: 123,
                seasonNumber: 2
            });

            expect(result.isError).toBeFalsy();
            if (result.content[0]?.type === 'text') {
                expect(result.content[0].text).toContain('Started search for 2 missing episodes in season 2');
            }
            expect(mockClient.searchEpisodes).toHaveBeenCalledWith([1, 2]);
        });
    });

    describe('Manage Queue Tool', () => {
        it('should list queue items', async () => {
            const mockQueue = {
                page: 1,
                pageSize: 20,
                totalRecords: 2,
                records: [
                    {
                        id: 1,
                        title: 'Download 1',
                        series: { title: 'Series 1' },
                        episode: { seasonNumber: 1, episodeNumber: 1 },
                        quality: { quality: { name: 'HD-1080p' } },
                        status: 'downloading',
                        size: 1000000000,
                        sizeleft: 200000000,
                        timeleft: '5m'
                    }
                ]
            };

            mockClient.getQueue.mockResolvedValue(mockQueue as any);

            const result = await executeTool('manage_queue', { action: 'list' });

            expect(result.isError).toBeFalsy();
            if (result.content[0]?.type === 'text') {
                expect(result.content[0].text).toContain('Found 1 items in download queue');
            }
            if (result.content[1]?.type === 'json') {
                expect(result.content[1].json[0].progress).toBe('80%');
            }
        });

        it('should remove queue item', async () => {
            mockClient.removeFromQueue.mockResolvedValue();

            const result = await executeTool('manage_queue', {
                action: 'remove',
                queueId: 123
            });

            expect(result.isError).toBeFalsy();
            if (result.content[0]?.type === 'text') {
                expect(result.content[0].text).toContain('Removed item 123 from queue');
            }
            expect(mockClient.removeFromQueue).toHaveBeenCalledWith(123);
        });
    });

    describe('System Status Tool', () => {
        it('should get system status and disk space', async () => {
            const mockStatus = {
                version: '4.0.0',
                startTime: '2023-01-01T00:00:00Z',
                osName: 'Linux',
                osVersion: '5.4.0',
                runtimeName: '.NET',
                runtimeVersion: '7.0.0'
            };

            const mockDiskSpace = [
                {
                    path: '/tv',
                    label: 'TV Storage',
                    freeSpace: 500000000000, // 500GB
                    totalSpace: 1000000000000 // 1TB
                }
            ];

            mockClient.getSystemStatus.mockResolvedValue(mockStatus as any);
            mockClient.getDiskSpace.mockResolvedValue(mockDiskSpace as any);

            const result = await executeTool('system_status', {});

            expect(result.isError).toBeFalsy();
            if (result.content[0]?.type === 'text') {
                expect(result.content[0].text).toContain('Sonarr 4.0.0 running on Linux 5.4.0');
            }
            if (result.content[1]?.type === 'json') {
                expect(result.content[1].json.diskSpace[0].percentFree).toBe('50%');
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle API errors gracefully', async () => {
            mockClient.getSeries.mockRejectedValue(new Error('API Error'));

            const result = await executeTool('list_series', {});

            expect(result.isError).toBe(true);
            if (result.content[0]?.type === 'text') {
                expect(result.content[0].text).toContain('Failed to list series: API Error');
            }
        });

        it('should throw error for unknown tool', async () => {
            await expect(executeTool('unknown_tool', {}))
                .rejects.toThrow('Tool not found: unknown_tool');
        });
    });
});