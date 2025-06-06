/**
 * MCP Resources implementation for Sonarr
 *
 * This module contains all the MCP resources that provide context
 * and data to AI assistants about the Sonarr installation.
 *
 * Resources include:
 * - Series collection data
 * - Calendar and upcoming episodes
 * - System status and health
 * - Download queue and history
 * - Configuration information
 */

import { SonarrApiClient } from '../api/sonarr-client.js';
import type { ResourceResult } from '../types/index.js';

/**
 * Base interface for all Sonarr MCP resources
 */
export interface SonarrResource {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
    read(): Promise<ResourceResult>;
}

/**
 * Resource registry - populated with actual resource implementations
 */
export const resources: Record<string, SonarrResource> = {};

/**
 * Initialize all resources with the Sonarr API client
 */
export async function initializeResources(client: SonarrApiClient): Promise<void> {
    // Register core resources
    registerResource(createSeriesCollectionResource(client));
    registerResource(createCalendarResource(client));
    registerResource(createSystemStatusResource(client));
    registerResource(createQueueResource(client));
    registerResource(createHistoryResource(client));
    registerResource(createWantedResource(client));
    registerResource(createQualityProfilesResource(client));
    registerResource(createRootFoldersResource(client));
}

/**
 * Register a new resource
 */
export function registerResource(resource: SonarrResource): void {
    resources[resource.uri] = resource;
}

/**
 * Get all registered resources
 */
export function getAllResources(): SonarrResource[] {
    return Object.values(resources);
}

/**
 * Get resource by URI
 */
export function getResource(uri: string): SonarrResource | undefined {
    return resources[uri];
}

/**
 * Read a resource by URI
 */
export async function readResource(uri: string): Promise<ResourceResult> {
    const resource = getResource(uri);

    if (!resource) {
        throw new Error(`Resource not found: ${uri}`);
    }

    return await resource.read();
}

/**
 * List all available resource URIs with metadata
 */
export function listResources(): Array<{
    uri: string;
    name: string;
    description: string;
    mimeType: string;
}> {
    return getAllResources().map(resource => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
    }));
}

// ============================================================================
// RESOURCE IMPLEMENTATIONS
// ============================================================================

/**
 * Series Collection Resource
 */
function createSeriesCollectionResource(client: SonarrApiClient): SonarrResource {
    return {
        uri: 'sonarr://series/collection',
        name: 'TV Series Collection',
        description: 'Complete list of series in Sonarr with metadata and statistics',
        mimeType: 'application/json',
        async read(): Promise<ResourceResult> {
            try {
                const series = await client.getSeries();

                const collection = {
                    totalSeries: series.length,
                    monitoredSeries: series.filter(s => s.monitored).length,
                    continuingSeries: series.filter(s => s.status === 'continuing').length,
                    endedSeries: series.filter(s => s.status === 'ended').length,
                    totalEpisodes: series.reduce((sum, s) => sum + s.episodeCount, 0),
                    totalFiles: series.reduce((sum, s) => sum + s.episodeFileCount, 0),
                    totalSizeGB: Math.round(series.reduce((sum, s) => sum + s.sizeOnDisk, 0) / (1024 * 1024 * 1024) * 100) / 100,
                    series: series.map(s => ({
                        id: s.id,
                        title: s.title,
                        year: s.year,
                        status: s.status,
                        monitored: s.monitored,
                        network: s.network,
                        seasonCount: s.seasonCount,
                        episodeCount: s.episodeCount,
                        episodeFileCount: s.episodeFileCount,
                        sizeOnDisk: s.sizeOnDisk,
                        nextAiring: s.nextAiring,
                        previousAiring: s.previousAiring,
                        path: s.path,
                        qualityProfileId: s.qualityProfileId,
                        genres: s.genres,
                        overview: s.overview
                    }))
                };

                return {
                    contents: [{
                        uri: this.uri,
                        mimeType: this.mimeType,
                        text: JSON.stringify(collection, null, 2)
                    }]
                };
            } catch (error) {
                throw new Error(`Failed to read series collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    };
}

/**
 * Calendar Resource
 */
function createCalendarResource(client: SonarrApiClient): SonarrResource {
    return {
        uri: 'sonarr://calendar/upcoming',
        name: 'Upcoming Episodes',
        description: 'Calendar view of upcoming episodes and air dates for the next 30 days',
        mimeType: 'application/json',
        async read(): Promise<ResourceResult> {
            try {
                const today = new Date();
                const endDate = new Date();
                endDate.setDate(today.getDate() + 30);

                const calendar = await client.getCalendar(
                    today.toISOString().split('T')[0],
                    endDate.toISOString().split('T')[0]
                );

                const calendarData = {
                    dateRange: {
                        start: today.toISOString().split('T')[0],
                        end: endDate.toISOString().split('T')[0]
                    },
                    totalEpisodes: calendar.length,
                    monitoredEpisodes: calendar.filter(e => e.monitored).length,
                    episodesWithFiles: calendar.filter(e => e.hasFile).length,
                    episodes: calendar.map(e => ({
                        id: e.id,
                        seriesId: e.seriesId,
                        seriesTitle: e.series.title,
                        episodeTitle: e.title,
                        seasonNumber: e.seasonNumber,
                        episodeNumber: e.episodeNumber,
                        airDate: e.airDate,
                        airDateUtc: e.airDateUtc,
                        hasFile: e.hasFile,
                        monitored: e.monitored,
                        network: e.series.network,
                        overview: e.overview
                    }))
                };

                return {
                    contents: [{
                        uri: this.uri,
                        mimeType: this.mimeType,
                        text: JSON.stringify(calendarData, null, 2)
                    }]
                };
            } catch (error) {
                throw new Error(`Failed to read calendar: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    };
}

/**
 * System Status Resource
 */
function createSystemStatusResource(client: SonarrApiClient): SonarrResource {
    return {
        uri: 'sonarr://system/status',
        name: 'Sonarr System Status',
        description: 'Health, disk space, and system information',
        mimeType: 'application/json',
        async read(): Promise<ResourceResult> {
            try {
                const [status, diskSpace] = await Promise.all([
                    client.getSystemStatus(),
                    client.getDiskSpace()
                ]);

                const systemData = {
                    version: status.version,
                    buildTime: status.buildTime,
                    startTime: status.startTime,
                    uptime: new Date().getTime() - new Date(status.startTime).getTime(),
                    os: {
                        name: status.osName,
                        version: status.osVersion,
                        isLinux: status.isLinux,
                        isWindows: status.isWindows,
                        isMac: status.isOsx
                    },
                    runtime: {
                        name: status.runtimeName,
                        version: status.runtimeVersion,
                        isMono: status.isMono
                    },
                    paths: {
                        startupPath: status.startupPath,
                        appData: status.appData,
                        urlBase: status.urlBase
                    },
                    database: {
                        sqliteVersion: status.sqliteVersion,
                        migrationVersion: status.migrationVersion
                    },
                    diskSpace: diskSpace.map(disk => ({
                        path: disk.path,
                        label: disk.label,
                        freeSpaceBytes: disk.freeSpace,
                        totalSpaceBytes: disk.totalSpace,
                        freeSpaceGB: Math.round(disk.freeSpace / (1024 * 1024 * 1024) * 100) / 100,
                        totalSpaceGB: Math.round(disk.totalSpace / (1024 * 1024 * 1024) * 100) / 100,
                        percentFree: Math.round((disk.freeSpace / disk.totalSpace) * 100)
                    })),
                    authentication: status.authentication,
                    isDebug: status.isDebug,
                    isProduction: status.isProduction,
                    branch: status.branch
                };

                return {
                    contents: [{
                        uri: this.uri,
                        mimeType: this.mimeType,
                        text: JSON.stringify(systemData, null, 2)
                    }]
                };
            } catch (error) {
                throw new Error(`Failed to read system status: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    };
}

/**
 * Download Queue Resource
 */
function createQueueResource(client: SonarrApiClient): SonarrResource {
    return {
        uri: 'sonarr://queue/current',
        name: 'Download Queue',
        description: 'Current download queue with progress and status information',
        mimeType: 'application/json',
        async read(): Promise<ResourceResult> {
            try {
                const queue = await client.getQueue({
                    page: 1,
                    pageSize: 100,
                    includeSeries: true,
                    includeEpisode: true
                });

                const queueData = {
                    totalItems: queue.totalRecords,
                    totalPages: Math.ceil(queue.totalRecords / queue.pageSize),
                    items: queue.records.map(item => ({
                        id: item.id,
                        title: item.title,
                        series: {
                            id: item.series.id,
                            title: item.series.title
                        },
                        episode: {
                            id: item.episode.id,
                            title: item.episode.title,
                            seasonNumber: item.episode.seasonNumber,
                            episodeNumber: item.episode.episodeNumber
                        },
                        quality: {
                            name: item.quality.quality.name,
                            source: item.quality.quality.source
                        },
                        size: item.size,
                        sizeLeft: item.sizeleft,
                        status: item.status,
                        trackedDownloadStatus: item.trackedDownloadStatus,
                        trackedDownloadState: item.trackedDownloadState,
                        progress: item.size > 0 ? Math.round((1 - item.sizeleft / item.size) * 100) : 0,
                        timeLeft: item.timeleft,
                        estimatedCompletionTime: item.estimatedCompletionTime,
                        protocol: item.protocol,
                        downloadClient: item.downloadClient,
                        indexer: item.indexer,
                        downloadId: item.downloadId,
                        errorMessage: item.errorMessage,
                        statusMessages: item.statusMessages
                    }))
                };

                return {
                    contents: [{
                        uri: this.uri,
                        mimeType: this.mimeType,
                        text: JSON.stringify(queueData, null, 2)
                    }]
                };
            } catch (error) {
                throw new Error(`Failed to read queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    };
}

/**
 * History Resource
 */
function createHistoryResource(client: SonarrApiClient): SonarrResource {
    return {
        uri: 'sonarr://history/recent',
        name: 'Recent History',
        description: 'Recent download and import history (last 50 items)',
        mimeType: 'application/json',
        async read(): Promise<ResourceResult> {
            try {
                const history = await client.getHistory({
                    page: 1,
                    pageSize: 50,
                    includeSeries: true,
                    includeEpisode: true
                });

                const historyData = {
                    totalItems: history.totalRecords,
                    items: history.records.map(item => ({
                        id: item.id,
                        eventType: item.eventType,
                        date: item.date,
                        series: {
                            id: item.series.id,
                            title: item.series.title
                        },
                        episode: {
                            id: item.episode.id,
                            title: item.episode.title,
                            seasonNumber: item.episode.seasonNumber,
                            episodeNumber: item.episode.episodeNumber
                        },
                        quality: {
                            name: item.quality.quality.name,
                            source: item.quality.quality.source
                        },
                        sourceTitle: item.sourceTitle,
                        downloadId: item.downloadId,
                        customFormats: item.customFormats.map(cf => cf.name),
                        qualityCutoffNotMet: item.qualityCutoffNotMet,
                        customFormatScore: item.customFormatScore,
                        data: item.data
                    }))
                };

                return {
                    contents: [{
                        uri: this.uri,
                        mimeType: this.mimeType,
                        text: JSON.stringify(historyData, null, 2)
                    }]
                };
            } catch (error) {
                throw new Error(`Failed to read history: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    };
}

/**
 * Wanted Episodes Resource
 */
function createWantedResource(client: SonarrApiClient): SonarrResource {
    return {
        uri: 'sonarr://wanted/missing',
        name: 'Wanted Episodes',
        description: 'Missing episodes that are being monitored',
        mimeType: 'application/json',
        async read(): Promise<ResourceResult> {
            try {
                const wanted = await client.getWantedMissing({
                    page: 1,
                    pageSize: 100
                });

                const wantedData = {
                    totalMissing: wanted.totalRecords,
                    episodes: wanted.records.map(episode => ({
                        id: episode.id,
                        seriesId: episode.seriesId,
                        seriesTitle: episode.series.title,
                        episodeTitle: episode.title,
                        seasonNumber: episode.seasonNumber,
                        episodeNumber: episode.episodeNumber,
                        airDate: episode.airDate,
                        airDateUtc: episode.airDateUtc,
                        monitored: episode.monitored,
                        hasFile: episode.hasFile,
                        overview: episode.overview
                    }))
                };

                return {
                    contents: [{
                        uri: this.uri,
                        mimeType: this.mimeType,
                        text: JSON.stringify(wantedData, null, 2)
                    }]
                };
            } catch (error) {
                throw new Error(`Failed to read wanted episodes: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    };
}

/**
 * Quality Profiles Resource
 */
function createQualityProfilesResource(client: SonarrApiClient): SonarrResource {
    return {
        uri: 'sonarr://config/quality-profiles',
        name: 'Quality Profiles',
        description: 'Available quality profiles and their configurations',
        mimeType: 'application/json',
        async read(): Promise<ResourceResult> {
            try {
                const profiles = await client.getQualityProfiles();

                const profileData = {
                    totalProfiles: profiles.length,
                    profiles: profiles.map(profile => ({
                        id: profile.id,
                        name: profile.name,
                        upgradeAllowed: profile.upgradeAllowed,
                        cutoff: profile.cutoff,
                        items: profile.items.map(item => ({
                            quality: item.quality ? {
                                id: item.quality.id,
                                name: item.quality.name,
                                source: item.quality.source,
                                resolution: item.quality.resolution
                            } : null,
                            allowed: item.allowed,
                            items: item.items?.map(subItem => ({
                                quality: subItem.quality ? {
                                    id: subItem.quality.id,
                                    name: subItem.quality.name,
                                    source: subItem.quality.source,
                                    resolution: subItem.quality.resolution
                                } : null,
                                allowed: subItem.allowed
                            }))
                        }))
                    }))
                };

                return {
                    contents: [{
                        uri: this.uri,
                        mimeType: this.mimeType,
                        text: JSON.stringify(profileData, null, 2)
                    }]
                };
            } catch (error) {
                throw new Error(`Failed to read quality profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    };
}

/**
 * Root Folders Resource
 */
function createRootFoldersResource(client: SonarrApiClient): SonarrResource {
    return {
        uri: 'sonarr://config/root-folders',
        name: 'Root Folders',
        description: 'Configured root folders for series storage',
        mimeType: 'application/json',
        async read(): Promise<ResourceResult> {
            try {
                const rootFolders = await client.getRootFolders();

                const folderData = {
                    totalFolders: rootFolders.length,
                    folders: rootFolders.map(folder => ({
                        id: folder.id,
                        path: folder.path,
                        accessible: folder.accessible,
                        freeSpaceBytes: folder.freeSpace,
                        freeSpaceGB: Math.round(folder.freeSpace / (1024 * 1024 * 1024) * 100) / 100,
                        unmappedFolders: folder.unmappedFolders.map(uf => ({
                            name: uf.name,
                            path: uf.path
                        }))
                    }))
                };

                return {
                    contents: [{
                        uri: this.uri,
                        mimeType: this.mimeType,
                        text: JSON.stringify(folderData, null, 2)
                    }]
                };
            } catch (error) {
                throw new Error(`Failed to read root folders: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    };
}