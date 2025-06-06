export interface SonarrConfig {
    baseUrl: string;
    apiKey: string;
    timeout?: number;
}

export interface Series {
    id: number;
    title: string;
    titleSlug: string;
    monitored: boolean;
    seasonCount: number;
    totalEpisodeCount: number;
    episodeCount: number;
    episodeFileCount: number;
    status: string;
    overview: string;
    network: string;
    airTime: string;
    images: SeriesImage[];
    seasons: Season[];
    path: string;
    qualityProfileId: number;
    languageProfileId: number;
    seriesType: string;
    cleanTitle: string;
    imdbId: string;
    tvdbId: number;
    tvRageId: number;
    tvMazeId: number;
    firstAired: string;
    lastInfoSync: string;
    runtime: number;
    tags: number[];
    added: string;
    ratings: Ratings;
    statistics: SeriesStatistics;
}

export interface SeriesImage {
    coverType: string;
    url: string;
}

export interface Season {
    seasonNumber: number;
    monitored: boolean;
    statistics: SeasonStatistics;
}

export interface SeasonStatistics {
    episodeFileCount: number;
    episodeCount: number;
    totalEpisodeCount: number;
}

export interface Ratings {
    votes: number;
    value: number;
}

export interface SeriesStatistics {
    seasonCount: number;
    episodeFileCount: number;
    episodeCount: number;
    totalEpisodeCount: number;
    sizeOnDisk: number;
    releaseGroups: string[];
}

export interface Episode {
    id: number;
    seriesId: number;
    tvdbId: number;
    episodeFileId: number;
    seasonNumber: number;
    episodeNumber: number;
    title: string;
    airDate: string;
    airDateUtc: string;
    overview: string;
    hasFile: boolean;
    monitored: boolean;
    unverifiedSceneNumbering: boolean;
}

export interface QueueResponse {
    page: number;
    pageSize: number;
    sortKey: string;
    sortDirection: string;
    totalRecords: number;
    records: QueueItem[];
}

export interface QueueItem {
    id: number;
    seriesId: number;
    episodeId: number;
    title: string;
    size: number;
    sizeleft: number;
    estimatedCompletionTime: string;
    status: string;
    trackedDownloadStatus: string;
    statusMessages: StatusMessage[];
    downloadId: string;
    protocol: string;
    downloadClient: string;
    indexer: string;
    outputPath: string;
}

export interface StatusMessage {
    title: string;
    messages: string[];
}

export interface HistoryResponse {
    page: number;
    pageSize: number;
    sortKey: string;
    sortDirection: string;
    totalRecords: number;
    records: HistoryItem[];
}

export interface HistoryItem {
    id: number;
    episodeId: number;
    seriesId: number;
    sourceTitle: string;
    quality: Quality;
    date: string;
    eventType: string;
    data: Record<string, any>;
}

export interface Quality {
    quality: QualityDefinition;
    revision: QualityRevision;
}

export interface QualityDefinition {
    id: number;
    name: string;
}

export interface QualityRevision {
    version: number;
    real: number;
    isRepack: boolean;
}

export interface CalendarItem {
    id: number;
    seriesId: number;
    tvdbId: number;
    episodeFileId: number;
    seasonNumber: number;
    episodeNumber: number;
    title: string;
    airDate: string;
    airDateUtc: string;
    overview: string;
    hasFile: boolean;
    monitored: boolean;
    series: CalendarSeries;
}

export interface CalendarSeries {
    title: string;
    status: string;
    overview: string;
    network: string;
    images: SeriesImage[];
}

export interface CommandResponse {
    id: number;
    name: string;
    commandName: string;
    message: string;
    priority: string;
    status: string;
    queued: string;
    started: string;
    ended: string;
    duration: string;
    trigger: string;
    body?: Record<string, any>;
}