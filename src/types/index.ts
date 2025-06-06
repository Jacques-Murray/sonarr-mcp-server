/**
 * Common type definitions for the Sonarr MCP Server
 */

/**
 * MCP Tool result content types
 */
export interface TextContent {
    type: 'text';
    text: string;
}

export interface JsonContent {
    type: 'json';
    json: any;
}

export type Content = TextContent | JsonContent;

/**
 * MCP Tool result
 */
export interface ToolResult {
    content: Content[];
    isError?: boolean;
}

/**
 * MCP Resource content
 */
export interface ResourceContent {
    uri: string;
    mimeType: string;
    text?: string;
    blob?: string;
}

/**
 * MCP Resource result
 */
export interface ResourceResult {
    contents: ResourceContent[];
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
    page?: number;
    pageSize?: number;
    sortKey?: string;
    sortDirection?: 'ascending' | 'descending';
}

/**
 * Common filter parameters
 */
export interface FilterParams {
    term?: string;
    monitored?: boolean;
    status?: string;
}

/**
 * Error details for enhanced error reporting
 */
export interface ErrorDetails {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    correlationId?: string;
}

/**
 * Sonarr monitoring options
 */
export type MonitoringType = 'all' | 'future' | 'missing' | 'existing' | 'none';

/**
 * Quality profile information
 */
export interface QualityProfile {
    id: number;
    name: string;
    upgradeAllowed: boolean;
    cutoff: number;
    items: QualityProfileItem[];
}

export interface QualityProfileItem {
    quality?: {
        id: number;
        name: string;
        source: string;
        resolution: number;
    };
    items?: QualityProfileItem[];
    allowed: boolean;
}

/**
 * Language profile information
 */
export interface LanguageProfile {
    id: number;
    name: string;
    upgradeAllowed: boolean;
    cutoff: {
        id: number;
        name: string;
    };
    languages: LanguageProfileItem[];
}

export interface LanguageProfileItem {
    language: {
        id: number;
        name: string;
    };
    allowed: boolean;
}

/**
 * Root folder information
 */
export interface RootFolder {
    id: number;
    path: string;
    accessible: boolean;
    freeSpace: number;
    unmappedFolders: UnmappedFolder[];
}

export interface UnmappedFolder {
    name: string;
    path: string;
}

/**
 * Sonarr Series information
 */
export interface Series {
    id: number;
    title: string;
    alternateTitles: AlternateTitle[];
    sortTitle: string;
    seasonCount: number;
    totalEpisodeCount: number;
    episodeCount: number;
    episodeFileCount: number;
    sizeOnDisk: number;
    status: SeriesStatus;
    overview: string;
    previousAiring?: string;
    nextAiring?: string;
    network: string;
    airTime: string;
    images: MediaCover[];
    seasons: Season[];
    year: number;
    path: string;
    profileId: number;
    languageProfileId: number;
    seasonFolder: boolean;
    monitored: boolean;
    useSceneNumbering: boolean;
    runtime: number;
    tvdbId: number;
    tvRageId: number;
    tvMazeId: number;
    firstAired?: string;
    lastInfoSync?: string;
    seriesType: SeriesType;
    cleanTitle: string;
    imdbId: string;
    titleSlug: string;
    certification: string;
    genres: string[];
    tags: number[];
    added: string;
    ratings: Ratings;
    qualityProfileId: number;
    rootFolderPath?: string;
    addOptions?: AddSeriesOptions;
}

export interface AlternateTitle {
    title: string;
    seasonNumber?: number;
    sceneSeasonNumber?: number;
    sceneOrigin?: string;
    comment?: string;
}

export type SeriesStatus = 'continuing' | 'ended' | 'upcoming' | 'deleted';
export type SeriesType = 'standard' | 'daily' | 'anime';

export interface MediaCover {
    coverType: CoverType;
    url: string;
    remoteUrl: string;
}

export type CoverType = 'poster' | 'banner' | 'fanart' | 'screenshot' | 'headshot' | 'clearlogo';

export interface Season {
    seasonNumber: number;
    monitored: boolean;
    statistics?: SeasonStatistics;
}

export interface SeasonStatistics {
    episodeFileCount: number;
    episodeCount: number;
    totalEpisodeCount: number;
    sizeOnDisk: number;
    percentOfEpisodes: number;
    previousAiring?: string;
    nextAiring?: string;
}

export interface Ratings {
    votes: number;
    value: number;
}

export interface AddSeriesOptions {
    ignoreEpisodesWithFiles?: boolean;
    ignoreEpisodesWithoutFiles?: boolean;
    monitor?: MonitoringType;
    searchForMissingEpisodes?: boolean;
    searchForCutoffUnmetEpisodes?: boolean;
}

/**
 * Episode information
 */
export interface Episode {
    id: number;
    seriesId: number;
    tvdbId: number;
    episodeFileId: number;
    seasonNumber: number;
    episodeNumber: number;
    title: string;
    airDate?: string;
    airDateUtc?: string;
    overview: string;
    hasFile: boolean;
    monitored: boolean;
    absoluteEpisodeNumber?: number;
    sceneAbsoluteEpisodeNumber?: number;
    sceneEpisodeNumber?: number;
    sceneSeasonNumber?: number;
    unverifiedSceneNumbering: boolean;
    ratings: Ratings;
    images: MediaCover[];
    series?: Series;
    episodeFile?: EpisodeFile;
    grabbed?: boolean;
}

export interface EpisodeFile {
    id: number;
    seriesId: number;
    seasonNumber: number;
    relativePath: string;
    path: string;
    size: number;
    dateAdded: string;
    sceneName?: string;
    releaseGroup?: string;
    quality: QualityModel;
    customFormats: CustomFormat[];
    indexerFlags: number;
    mediaInfo?: MediaInfo;
    originalFilePath?: string;
    qualityCutoffNotMet: boolean;
    customFormatScore: number;
}

export interface QualityModel {
    quality: Quality;
    revision: QualityRevision;
}

export interface Quality {
    id: number;
    name: string;
    source: string;
    resolution: number;
}

export interface QualityRevision {
    version: number;
    real: number;
    isRepack: boolean;
}

export interface CustomFormat {
    id: number;
    name: string;
    includeCustomFormatWhenRenaming?: boolean;
    specifications: CustomFormatSpecification[];
}

export interface CustomFormatSpecification {
    name: string;
    implementation: string;
    implementationName: string;
    infoLink?: string;
    negate: boolean;
    required: boolean;
    fields: CustomFormatField[];
}

export interface CustomFormatField {
    order: number;
    name: string;
    label: string;
    value: any;
    type: string;
    advanced: boolean;
}

export interface MediaInfo {
    audioChannels: number;
    audioCodec: string;
    audioLanguages: string[];
    height: number;
    width: number;
    resolution: string;
    runTime: string;
    scanType: string;
    subtitles: string[];
    videoCodec: string;
    videoDynamicRange: string;
    videoDynamicRangeType: string;
}

/**
 * Queue information
 */
export interface QueueItem {
    id: number;
    seriesId: number;
    episodeId: number;
    series: Series;
    episode: Episode;
    quality: QualityModel;
    customFormats: CustomFormat[];
    size: number;
    title: string;
    sizeleft: number;
    timeleft?: string;
    estimatedCompletionTime?: string;
    status: string;
    trackedDownloadStatus: string;
    trackedDownloadState: string;
    statusMessages: QueueStatusMessage[];
    errorMessage?: string;
    downloadId: string;
    protocol: DownloadProtocol;
    downloadClient: string;
    indexer: string;
    outputPath?: string;
    downloadClientHasPostImportCategory: boolean;
}

export interface QueueStatusMessage {
    title: string;
    messages: string[];
}

export type DownloadProtocol = 'unknown' | 'usenet' | 'torrent';

/**
 * History information
 */
export interface HistoryItem {
    id: number;
    episodeId: number;
    seriesId: number;
    sourceTitle: string;
    quality: QualityModel;
    customFormats: CustomFormat[];
    qualityCutoffNotMet: boolean;
    customFormatScore: number;
    date: string;
    downloadId?: string;
    eventType: HistoryEventType;
    data: Record<string, string>;
    episode: Episode;
    series: Series;
}

export type HistoryEventType = 'grabbed' | 'seriesFolderImported' | 'downloadFolderImported' |
    'downloadFailed' | 'episodeFileDeleted' | 'episodeFileRenamed' | 'downloadIgnored';

/**
 * Calendar information
 */
export interface CalendarItem {
    id: number;
    seriesId: number;
    episodeFileId: number;
    seasonNumber: number;
    episodeNumber: number;
    title: string;
    airDate: string;
    airDateUtc: string;
    overview: string;
    hasFile: boolean;
    monitored: boolean;
    absoluteEpisodeNumber?: number;
    series: Series;
    images: MediaCover[];
}

/**
 * System information
 */
export interface SystemStatus {
    version: string;
    buildTime: string;
    isDebug: boolean;
    isProduction: boolean;
    isAdmin: boolean;
    isUserInteractive: boolean;
    startupPath: string;
    appData: string;
    osName: string;
    osVersion: string;
    isMonoRuntime: boolean;
    isMono: boolean;
    isLinux: boolean;
    isOsx: boolean;
    isWindows: boolean;
    mode: string;
    branch: string;
    authentication: string;
    sqliteVersion: string;
    migrationVersion: number;
    urlBase: string;
    runtimeVersion: string;
    runtimeName: string;
    startTime: string;
}

export interface DiskSpace {
    path: string;
    label: string;
    freeSpace: number;
    totalSpace: number;
}

/**
 * Indexer information
 */
export interface Indexer {
    id: number;
    name: string;
    implementation: string;
    implementationName: string;
    infoLink: string;
    settings: IndexerSettings;
    configContract: string;
    enable: boolean;
    priority: number;
    supportsRss: boolean;
    supportsSearch: boolean;
    protocol: DownloadProtocol;
    tags: number[];
}

export interface IndexerSettings {
    baseUrl?: string;
    apiKey?: string;
    apiPath?: string;
    categories?: number[];
    animeCategories?: number[];
    additionalParameters?: string;
    multiLanguages?: number[];
    removeYear?: boolean;
    searchByTitle?: boolean;
}

/**
 * Download Client information
 */
export interface DownloadClient {
    id: number;
    name: string;
    implementation: string;
    implementationName: string;
    infoLink: string;
    settings: DownloadClientSettings;
    configContract: string;
    enable: boolean;
    protocol: DownloadProtocol;
    priority: number;
    removeCompletedDownloads: boolean;
    removeFailedDownloads: boolean;
    tags: number[];
}

export interface DownloadClientSettings {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    category?: string;
    recentTvPriority?: string;
    olderTvPriority?: string;
    addPaused?: boolean;
    useSsl?: boolean;
}

/**
 * TVDB Search Results
 */
export interface TvdbSearchResult {
    tvdbId: number;
    title: string;
    titleSlug: string;
    year?: number;
    firstAired?: string;
    network?: string;
    runtime?: number;
    genres?: string[];
    overview?: string;
    images: MediaCover[];
    remotePoster?: string;
    seasons?: TvdbSeason[];
}

export interface TvdbSeason {
    seasonNumber: number;
    monitored: boolean;
}

/**
 * Release information
 */
export interface Release {
    guid: string;
    quality: QualityModel;
    customFormats: CustomFormat[];
    qualityWeight: number;
    age: number;
    ageHours: number;
    ageMinutes: number;
    size: number;
    indexerId: number;
    indexer: string;
    releaseGroup?: string;
    subGroup?: string;
    releaseHash?: string;
    title: string;
    sceneSource: boolean;
    seasonSearchMaximumSingleEpisodeAge: number;
    episodeId?: number;
    seriesId?: number;
    approved: boolean;
    temporarilyRejected: boolean;
    rejected: boolean;
    rejections: string[];
    publishDate: string;
    commentUrl?: string;
    downloadUrl?: string;
    infoUrl?: string;
    downloadAllowed: boolean;
    releaseWeight: number;
    customFormatScore: number;
    sceneMapping?: SceneMapping;
    languages: Language[];
    indexerFlags: string[];
}

export interface SceneMapping {
    title: string;
    searchTerm: string;
    seasonNumber?: number;
    sceneSeasonNumber?: number;
}

export interface Language {
    id: number;
    name: string;
}

/**
 * Activity information
 */
export interface Activity {
    series: ActivitySeries[];
    episodes: ActivityEpisode[];
    commands: Command[];
}

export interface ActivitySeries {
    seriesId: number;
    title: string;
    added: string;
}

export interface ActivityEpisode {
    episodeId: number;
    seriesId: number;
    episodeTitle: string;
    seriesTitle: string;
    airDate: string;
}

export interface Command {
    id: number;
    name: string;
    commandName: string;
    message?: string;
    body: CommandBody;
    priority: CommandPriority;
    status: CommandStatus;
    queued: string;
    started?: string;
    ended?: string;
    duration?: string;
    trigger: CommandTrigger;
    stateChangeTime: string;
    sendUpdatesToClient: boolean;
    updateScheduledTask: boolean;
    lastExecutionTime?: string;
}

export interface CommandBody {
    sendUpdatesToClient: boolean;
    updateScheduledTask: boolean;
    completionMessage?: string;
    requiresDiskAccess: boolean;
    isExclusive: boolean;
    isTypeExclusive: boolean;
    isLongRunning: boolean;
    name: string;
    lastExecutionTime?: string;
    lastStartTime?: string;
    trigger: CommandTrigger;
    suppressMessages: boolean;
}

export type CommandPriority = 'low' | 'normal' | 'high';
export type CommandStatus = 'queued' | 'started' | 'completed' | 'failed' | 'aborted' | 'cancelled' | 'orphaned';
export type CommandTrigger = 'unspecified' | 'manual' | 'scheduled';

/**
 * Tag information
 */
export interface Tag {
    id: number;
    label: string;
}

/**
 * Wanted/Missing episodes
 */
export interface WantedEpisode {
    id: number;
    seriesId: number;
    episodeFileId: number;
    seasonNumber: number;
    episodeNumber: number;
    title: string;
    airDate?: string;
    airDateUtc?: string;
    overview: string;
    hasFile: boolean;
    monitored: boolean;
    series: Series;
    images: MediaCover[];
}

/**
 * Pagination response wrapper
 */
export interface PaginatedResponse<T> {
    page: number;
    pageSize: number;
    sortKey: string;
    sortDirection: string;
    totalRecords: number;
    records: T[];
}