/**
 * MCP Tools implementation for Sonarr
 *
 * This module contains all the MCP tools that allow AI assistants
 * to interact with Sonarr functionality through natural language.
 *
 * Tools are organized by category:
 * - Series management (add, list, update, remove)
 * - Episode operations (search, monitor, manage files)
 * - Quality and profile management
 * - Download and activity monitoring
 * - System configuration
 * - Search and discovery
 */

import { SonarrApiClient } from '../api/sonarr-client.js';
import type { ToolResult } from '../types/index.js';

/**
 * Base interface for all Sonarr MCP tools
 */
export interface SonarrTool {
    name: string;
    description: string;
    inputSchema: any;
    execute(args: any): Promise<ToolResult>;
}

/**
 * Tool registry - populated with actual tool implementations
 */
export const tools: Record<string, SonarrTool> = {};

/**
 * Initialize all tools with the Sonarr API client
 */
export async function initializeTools(client: SonarrApiClient): Promise<void> {
    // Register series management tools
    registerTool(createAddSeriesTool(client));
    registerTool(createListSeriesTool(client));
    registerTool(createUpdateSeriesTool(client));
    registerTool(createRemoveSeriesTool(client));
    registerTool(createSearchSeriesTool(client));

    // Register episode management tools
    registerTool(createListEpisodesTool(client));
    registerTool(createSearchEpisodesTool(client));
    registerTool(createMonitorEpisodesTool(client));

    // Register queue management tools
    registerTool(createManageQueueTool(client));
    registerTool(createGetHistoryTool(client));

    // Register system tools
    registerTool(createSystemStatusTool(client));
    registerTool(createGetCalendarTool(client));

    // Register search tools
    registerTool(createSearchMissingEpisodesTool(client));
    registerTool(createGetWantedTool(client));
}

/**
 * Register a new tool
 */
export function registerTool(tool: SonarrTool): void {
    tools[tool.name] = tool;
}

/**
 * Get all registered tools
 */
export function getAllTools(): SonarrTool[] {
    return Object.values(tools);
}

/**
 * Get tool by name
 */
export function getTool(name: string): SonarrTool | undefined {
    return tools[name];
}

/**
 * Execute a tool by name with arguments
 */
export async function executeTool(name: string, args: any): Promise<ToolResult> {
    const tool = getTool(name);

    if (!tool) {
        throw new Error(`Tool not found: ${name}`);
    }

    return await tool.execute(args);
}

// ============================================================================
// TOOL IMPLEMENTATIONS
// ============================================================================

/**
 * Add Series Tool
 */
function createAddSeriesTool(client: SonarrApiClient): SonarrTool {
    return {
        name: 'add_series',
        description: 'Add a new TV series to Sonarr',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Series name, TVDB ID, or IMDB ID to search for'
                },
                rootFolder: {
                    type: 'string',
                    description: 'Root folder path where the series will be stored'
                },
                qualityProfile: {
                    type: 'string',
                    description: 'Quality profile name or ID'
                },
                monitor: {
                    type: 'string',
                    enum: ['all', 'future', 'missing', 'existing', 'none'],
                    description: 'Monitoring mode for the series',
                    default: 'all'
                },
                searchForMissingEpisodes: {
                    type: 'boolean',
                    description: 'Whether to search for missing episodes after adding',
                    default: false
                },
                seasonFolder: {
                    type: 'boolean',
                    description: 'Use season folders',
                    default: true
                }
            },
            required: ['query', 'rootFolder', 'qualityProfile']
        },
        async execute(args): Promise<ToolResult> {
            try {
                // First search for the series
                const searchResults = await client.searchSeries(args.query);

                if (searchResults.length === 0) {
                    return {
                        content: [{
                            type: 'text',
                            text: `No series found matching "${args.query}"`
                        }],
                        isError: true
                    };
                }

                // Get the first result (best match)
                const seriesData = searchResults[0]!;

                // Get available quality profiles
                const qualityProfiles = await client.getQualityProfiles();
                let qualityProfileId: number;

                if (isNaN(parseInt(args.qualityProfile))) {
                    // Find by name
                    const profile = qualityProfiles.find(p =>
                        p.name.toLowerCase() === args.qualityProfile.toLowerCase()
                    );
                    if (!profile) {
                        return {
                            content: [{
                                type: 'text',
                                text: `Quality profile "${args.qualityProfile}" not found. Available profiles: ${qualityProfiles.map(p => p.name).join(', ')}`
                            }],
                            isError: true
                        };
                    }
                    qualityProfileId = profile.id;
                } else {
                    qualityProfileId = parseInt(args.qualityProfile);
                }

                // Get language profiles (use first one as default)
                const languageProfiles = await client.getLanguageProfiles();
                const languageProfileId = languageProfiles[0]?.id || 1;

                // Add the series
                const addedSeries = await client.addSeries({
                    title: seriesData.title,
                    titleSlug: seriesData.titleSlug,
                    tvdbId: seriesData.tvdbId,
                    qualityProfileId,
                    languageProfileId,
                    rootFolderPath: args.rootFolder,
                    monitored: true,
                    seasonFolder: args.seasonFolder ?? true,
                    addOptions: {
                        monitor: args.monitor || 'all',
                        searchForMissingEpisodes: args.searchForMissingEpisodes || false
                    }
                });

                return {
                    content: [
                        {
                            type: 'text',
                            text: `Successfully added series: ${addedSeries.title} (${addedSeries.year})`
                        },
                        {
                            type: 'json',
                            json: {
                                id: addedSeries.id,
                                title: addedSeries.title,
                                year: addedSeries.year,
                                path: addedSeries.path,
                                monitored: addedSeries.monitored,
                                seasonCount: addedSeries.seasonCount
                            }
                        }
                    ]
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to add series: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                    isError: true
                };
            }
        }
    };
}

/**
 * List Series Tool
 */
function createListSeriesTool(client: SonarrApiClient): SonarrTool {
    return {
        name: 'list_series',
        description: 'List all TV series in Sonarr with optional filtering',
        inputSchema: {
            type: 'object',
            properties: {
                monitored: {
                    type: 'boolean',
                    description: 'Filter by monitoring status'
                },
                status: {
                    type: 'string',
                    enum: ['continuing', 'ended', 'upcoming', 'deleted'],
                    description: 'Filter by series status'
                },
                search: {
                    type: 'string',
                    description: 'Search term to filter series by title'
                }
            }
        },
        async execute(args): Promise<ToolResult> {
            try {
                const allSeries = await client.getSeries();

                let filteredSeries = allSeries;

                // Apply filters
                if (args.monitored !== undefined) {
                    filteredSeries = filteredSeries.filter(s => s.monitored === args.monitored);
                }

                if (args.status) {
                    filteredSeries = filteredSeries.filter(s => s.status === args.status);
                }

                if (args.search) {
                    const searchLower = args.search.toLowerCase();
                    filteredSeries = filteredSeries.filter(s =>
                        s.title.toLowerCase().includes(searchLower)
                    );
                }

                const seriesSummary = filteredSeries.map(series => ({
                    id: series.id,
                    title: series.title,
                    year: series.year,
                    status: series.status,
                    monitored: series.monitored,
                    seasonCount: series.seasonCount,
                    episodeCount: series.episodeCount,
                    episodeFileCount: series.episodeFileCount,
                    sizeOnDisk: Math.round(series.sizeOnDisk / (1024 * 1024 * 1024) * 100) / 100 + ' GB',
                    nextAiring: series.nextAiring,
                    network: series.network
                }));

                return {
                    content: [
                        {
                            type: 'text',
                            text: `Found ${filteredSeries.length} series${args.monitored !== undefined ? ` (monitored: ${args.monitored})` : ''}${args.status ? ` (status: ${args.status})` : ''}`
                        },
                        {
                            type: 'json',
                            json: seriesSummary
                        }
                    ]
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to list series: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                    isError: true
                };
            }
        }
    };
}

/**
 * Search Missing Episodes Tool
 */
function createSearchMissingEpisodesTool(client: SonarrApiClient): SonarrTool {
    return {
        name: 'search_missing_episodes',
        description: 'Search for missing episodes across all or specific series',
        inputSchema: {
            type: 'object',
            properties: {
                seriesId: {
                    type: 'integer',
                    description: 'Specific series ID to search (optional)'
                },
                seasonNumber: {
                    type: 'integer',
                    description: 'Specific season number (requires seriesId)'
                }
            }
        },
        async execute(args): Promise<ToolResult> {
            try {
                if (args.seriesId) {
                    if (args.seasonNumber) {
                        // Search specific season - we'll get episodes and search for missing ones
                        const episodes = await client.getEpisodesBySeries(args.seriesId);
                        const seasonEpisodes = episodes.filter(e =>
                            e.seasonNumber === args.seasonNumber && !e.hasFile && e.monitored
                        );

                        if (seasonEpisodes.length > 0) {
                            await client.searchEpisodes(seasonEpisodes.map(e => e.id));
                            return {
                                content: [{
                                    type: 'text',
                                    text: `Started search for ${seasonEpisodes.length} missing episodes in season ${args.seasonNumber}`
                                }]
                            };
                        } else {
                            return {
                                content: [{
                                    type: 'text',
                                    text: `No missing episodes found in season ${args.seasonNumber}`
                                }]
                            };
                        }
                    } else {
                        // Search entire series
                        await client.searchSeriesMissing(args.seriesId);
                        return {
                            content: [{
                                type: 'text',
                                text: `Started search for missing episodes in series ID ${args.seriesId}`
                            }]
                        };
                    }
                } else {
                    // Search all missing episodes
                    await client.searchAllMissing();
                    return {
                        content: [{
                            type: 'text',
                            text: 'Started search for all missing episodes across all series'
                        }]
                    };
                }
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to search for missing episodes: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                    isError: true
                };
            }
        }
    };
}

// Additional tool creation functions (simplified for space)
function createUpdateSeriesTool(client: SonarrApiClient): SonarrTool {
    return {
        name: 'update_series',
        description: 'Update series settings like monitoring status or quality profile',
        inputSchema: {
            type: 'object',
            properties: {
                seriesId: { type: 'integer', description: 'Series ID to update' },
                monitored: { type: 'boolean', description: 'Update monitoring status' },
                qualityProfileId: { type: 'integer', description: 'New quality profile ID' }
            },
            required: ['seriesId']
        },
        async execute(args): Promise<ToolResult> {
            try {
                const series = await client.getSeriesById(args.seriesId);

                if (args.monitored !== undefined) {
                    series.monitored = args.monitored;
                }
                if (args.qualityProfileId !== undefined) {
                    series.qualityProfileId = args.qualityProfileId;
                }

                const updated = await client.updateSeries(series);

                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated series: ${updated.title}`
                    }]
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to update series: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                    isError: true
                };
            }
        }
    };
}

function createRemoveSeriesTool(client: SonarrApiClient): SonarrTool {
    return {
        name: 'remove_series',
        description: 'Remove a series from Sonarr',
        inputSchema: {
            type: 'object',
            properties: {
                seriesId: { type: 'integer', description: 'Series ID to remove' },
                deleteFiles: { type: 'boolean', description: 'Delete files from disk', default: false }
            },
            required: ['seriesId']
        },
        async execute(args): Promise<ToolResult> {
            try {
                const series = await client.getSeriesById(args.seriesId);
                await client.deleteSeries(args.seriesId, args.deleteFiles || false);

                return {
                    content: [{
                        type: 'text',
                        text: `Successfully removed series: ${series.title}${args.deleteFiles ? ' (files deleted)' : ''}`
                    }]
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to remove series: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                    isError: true
                };
            }
        }
    };
}

function createSearchSeriesTool(client: SonarrApiClient): SonarrTool {
    return {
        name: 'search_series',
        description: 'Search for series on TVDB',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Search term' }
            },
            required: ['query']
        },
        async execute(args): Promise<ToolResult> {
            try {
                const results = await client.searchSeries(args.query);

                return {
                    content: [
                        {
                            type: 'text',
                            text: `Found ${results.length} series matching "${args.query}"`
                        },
                        {
                            type: 'json',
                            json: results.map(s => ({
                                tvdbId: s.tvdbId,
                                title: s.title,
                                year: s.year,
                                network: s.network,
                                overview: s.overview?.substring(0, 200) + '...'
                            }))
                        }
                    ]
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to search series: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                    isError: true
                };
            }
        }
    };
}

function createListEpisodesTool(client: SonarrApiClient): SonarrTool {
    return {
        name: 'list_episodes',
        description: 'List episodes for a specific series',
        inputSchema: {
            type: 'object',
            properties: {
                seriesId: { type: 'integer', description: 'Series ID' },
                seasonNumber: { type: 'integer', description: 'Filter by season number' },
                monitored: { type: 'boolean', description: 'Filter by monitoring status' },
                hasFile: { type: 'boolean', description: 'Filter by file availability' }
            },
            required: ['seriesId']
        },
        async execute(args): Promise<ToolResult> {
            try {
                let episodes = await client.getEpisodesBySeries(args.seriesId);

                if (args.seasonNumber !== undefined) {
                    episodes = episodes.filter(e => e.seasonNumber === args.seasonNumber);
                }
                if (args.monitored !== undefined) {
                    episodes = episodes.filter(e => e.monitored === args.monitored);
                }
                if (args.hasFile !== undefined) {
                    episodes = episodes.filter(e => e.hasFile === args.hasFile);
                }

                return {
                    content: [
                        {
                            type: 'text',
                            text: `Found ${episodes.length} episodes`
                        },
                        {
                            type: 'json',
                            json: episodes.map(e => ({
                                id: e.id,
                                title: e.title,
                                seasonNumber: e.seasonNumber,
                                episodeNumber: e.episodeNumber,
                                airDate: e.airDate,
                                hasFile: e.hasFile,
                                monitored: e.monitored
                            }))
                        }
                    ]
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to list episodes: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                    isError: true
                };
            }
        }
    };
}

function createSearchEpisodesTool(client: SonarrApiClient): SonarrTool {
    return {
        name: 'search_episodes',
        description: 'Search for specific episodes',
        inputSchema: {
            type: 'object',
            properties: {
                episodeIds: {
                    type: 'array',
                    items: { type: 'integer' },
                    description: 'Array of episode IDs to search for'
                }
            },
            required: ['episodeIds']
        },
        async execute(args): Promise<ToolResult> {
            try {
                await client.searchEpisodes(args.episodeIds);

                return {
                    content: [{
                        type: 'text',
                        text: `Started search for ${args.episodeIds.length} episodes`
                    }]
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to search episodes: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                    isError: true
                };
            }
        }
    };
}

function createMonitorEpisodesTool(client: SonarrApiClient): SonarrTool {
    return {
        name: 'monitor_episodes',
        description: 'Toggle monitoring for episodes',
        inputSchema: {
            type: 'object',
            properties: {
                episodeIds: {
                    type: 'array',
                    items: { type: 'integer' },
                    description: 'Array of episode IDs'
                },
                monitored: { type: 'boolean', description: 'Monitoring status to set' }
            },
            required: ['episodeIds', 'monitored']
        },
        async execute(args): Promise<ToolResult> {
            try {
                const episodes = [];
                for (const id of args.episodeIds) {
                    const episode = await client.getEpisodeById(id);
                    episode.monitored = args.monitored;
                    episodes.push(episode);
                }

                await client.updateEpisodes(episodes);

                return {
                    content: [{
                        type: 'text',
                        text: `Updated monitoring status for ${args.episodeIds.length} episodes to ${args.monitored}`
                    }]
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to update episode monitoring: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                    isError: true
                };
            }
        }
    };
}

function createManageQueueTool(client: SonarrApiClient): SonarrTool {
    return {
        name: 'manage_queue',
        description: 'View and manage the download queue',
        inputSchema: {
            type: 'object',
            properties: {
                action: {
                    type: 'string',
                    enum: ['list', 'remove', 'retry'],
                    description: 'Action to perform'
                },
                queueId: {
                    type: 'integer',
                    description: 'Queue item ID for remove/retry actions'
                }
            },
            required: ['action']
        },
        async execute(args): Promise<ToolResult> {
            try {
                if (args.action === 'list') {
                    const queue = await client.getQueue();

                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Found ${queue.records.length} items in download queue`
                            },
                            {
                                type: 'json',
                                json: queue.records.map(item => ({
                                    id: item.id,
                                    title: item.title,
                                    series: item.series.title,
                                    episode: `S${item.episode.seasonNumber.toString().padStart(2, '0')}E${item.episode.episodeNumber.toString().padStart(2, '0')}`,
                                    quality: item.quality.quality.name,
                                    status: item.status,
                                    progress: item.size > 0 ? Math.round((1 - item.sizeleft / item.size) * 100) + '%' : 'Unknown',
                                    timeLeft: item.timeleft
                                }))
                            }
                        ]
                    };
                } else if (args.action === 'remove' && args.queueId) {
                    await client.removeFromQueue(args.queueId);
                    return {
                        content: [{
                            type: 'text',
                            text: `Removed item ${args.queueId} from queue`
                        }]
                    };
                } else {
                    return {
                        content: [{
                            type: 'text',
                            text: 'Invalid action or missing queueId for remove action'
                        }],
                        isError: true
                    };
                }
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to manage queue: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                    isError: true
                };
            }
        }
    };
}

function createGetHistoryTool(client: SonarrApiClient): SonarrTool {
    return {
        name: 'get_history',
        description: 'Get download and import history',
        inputSchema: {
            type: 'object',
            properties: {
                page: { type: 'integer', description: 'Page number', default: 1 },
                pageSize: { type: 'integer', description: 'Items per page', default: 20 },
                seriesId: { type: 'integer', description: 'Filter by series ID' },
                eventType: {
                    type: 'string',
                    enum: ['grabbed', 'seriesFolderImported', 'downloadFolderImported', 'downloadFailed', 'episodeFileDeleted', 'episodeFileRenamed'],
                    description: 'Filter by event type'
                }
            }
        },
        async execute(args): Promise<ToolResult> {
            try {
                const history = await client.getHistory({
                    page: args.page || 1,
                    pageSize: args.pageSize || 20,
                    seriesId: args.seriesId,
                    eventType: args.eventType
                });

                return {
                    content: [
                        {
                            type: 'text',
                            text: `Found ${history.totalRecords} history items (page ${history.page}/${Math.ceil(history.totalRecords / history.pageSize)})`
                        },
                        {
                            type: 'json',
                            json: history.records.map(item => ({
                                id: item.id,
                                eventType: item.eventType,
                                series: item.series.title,
                                episode: `S${item.episode.seasonNumber.toString().padStart(2, '0')}E${item.episode.episodeNumber.toString().padStart(2, '0')} - ${item.episode.title}`,
                                quality: item.quality.quality.name,
                                date: item.date,
                                sourceTitle: item.sourceTitle
                            }))
                        }
                    ]
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to get history: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                    isError: true
                };
            }
        }
    };
}

function createSystemStatusTool(client: SonarrApiClient): SonarrTool {
    return {
        name: 'system_status',
        description: 'Get Sonarr system status and health information',
        inputSchema: {
            type: 'object',
            properties: {}
        },
        async execute(): Promise<ToolResult> {
            try {
                const [status, diskSpace] = await Promise.all([
                    client.getSystemStatus(),
                    client.getDiskSpace()
                ]);

                return {
                    content: [
                        {
                            type: 'text',
                            text: `Sonarr ${status.version} running on ${status.osName} ${status.osVersion}`
                        },
                        {
                            type: 'json',
                            json: {
                                version: status.version,
                                uptime: status.startTime,
                                os: `${status.osName} ${status.osVersion}`,
                                runtime: `${status.runtimeName} ${status.runtimeVersion}`,
                                diskSpace: diskSpace.map(disk => ({
                                    path: disk.path,
                                    label: disk.label,
                                    freeSpace: Math.round(disk.freeSpace / (1024 * 1024 * 1024) * 100) / 100 + ' GB',
                                    totalSpace: Math.round(disk.totalSpace / (1024 * 1024 * 1024) * 100) / 100 + ' GB',
                                    percentFree: Math.round((disk.freeSpace / disk.totalSpace) * 100) + '%'
                                }))
                            }
                        }
                    ]
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to get system status: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                    isError: true
                };
            }
        }
    };
}

function createGetCalendarTool(client: SonarrApiClient): SonarrTool {
    return {
        name: 'get_calendar',
        description: 'Get upcoming episodes calendar',
        inputSchema: {
            type: 'object',
            properties: {
                start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                end: { type: 'string', description: 'End date (YYYY-MM-DD)' },
                unmonitored: { type: 'boolean', description: 'Include unmonitored episodes', default: false }
            }
        },
        async execute(args): Promise<ToolResult> {
            try {
                const calendar = await client.getCalendar(args.start, args.end, args.unmonitored || false);

                return {
                    content: [
                        {
                            type: 'text',
                            text: `Found ${calendar.length} upcoming episodes`
                        },
                        {
                            type: 'json',
                            json: calendar.map(item => ({
                                series: item.series.title,
                                episode: `S${item.seasonNumber.toString().padStart(2, '0')}E${item.episodeNumber.toString().padStart(2, '0')} - ${item.title}`,
                                airDate: item.airDate,
                                airDateUtc: item.airDateUtc,
                                hasFile: item.hasFile,
                                monitored: item.monitored,
                                network: item.series.network
                            }))
                        }
                    ]
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to get calendar: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                    isError: true
                };
            }
        }
    };
}

function createGetWantedTool(client: SonarrApiClient): SonarrTool {
    return {
        name: 'get_wanted',
        description: 'Get wanted/missing episodes',
        inputSchema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    enum: ['missing', 'cutoff'],
                    description: 'Type of wanted episodes',
                    default: 'missing'
                },
                page: { type: 'integer', description: 'Page number', default: 1 },
                pageSize: { type: 'integer', description: 'Items per page', default: 20 }
            }
        },
        async execute(args): Promise<ToolResult> {
            try {
                const wanted = args.type === 'cutoff'
                    ? await client.getWantedCutoffUnmet({ page: args.page || 1, pageSize: args.pageSize || 20 })
                    : await client.getWantedMissing({ page: args.page || 1, pageSize: args.pageSize || 20 });

                return {
                    content: [
                        {
                            type: 'text',
                            text: `Found ${wanted.totalRecords} wanted episodes (${args.type || 'missing'}) - page ${wanted.page}/${Math.ceil(wanted.totalRecords / wanted.pageSize)}`
                        },
                        {
                            type: 'json',
                            json: wanted.records.map(item => ({
                                id: item.id,
                                series: item.series.title,
                                episode: `S${item.seasonNumber.toString().padStart(2, '0')}E${item.episodeNumber.toString().padStart(2, '0')} - ${item.title}`,
                                airDate: item.airDate,
                                monitored: item.monitored
                            }))
                        }
                    ]
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to get wanted episodes: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                    isError: true
                };
            }
        }
    };
}