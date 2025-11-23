/**
 * Video details parameters
 */
export interface VideoParams {
  videoId: string;
  parts?: string[];
}

/**
 * Search videos parameters
 */
export interface SearchParams {
  query: string;
  maxResults?: number;
}

/**
 * Trending videos parameters
 */
export interface TrendingParams {
  regionCode?: string;
  maxResults?: number;
  videoCategoryId?: string;
}

/**
 * Related videos parameters
 */
export interface RelatedVideosParams {
  videoId: string;
  maxResults?: number;
}

/**
 * Transcript parameters
 */
export interface TranscriptParams {
  videoId: string;
  language?: string;
}

/**
 * Search transcript parameters
 */
export interface SearchTranscriptParams {
  videoId: string;
  query: string;
  language?: string;
}

/**
 * Channel parameters
 */
export interface ChannelParams {
  channelId: string;
}

/**
 * Channel videos parameters
 */
export interface ChannelVideosParams {
  channelId: string;
  maxResults?: number;
}

/**
 * Playlist parameters
 */
export interface PlaylistParams {
  playlistId: string;
}

/**
 * Playlist items parameters
 */
export interface PlaylistItemsParams {
  playlistId: string;
  maxResults?: number;
}

/**
 * Merge playlists parameters
 */
export interface MergePlaylistsParams {
  sourcePlaylists: string[];
  targetPlaylist: string;
  dedupe?: boolean;
}

/**
 * Merge report for a single source playlist
 */
export interface SourcePlaylistReport {
  playlistId: string;
  itemCount: number;
  itemsAdded: number;
  duplicatesSkipped: number;
}

/**
 * Error information in merge report
 */
export interface MergeError {
  playlistId: string;
  error: string;
  itemId?: string;
}

/**
 * Target playlist information
 */
export interface TargetPlaylistInfo {
  title?: string;
  description?: string;
  itemCount?: number;
}

/**
 * Item to be merged
 */
export interface MergeItem {
  videoId: string;
  title?: string;
  sourcePlaylistId: string;
  position?: number;
}

/**
 * Complete merge playlists report
 */
export interface MergePlaylistsReport {
  sourcePlaylists: SourcePlaylistReport[];
  targetPlaylist: string;
  totalItemsProcessed: number;
  uniqueItems: number;
  duplicatesRemoved: number;
  errors: MergeError[];
  targetPlaylistInfo?: TargetPlaylistInfo;
  itemsToMerge: MergeItem[];
  summary: string;
}
