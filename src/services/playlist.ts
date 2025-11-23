import { google } from 'googleapis';
import { 
  PlaylistParams, 
  PlaylistItemsParams, 
  SearchParams, 
  FindUnavailableVideosParams, 
  RemoveUnavailableVideosParams,
  FindUnavailableVideosResult,
  RemoveUnavailableVideosResult,
  UnavailableVideoItem,
  RemovalResult
} from '../types.js';

/**
 * Service for interacting with YouTube playlists
 */
export class PlaylistService {
  private youtube;
  private initialized = false;

  constructor() {
    // Don't initialize in constructor
  }

  /**
   * Initialize the YouTube client only when needed
   */
  private initialize() {
    if (this.initialized) return;
    
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY environment variable is not set.');
    }

    this.youtube = google.youtube({
      version: "v3",
      auth: apiKey
    });
    
    this.initialized = true;
  }

  /**
   * Get information about a YouTube playlist
   */
  async getPlaylist({ 
    playlistId 
  }: PlaylistParams): Promise<any> {
    try {
      this.initialize();
      
      const response = await this.youtube.playlists.list({
        part: ['snippet', 'contentDetails'],
        id: [playlistId]
      });
      
      return response.data.items?.[0] || null;
    } catch (error) {
      throw new Error(`Failed to get playlist: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get videos in a YouTube playlist
   */
  async getPlaylistItems({ 
    playlistId, 
    maxResults = 50 
  }: PlaylistItemsParams): Promise<any[]> {
    try {
      this.initialize();
      
      const response = await this.youtube.playlistItems.list({
        part: ['snippet', 'contentDetails'],
        playlistId,
        maxResults
      });
      
      return response.data.items || [];
    } catch (error) {
      throw new Error(`Failed to get playlist items: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search for playlists on YouTube
   */
  async searchPlaylists({ 
    query, 
    maxResults = 10 
  }: SearchParams): Promise<any[]> {
    try {
      this.initialize();
      
      const response = await this.youtube.search.list({
        part: ['snippet'],
        q: query,
        maxResults,
        type: ['playlist']
      });
      
      return response.data.items || [];
    } catch (error) {
      throw new Error(`Failed to search playlists: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find unavailable videos in a playlist
   * Returns playlist items that are deleted, private, or otherwise unavailable
   */
  async findUnavailableVideos({ 
    playlistId, 
    maxResults = 50 
  }: FindUnavailableVideosParams): Promise<FindUnavailableVideosResult> {
    try {
      this.initialize();
      
      const response = await this.youtube.playlistItems.list({
        part: ['snippet', 'contentDetails', 'status'],
        playlistId,
        maxResults
      });
      
      const items = response.data.items || [];
      const unavailableItems = items.filter((item: any) => {
        // Check if video is private or deleted
        const privacyStatus = item.status?.privacyStatus;
        const title = item.snippet?.title;
        
        // Videos that are deleted or private show specific patterns:
        // 1. Title is "Deleted video" or "Private video"
        // 2. Privacy status is 'private' or 'privacyStatusUnspecified'
        // 3. Thumbnail URLs are missing or default
        const isDeletedOrPrivate = 
          title === 'Deleted video' || 
          title === 'Private video' ||
          privacyStatus === 'private' ||
          privacyStatus === 'privacyStatusUnspecified';
        
        return isDeletedOrPrivate;
      });
      
      return {
        playlistId,
        totalItems: items.length,
        unavailableCount: unavailableItems.length,
        unavailableItems: unavailableItems.map((item: any): UnavailableVideoItem => ({
          id: item.id,
          title: item.snippet?.title || '',
          videoId: item.snippet?.resourceId?.videoId || '',
          privacyStatus: item.status?.privacyStatus || '',
          position: item.snippet?.position || 0
        }))
      };
    } catch (error) {
      throw new Error(`Failed to find unavailable videos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Remove unavailable videos from a playlist
   * Deletes the specified playlist items
   */
  async removeUnavailableVideos({ 
    playlistId, 
    playlistItemIds 
  }: RemoveUnavailableVideosParams): Promise<RemoveUnavailableVideosResult> {
    try {
      this.initialize();
      
      if (!playlistItemIds || playlistItemIds.length === 0) {
        return {
          playlistId,
          totalAttempted: 0,
          removedCount: 0,
          failedCount: 0,
          results: []
        };
      }
      
      const results: RemovalResult[] = [];
      let successCount = 0;
      let failureCount = 0;
      
      // Remove each playlist item
      for (const itemId of playlistItemIds) {
        try {
          await this.youtube.playlistItems.delete({
            id: itemId
          });
          results.push({
            itemId,
            status: 'removed',
            success: true
          });
          successCount++;
        } catch (error) {
          results.push({
            itemId,
            status: 'failed',
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
          failureCount++;
        }
      }
      
      return {
        playlistId,
        totalAttempted: playlistItemIds.length,
        removedCount: successCount,
        failedCount: failureCount,
        results
      };
    } catch (error) {
      throw new Error(`Failed to remove unavailable videos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}