/**
 * Unit tests for MCP Resources
 */

import { SonarrApiClient } from '../src/api/sonarr-client.js';
import { initializeResources, getAllResources, readResource } from '../src/resources/index.js';

// Mock the Sonarr API client
jest.mock('../src/api/sonarr-client.js');

describe('MCP Resources', () => {
    let mockClient: jest.Mocked<SonarrApiClient>;

    beforeEach(() => {
        mockClient = {
            getSeries: jest.fn(),
            getCalendar: jest.fn(),
            getSystemStatus: jest.fn(),
            getDiskSpace: jest.fn(),
            getQueue: jest.fn(),
            getHistory: jest.fn(),
            getWantedMissing: jest.fn(),
            getQualityProfiles: jest.fn(),
            getRootFolders: jest.fn(),
        } as any;
    });

    beforeEach(async () => {
        // Clear the resources registry before each test
        const resources = getAllResources();
        resources.length = 0;

        // Initialize resources with mock client
        await initializeResources(mockClient);
    });

    describe('Resource Initialization', () => {
        it('should register all required resources', async () => {
            const resources = getAllResources();
            const resourceUris = resources.map(r => r.uri);

            expect(resourceUris).toContain('sonarr://series/collection');
            expect(resourceUris).toContain('sonarr://calendar/upcoming');
            expect(resourceUris).toContain('sonarr://system/status');
            expect(resourceUris).toContain('sonarr://queue/current');
            expect(resourceUris).toContain('sonarr://history/recent');
            expect(resourceUris).toContain('sonarr://wanted/missing');
            expect(resourceUris).toContain('sonarr://config/quality-profiles');
            expect(resourceUris).toContain('sonarr://config/root-folders');
            expect(resources.length).toBe(8);
        });

        it('should have proper resource metadata', () => {
            const resources = getAllResources();
            const seriesResource = resources.find(r => r.uri === 'sonarr://series/collection');

            expect(seriesResource).toBeDefined();
            expect(seriesResource!.name).toBe('TV Series Collection');
            expect(seriesResource!.description).toContain('Complete list of series in Sonarr');
            expect(seriesResource!.mimeType).toBe('application/json');
        });
    });

    describe('Series Collection Resource', () => {
        it('should read series collection successfully', async () => {
            const mockSeries = [
                {
                    id: 1,
                    title: 'Breaking Bad',
                    year: 2008,
                    status: 'ended',
                    monitored: true,
                    network: 'AMC',
                    seasonCount: 5,
                    episodeCount: 62,
                    episodeFileCount: 62,
                    sizeOnDisk: 50000000000, // 50GB
                    nextAiring: null,
                    previousAiring: '2013-09-29T21:00:00Z',
                    path: '/tv/Breaking Bad',
                    qualityProfileId: 1,
                    genres: ['Crime', 'Drama'],
                    overview: 'A high school chemistry teacher...'
                },
                {
                    id: 2,
                    title: 'Better Call Saul',
                    year: 2015,
                    status: 'ended',
                    monitored: true,
                    network: 'AMC',
                    seasonCount: 6,
                    episodeCount: 63,
                    episodeFileCount: 60,
                    sizeOnDisk: 45000000000, // 45GB
                    nextAiring: null,
                    previousAiring: '2022-08-15T21:00:00Z',
                    path: '/tv/Better Call Saul',
                    qualityProfileId: 1,
                    genres: ['Crime', 'Drama'],
                    overview: 'The trials and tribulations of criminal lawyer...'
                }
            ];

            mockClient.getSeries.mockResolvedValue(mockSeries as any);

            const result = await readResource('sonarr://series/collection');

            expect(result.contents).toHaveLength(1);
            expect(result.contents[0].uri).toBe('sonarr://series/collection');
            expect(result.contents[0].mimeType).toBe('application/json');

            const data = JSON.parse(result.contents[0].text!);
            expect(data.totalSeries).toBe(2);
            expect(data.monitoredSeries).toBe(2);
            expect(data.endedSeries).toBe(2);
            expect(data.totalEpisodes).toBe(125);
            expect(data.totalFiles).toBe(122);
            expect(data.totalSizeGB).toBe(88.45);
            expect(data.series).toHaveLength(2);
            expect(data.series[0].title).toBe('Breaking Bad');
        });
    });

    describe('Calendar Resource', () => {
        it('should read upcoming episodes calendar', async () => {
            const mockCalendar = [
                {
                    id: 1,
                    seriesId: 1,
                    title: 'Episode Title',
                    seasonNumber: 1,
                    episodeNumber: 1,
                    airDate: '2024-01-15',
                    airDateUtc: '2024-01-15T21:00:00Z',
                    hasFile: false,
                    monitored: true,
                    overview: 'Episode overview...',
                    series: {
                        title: 'Test Series',
                        network: 'HBO'
                    }
                }
            ];

            mockClient.getCalendar.mockResolvedValue(mockCalendar as any);

            const result = await readResource('sonarr://calendar/upcoming');

            expect(result.contents).toHaveLength(1);
            expect(result.contents[0].mimeType).toBe('application/json');

            const data = JSON.parse(result.contents[0].text!);
            expect(data.totalEpisodes).toBe(1);
            expect(data.monitoredEpisodes).toBe(1);
            expect(data.episodesWithFiles).toBe(0);
            expect(data.episodes).toHaveLength(1);
            expect(data.episodes[0].seriesTitle).toBe('Test Series');
        });
    });

    describe('System Status Resource', () => {
        it('should read system status and disk space', async () => {
            const mockStatus = {
                version: '4.0.0',
                buildTime: '2023-01-01T00:00:00Z',
                startTime: '2023-12-01T10:00:00Z',
                osName: 'Linux',
                osVersion: '5.4.0',
                isLinux: true,
                isWindows: false,
                isMac: false,
                runtimeName: '.NET',
                runtimeVersion: '7.0.0',
                isMono: false,
                startupPath: '/app',
                appData: '/config',
                urlBase: '',
                sqliteVersion: '3.39.0',
                migrationVersion: 184,
                authentication: 'none',
                isDebug: false,
                isProduction: true,
                branch: 'master'
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

            const result = await readResource('sonarr://system/status');

            expect(result.contents).toHaveLength(1);
            const data = JSON.parse(result.contents[0].text!);

            expect(data.version).toBe('4.0.0');
            expect(data.os.name).toBe('Linux');
            expect(data.os.isLinux).toBe(true);
            expect(data.runtime.name).toBe('.NET');
            expect(data.diskSpace).toHaveLength(1);
            expect(data.diskSpace[0].freeSpaceGB).toBe(465.66);
            expect(data.diskSpace[0].percentFree).toBe(50);
        });
    });

    describe('Queue Resource', () => {
        it('should read current download queue', async () => {
            const mockQueue = {
                page: 1,
                pageSize: 100,
                totalRecords: 2,
                records: [
                    {
                        id: 1,
                        title: 'Test.Series.S01E01.720p.HDTV.x264-GROUP',
                        series: { id: 1, title: 'Test Series' },
                        episode: {
                            id: 1,
                            title: 'Pilot',
                            seasonNumber: 1,
                            episodeNumber: 1
                        },
                        quality: {
                            quality: { name: 'HDTV-720p', source: 'television' }
                        },
                        size: 1000000000,
                        sizeleft: 200000000,
                        status: 'downloading',
                        trackedDownloadStatus: 'ok',
                        trackedDownloadState: 'downloading',
                        timeleft: '5m',
                        estimatedCompletionTime: '2024-01-15T15:05:00Z',
                        protocol: 'torrent',
                        downloadClient: 'qBittorrent',
                        indexer: 'Test Indexer',
                        downloadId: 'abc123',
                        errorMessage: null,
                        statusMessages: []
                    }
                ]
            };

            mockClient.getQueue.mockResolvedValue(mockQueue as any);

            const result = await readResource('sonarr://queue/current');

            expect(result.contents).toHaveLength(1);
            const data = JSON.parse(result.contents[0].text!);

            expect(data.totalItems).toBe(2);
            expect(data.items).toHaveLength(1);
            expect(data.items[0].progress).toBe(80);
            expect(data.items[0].series.title).toBe('Test Series');
        });
    });

    describe('History Resource', () => {
        it('should read recent history', async () => {
            const mockHistory = {
                page: 1,
                pageSize: 50,
                totalRecords: 10,
                records: [
                    {
                        id: 1,
                        eventType: 'grabbed',
                        date: '2024-01-15T14:30:00Z',
                        series: { id: 1, title: 'Test Series' },
                        episode: {
                            id: 1,
                            title: 'Pilot',
                            seasonNumber: 1,
                            episodeNumber: 1
                        },
                        quality: {
                            quality: { name: 'HDTV-720p', source: 'television' }
                        },
                        sourceTitle: 'Test.Series.S01E01.720p.HDTV.x264-GROUP',
                        downloadId: 'abc123',
                        customFormats: [{ name: 'Standard' }],
                        qualityCutoffNotMet: false,
                        customFormatScore: 0,
                        data: { indexer: 'Test Indexer' }
                    }
                ]
            };

            mockClient.getHistory.mockResolvedValue(mockHistory as any);

            const result = await readResource('sonarr://history/recent');

            expect(result.contents).toHaveLength(1);
            const data = JSON.parse(result.contents[0].text!);

            expect(data.totalItems).toBe(10);
            expect(data.items).toHaveLength(1);
            expect(data.items[0].eventType).toBe('grabbed');
            expect(data.items[0].customFormats).toEqual(['Standard']);
        });
    });

    describe('Wanted Episodes Resource', () => {
        it('should read wanted missing episodes', async () => {
            const mockWanted = {
                page: 1,
                pageSize: 100,
                totalRecords: 5,
                records: [
                    {
                        id: 1,
                        seriesId: 1,
                        title: 'Missing Episode',
                        seasonNumber: 1,
                        episodeNumber: 5,
                        airDate: '2024-01-10',
                        airDateUtc: '2024-01-10T21:00:00Z',
                        monitored: true,
                        hasFile: false,
                        overview: 'This episode is missing...',
                        series: { title: 'Test Series' }
                    }
                ]
            };

            mockClient.getWantedMissing.mockResolvedValue(mockWanted as any);

            const result = await readResource('sonarr://wanted/missing');

            expect(result.contents).toHaveLength(1);
            const data = JSON.parse(result.contents[0].text!);

            expect(data.totalMissing).toBe(5);
            expect(data.episodes).toHaveLength(1);
            expect(data.episodes[0].seriesTitle).toBe('Test Series');
            expect(data.episodes[0].hasFile).toBe(false);
        });
    });

    describe('Quality Profiles Resource', () => {
        it('should read quality profiles configuration', async () => {
            const mockProfiles = [
                {
                    id: 1,
                    name: 'HD-1080p',
                    upgradeAllowed: true,
                    cutoff: 7,
                    items: [
                        {
                            quality: {
                                id: 7,
                                name: 'Bluray-1080p',
                                source: 'bluray',
                                resolution: 1080
                            },
                            allowed: true,
                            items: []
                        }
                    ]
                }
            ];

            mockClient.getQualityProfiles.mockResolvedValue(mockProfiles as any);

            const result = await readResource('sonarr://config/quality-profiles');

            expect(result.contents).toHaveLength(1);
            const data = JSON.parse(result.contents[0].text!);

            expect(data.totalProfiles).toBe(1);
            expect(data.profiles).toHaveLength(1);
            expect(data.profiles[0].name).toBe('HD-1080p');
            expect(data.profiles[0].upgradeAllowed).toBe(true);
        });
    });

    describe('Root Folders Resource', () => {
        it('should read root folders configuration', async () => {
            const mockRootFolders = [
                {
                    id: 1,
                    path: '/tv',
                    accessible: true,
                    freeSpace: 500000000000, // 500GB
                    unmappedFolders: [
                        { name: 'Unknown Series', path: '/tv/Unknown Series' }
                    ]
                }
            ];

            mockClient.getRootFolders.mockResolvedValue(mockRootFolders as any);

            const result = await readResource('sonarr://config/root-folders');

            expect(result.contents).toHaveLength(1);
            const data = JSON.parse(result.contents[0].text!);

            expect(data.totalFolders).toBe(1);
            expect(data.folders).toHaveLength(1);
            expect(data.folders[0].path).toBe('/tv');
            expect(data.folders[0].accessible).toBe(true);
            expect(data.folders[0].freeSpaceGB).toBe(465.66);
        });
    });

    describe('Error Handling', () => {
        it('should handle API errors gracefully', async () => {
            mockClient.getSeries.mockRejectedValue(new Error('API Error'));

            await expect(readResource('sonarr://series/collection'))
                .rejects.toThrow('Failed to read series collection: API Error');
        });

        it('should throw error for unknown resource', async () => {
            await expect(readResource('sonarr://unknown/resource'))
                .rejects.toThrow('Resource not found: sonarr://unknown/resource');
        });
    });
});