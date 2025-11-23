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
 * Find unavailable videos parameters
 */
export interface FindUnavailableVideosParams {
  playlistId: string;
  maxResults?: number;
}

/**
 * Remove unavailable videos parameters
 */
export interface RemoveUnavailableVideosParams {
  playlistId: string;
  playlistItemIds: string[];
}

/**
 * Unavailable video item information
 */
export interface UnavailableVideoItem {
  id: string;
  title: string;
  videoId: string;
  privacyStatus: string;
  position: number;
}

/**
 * Find unavailable videos result
 */
export interface FindUnavailableVideosResult {
  playlistId: string;
  totalItems: number;
  unavailableCount: number;
  unavailableItems: UnavailableVideoItem[];
}

/**
 * Removal result for a single playlist item
 */
export interface RemovalResult {
  itemId: string;
  status: 'removed' | 'failed';
  success: boolean;
  error?: string;
}

/**
 * Remove unavailable videos result
 */
export interface RemoveUnavailableVideosResult {
  playlistId: string;
  totalAttempted: number;
  removedCount: number;
  failedCount: number;
  results: RemovalResult[];
}

/**
 * YouTube playlist item from API response (minimal subset)
 */
export interface YouTubePlaylistItem {
  id?: string;
  snippet?: {
    title?: string;
    position?: number;
    resourceId?: {
      videoId?: string;
    };
  };
  status?: {
    privacyStatus?: string;
  };
}
