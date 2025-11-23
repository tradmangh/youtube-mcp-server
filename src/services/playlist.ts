import { google } from 'googleapis';
import { PlaylistParams, PlaylistItemsParams, PlaylistItemsSinceParams, SearchParams } from '../types.js';

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
   * Get playlist items added after a specific timestamp
   */
  async getPlaylistItemsSince({ 
    playlistId, 
    since 
  }: PlaylistItemsSinceParams): Promise<any[]> {
    try {
      this.initialize();
      
      // Validate the ISO-8601 timestamp
      const sinceDate = new Date(since);
      if (isNaN(sinceDate.getTime())) {
        throw new Error(`Invalid timestamp format: '${since}'. Expected ISO-8601 format (e.g., '2024-01-01T00:00:00Z')`);
      }
      
      // Fetch all playlist items (we'll filter them)
      // Note: YouTube API doesn't support filtering by date directly, so we need to fetch and filter
      const response = await this.youtube.playlistItems.list({
        part: ['snippet', 'contentDetails', 'status'],
        playlistId,
        maxResults: 50 // Fetch more items to increase chances of finding recent ones
      });
      
      const items = response.data.items || [];
      
      // Filter items where publishedAt (addedAt) is strictly greater than since
      const filteredItems = items.filter((item: any) => {
        const publishedAt = item.snippet?.publishedAt;
        if (!publishedAt) return false;
        
        const itemDate = new Date(publishedAt);
        return itemDate.getTime() > sinceDate.getTime();
      });
      
      // Return compact item shape
      return filteredItems.map((item: any) => ({
        id: item.id,
        playlistId: item.snippet?.playlistId,
        videoId: item.snippet?.resourceId?.videoId,
        title: item.snippet?.title,
        description: item.snippet?.description,
        position: item.snippet?.position,
        addedAt: item.snippet?.publishedAt
      }));
    } catch (error) {
      throw new Error(`Failed to get playlist items since: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}