import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger } from '../config/logger.js';
import type { SonarrConfig } from '../config/config.js';
import type {
    Series, Episode, EpisodeFile, QueueItem, HistoryItem, CalendarItem,
    SystemStatus, DiskSpace, QualityProfile, LanguageProfile, CustomFormat,
    RootFolder, Indexer, DownloadClient, TvdbSearchResult, Release,
    Activity, Tag, WantedEpisode, PaginatedResponse, PaginationParams,
    FilterParams, AddSeriesOptions
} from '../types/index.js';

/**
 * Base API error class
 */
export class SonarrApiError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public response?: any
    ) {
        super(message);
        this.name = 'SonarrApiError';
    }
}

/**
 * Comprehensive Sonarr API client
 */
export class SonarrApiClient {
    private client: AxiosInstance;
    private config: SonarrConfig;

    constructor(config: SonarrConfig) {
        this.config = config;

        this.client = axios.create({
            baseURL: `${config.url}/api/v3`,
            timeout: config.timeout * 1000,
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': config.apiKey,
            },
            // SSL verification
            httpsAgent: config.verifySsl ? undefined : {
                rejectUnauthorized: false,
            },
        });

        this.setupInterceptors();
    }

    /**
     * Setup axios interceptors for logging and error handling
     */
    private setupInterceptors(): void {
        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                logger.debug(`Sonarr API Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                logger.error('Sonarr API Request Error:', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response: AxiosResponse) => {
                logger.debug(`Sonarr API Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                const message = this.extractErrorMessage(error);
                logger.error(`Sonarr API Error: ${message}`);

                throw new SonarrApiError(
                    message,
                    error.response?.status,
                    error.response?.data
                );
            }
        );
    }

    /**
     * Extract meaningful error message from axios error
     */
    private extractErrorMessage(error: any): string {
        if (error.response) {
            // Server responded with error status
            const data = error.response.data;
            if (typeof data === 'string') {
                return data;
            }
            if (data?.message) {
                return data.message;
            }
            if (data?.error) {
                return data.error;
            }
            return `HTTP ${error.response.status}: ${error.response.statusText}`;
        }

        if (error.request) {
            // Request made but no response received
            return 'No response from Sonarr server';
        }

        // Something else happened
        return error.message || 'Unknown error';
    }

    /**
     * Test connection to Sonarr
     */
    async testConnection(): Promise<void> {
        try {
            await this.getSystemStatus();
            logger.info('Sonarr connection test successful');
        } catch (error) {
            logger.error('Sonarr connection test failed:', error);
            throw new SonarrApiError(
                `Failed to connect to Sonarr at ${this.config.url}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Execute API request with retry logic
     */
    async executeWithRetry<T>(
        operation: () => Promise<T>,
        retries: number = this.config.maxRetries
    ): Promise<T> {
        let lastError: Error;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');

                if (attempt === retries) {
                    break;
                }

                // Don't retry on client errors (4xx)
                if (error instanceof SonarrApiError && error.statusCode && error.statusCode < 500) {
                    break;
                }

                const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                logger.warn(`Sonarr API attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);

                await new Promise<void>(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError!;
    }

    // ============================================================================
    // SYSTEM ENDPOINTS
    // ============================================================================

    /**
     * Get system status from Sonarr
     */
    async getSystemStatus(): Promise<SystemStatus> {
        const response = await this.client.get<SystemStatus>('/system/status');
        return response.data;
    }

    /**
     * Get disk space information
     */
    async getDiskSpace(): Promise<DiskSpace[]> {
        const response = await this.client.get<DiskSpace[]>('/diskspace');
        return response.data;
    }

    // ============================================================================
    // SERIES ENDPOINTS
    // ============================================================================

    /**
     * Get all series
     */
    async getSeries(includeSeasonImages: boolean = false): Promise<Series[]> {
        const response = await this.client.get<Series[]>('/series', {
            params: { includeSeasonImages }
        });
        return response.data;
    }

    /**
     * Get series by ID
     */
    async getSeriesById(id: number, includeSeasonImages: boolean = false): Promise<Series> {
        const response = await this.client.get<Series>(`/series/${id}`, {
            params: { includeSeasonImages }
        });
        return response.data;
    }

    /**
     * Add new series
     */
    async addSeries(series: Partial<Series> & {
        title: string;
        titleSlug: string;
        tvdbId?: number;
        qualityProfileId: number;
        languageProfileId?: number;
        rootFolderPath: string;
        monitored?: boolean;
        seasonFolder?: boolean;
        addOptions?: AddSeriesOptions;
    }): Promise<Series> {
        const response = await this.client.post<Series>('/series', series);
        return response.data;
    }

    /**
     * Update existing series
     */
    async updateSeries(series: Series): Promise<Series> {
        const response = await this.client.put<Series>(`/series/${series.id}`, series);
        return response.data;
    }

    /**
     * Delete series
     */
    async deleteSeries(id: number, deleteFiles: boolean = false, addImportListExclusion: boolean = false): Promise<void> {
        await this.client.delete(`/series/${id}`, {
            params: { deleteFiles, addImportListExclusion }
        });
    }

    /**
     * Search for series on TVDB
     */
    async searchSeries(term: string): Promise<TvdbSearchResult[]> {
        const response = await this.client.get<TvdbSearchResult[]>('/series/lookup', {
            params: { term }
        });
        return response.data;
    }

    // ============================================================================
    // EPISODE ENDPOINTS
    // ============================================================================

    /**
     * Get episodes for a series
     */
    async getEpisodesBySeries(seriesId: number, includeImages: boolean = false): Promise<Episode[]> {
        const response = await this.client.get<Episode[]>('/episode', {
            params: { seriesId, includeImages }
        });
        return response.data;
    }

    /**
     * Get episode by ID
     */
    async getEpisodeById(id: number): Promise<Episode> {
        const response = await this.client.get<Episode>(`/episode/${id}`);
        return response.data;
    }

    /**
     * Update episode
     */
    async updateEpisode(episode: Episode): Promise<Episode> {
        const response = await this.client.put<Episode>(`/episode/${episode.id}`, episode);
        return response.data;
    }

    /**
     * Update multiple episodes
     */
    async updateEpisodes(episodes: Episode[]): Promise<void> {
        await this.client.put('/episode/bulk', episodes);
    }

    /**
     * Get episode files for a series
     */
    async getEpisodeFilesBySeries(seriesId: number): Promise<EpisodeFile[]> {
        const response = await this.client.get<EpisodeFile[]>('/episodefile', {
            params: { seriesId }
        });
        return response.data;
    }

    /**
     * Get episode file by ID
     */
    async getEpisodeFileById(id: number): Promise<EpisodeFile> {
        const response = await this.client.get<EpisodeFile>(`/episodefile/${id}`);
        return response.data;
    }

    /**
     * Delete episode file
     */
    async deleteEpisodeFile(id: number): Promise<void> {
        await this.client.delete(`/episodefile/${id}`);
    }

    /**
     * Get wanted/missing episodes
     */
    async getWantedMissing(params?: PaginationParams & FilterParams): Promise<PaginatedResponse<WantedEpisode>> {
        const response = await this.client.get<PaginatedResponse<WantedEpisode>>('/wanted/missing', {
            params
        });
        return response.data;
    }

    /**
     * Get wanted/cutoff unmet episodes
     */
    async getWantedCutoffUnmet(params?: PaginationParams & FilterParams): Promise<PaginatedResponse<WantedEpisode>> {
        const response = await this.client.get<PaginatedResponse<WantedEpisode>>('/wanted/cutoff', {
            params
        });
        return response.data;
    }

    // ============================================================================
    // CALENDAR ENDPOINTS
    // ============================================================================

    /**
     * Get calendar entries
     */
    async getCalendar(start?: string, end?: string, unmonitored: boolean = false): Promise<CalendarItem[]> {
        const response = await this.client.get<CalendarItem[]>('/calendar', {
            params: { start, end, unmonitored }
        });
        return response.data;
    }

    // ============================================================================
    // QUEUE ENDPOINTS
    // ============================================================================

    /**
     * Get download queue
     */
    async getQueue(params?: PaginationParams & {
        includeUnknownSeriesItems?: boolean;
        includeSeries?: boolean;
        includeEpisode?: boolean;
    }): Promise<PaginatedResponse<QueueItem>> {
        const response = await this.client.get<PaginatedResponse<QueueItem>>('/queue', {
            params
        });
        return response.data;
    }

    /**
     * Remove item from queue
     */
    async removeFromQueue(id: number, removeFromClient: boolean = true, blocklist: boolean = false): Promise<void> {
        await this.client.delete(`/queue/${id}`, {
            params: { removeFromClient, blocklist }
        });
    }

    /**
     * Get queue details
     */
    async getQueueDetails(params?: PaginationParams & {
        includeUnknownSeriesItems?: boolean;
        includeSeries?: boolean;
        includeEpisode?: boolean;
    }): Promise<PaginatedResponse<QueueItem>> {
        const response = await this.client.get<PaginatedResponse<QueueItem>>('/queue/details', {
            params
        });
        return response.data;
    }

    // ============================================================================
    // HISTORY ENDPOINTS
    // ============================================================================

    /**
     * Get history
     */
    async getHistory(params?: PaginationParams & {
        episodeId?: number;
        seriesId?: number;
        eventType?: string;
        includeEpisode?: boolean;
        includeSeries?: boolean;
    }): Promise<PaginatedResponse<HistoryItem>> {
        const response = await this.client.get<PaginatedResponse<HistoryItem>>('/history', {
            params
        });
        return response.data;
    }

    /**
     * Get history for series
     */
    async getHistoryBySeries(seriesId: number, params?: PaginationParams): Promise<PaginatedResponse<HistoryItem>> {
        const response = await this.client.get<PaginatedResponse<HistoryItem>>('/history/series', {
            params: { seriesId, ...params }
        });
        return response.data;
    }

    // ============================================================================
    // ACTIVITY ENDPOINTS
    // ============================================================================

    /**
     * Get current activity
     */
    async getActivity(): Promise<Activity> {
        const response = await this.client.get<Activity>('/activity');
        return response.data;
    }

    // ============================================================================
    // SEARCH ENDPOINTS
    // ============================================================================

    /**
     * Search for episodes
     */
    async searchEpisodes(episodeIds: number[]): Promise<void> {
        await this.client.post('/command', {
            name: 'EpisodeSearch',
            episodeIds
        });
    }

    /**
     * Search for missing episodes of a series
     */
    async searchSeriesMissing(seriesId: number): Promise<void> {
        await this.client.post('/command', {
            name: 'SeriesSearch',
            seriesId
        });
    }

    /**
     * Search for all missing episodes
     */
    async searchAllMissing(): Promise<void> {
        await this.client.post('/command', {
            name: 'MissingEpisodeSearch'
        });
    }

    /**
     * Get available releases for episode
     */
    async getReleases(episodeId: number): Promise<Release[]> {
        const response = await this.client.get<Release[]>('/release', {
            params: { episodeId }
        });
        return response.data;
    }

    /**
     * Download release
     */
    async downloadRelease(guid: string, indexerId: number): Promise<void> {
        await this.client.post('/release', { guid, indexerId });
    }

    // ============================================================================
    // PROFILE ENDPOINTS
    // ============================================================================

    /**
     * Get all quality profiles
     */
    async getQualityProfiles(): Promise<QualityProfile[]> {
        const response = await this.client.get<QualityProfile[]>('/qualityprofile');
        return response.data;
    }

    /**
     * Get quality profile by ID
     */
    async getQualityProfileById(id: number): Promise<QualityProfile> {
        const response = await this.client.get<QualityProfile>(`/qualityprofile/${id}`);
        return response.data;
    }

    /**
     * Create quality profile
     */
    async createQualityProfile(profile: Omit<QualityProfile, 'id'>): Promise<QualityProfile> {
        const response = await this.client.post<QualityProfile>('/qualityprofile', profile);
        return response.data;
    }

    /**
     * Update quality profile
     */
    async updateQualityProfile(profile: QualityProfile): Promise<QualityProfile> {
        const response = await this.client.put<QualityProfile>(`/qualityprofile/${profile.id}`, profile);
        return response.data;
    }

    /**
     * Delete quality profile
     */
    async deleteQualityProfile(id: number): Promise<void> {
        await this.client.delete(`/qualityprofile/${id}`);
    }

    /**
     * Get all language profiles
     */
    async getLanguageProfiles(): Promise<LanguageProfile[]> {
        const response = await this.client.get<LanguageProfile[]>('/languageprofile');
        return response.data;
    }

    /**
     * Get language profile by ID
     */
    async getLanguageProfileById(id: number): Promise<LanguageProfile> {
        const response = await this.client.get<LanguageProfile>(`/languageprofile/${id}`);
        return response.data;
    }

    /**
     * Get all custom formats
     */
    async getCustomFormats(): Promise<CustomFormat[]> {
        const response = await this.client.get<CustomFormat[]>('/customformat');
        return response.data;
    }

    /**
     * Get custom format by ID
     */
    async getCustomFormatById(id: number): Promise<CustomFormat> {
        const response = await this.client.get<CustomFormat>(`/customformat/${id}`);
        return response.data;
    }

    /**
     * Create custom format
     */
    async createCustomFormat(format: Omit<CustomFormat, 'id'>): Promise<CustomFormat> {
        const response = await this.client.post<CustomFormat>('/customformat', format);
        return response.data;
    }

    /**
     * Update custom format
     */
    async updateCustomFormat(format: CustomFormat): Promise<CustomFormat> {
        const response = await this.client.put<CustomFormat>(`/customformat/${format.id}`, format);
        return response.data;
    }

    /**
     * Delete custom format
     */
    async deleteCustomFormat(id: number): Promise<void> {
        await this.client.delete(`/customformat/${id}`);
    }

    // ============================================================================
    // ROOT FOLDER ENDPOINTS
    // ============================================================================

    /**
     * Get all root folders
     */
    async getRootFolders(): Promise<RootFolder[]> {
        const response = await this.client.get<RootFolder[]>('/rootfolder');
        return response.data;
    }

    /**
     * Add root folder
     */
    async addRootFolder(path: string): Promise<RootFolder> {
        const response = await this.client.post<RootFolder>('/rootfolder', { path });
        return response.data;
    }

    /**
     * Delete root folder
     */
    async deleteRootFolder(id: number): Promise<void> {
        await this.client.delete(`/rootfolder/${id}`);
    }

    // ============================================================================
    // INDEXER ENDPOINTS
    // ============================================================================

    /**
     * Get all indexers
     */
    async getIndexers(): Promise<Indexer[]> {
        const response = await this.client.get<Indexer[]>('/indexer');
        return response.data;
    }

    /**
     * Get indexer by ID
     */
    async getIndexerById(id: number): Promise<Indexer> {
        const response = await this.client.get<Indexer>(`/indexer/${id}`);
        return response.data;
    }

    /**
     * Test indexer
     */
    async testIndexer(indexer: Partial<Indexer>): Promise<void> {
        await this.client.post('/indexer/test', indexer);
    }

    // ============================================================================
    // DOWNLOAD CLIENT ENDPOINTS
    // ============================================================================

    /**
     * Get all download clients
     */
    async getDownloadClients(): Promise<DownloadClient[]> {
        const response = await this.client.get<DownloadClient[]>('/downloadclient');
        return response.data;
    }

    /**
     * Get download client by ID
     */
    async getDownloadClientById(id: number): Promise<DownloadClient> {
        const response = await this.client.get<DownloadClient>(`/downloadclient/${id}`);
        return response.data;
    }

    /**
     * Test download client
     */
    async testDownloadClient(client: Partial<DownloadClient>): Promise<void> {
        await this.client.post('/downloadclient/test', client);
    }

    // ============================================================================
    // TAG ENDPOINTS
    // ============================================================================

    /**
     * Get all tags
     */
    async getTags(): Promise<Tag[]> {
        const response = await this.client.get<Tag[]>('/tag');
        return response.data;
    }

    /**
     * Create tag
     */
    async createTag(label: string): Promise<Tag> {
        const response = await this.client.post<Tag>('/tag', { label });
        return response.data;
    }

    /**
     * Delete tag
     */
    async deleteTag(id: number): Promise<void> {
        await this.client.delete(`/tag/${id}`);
    }

    // ============================================================================
    // COMMAND ENDPOINTS
    // ============================================================================

    /**
     * Refresh series information
     */
    async refreshSeries(seriesId?: number): Promise<void> {
        await this.client.post('/command', {
            name: seriesId ? 'RefreshSeries' : 'RefreshAllSeries',
            ...(seriesId && { seriesId })
        });
    }

    /**
     * Rescan series for files
     */
    async rescanSeries(seriesId?: number): Promise<void> {
        await this.client.post('/command', {
            name: seriesId ? 'RescanSeries' : 'RescanAllSeries',
            ...(seriesId && { seriesId })
        });
    }

    /**
     * Rename series files
     */
    async renameSeries(seriesIds: number[]): Promise<void> {
        await this.client.post('/command', {
            name: 'RenameSeries',
            seriesIds
        });
    }

    /**
     * Backup database
     */
    async backupDatabase(): Promise<void> {
        await this.client.post('/command', {
            name: 'Backup'
        });
    }
}