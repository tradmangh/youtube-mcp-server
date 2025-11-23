import { google } from 'googleapis';
import { PlaylistParams, PlaylistItemsParams, SearchParams } from '../types.js';
import { AuthManager } from '../auth.js';

/**
 * Service for interacting with YouTube playlists
 */
export class PlaylistService {
  private youtube;
  private initialized = false;
  private authManager: AuthManager;

  constructor() {
    this.authManager = AuthManager.getInstance();
  }

  /**
   * Initialize the YouTube client only when needed
   */
  private async initialize() {
    if (this.initialized) return;
    
    await this.authManager.initialize();
    const auth = this.authManager.getAuth();

    this.youtube = google.youtube({
      version: "v3",
      auth: auth
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
      await this.initialize();
      
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
      await this.initialize();
      
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
      await this.initialize();
      
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
   * List playlists owned by the authenticated user (requires OAuth)
   */
  async getMyPlaylists({ 
    maxResults = 50 
  }: { maxResults?: number } = {}): Promise<any[]> {
    try {
      await this.initialize();
      
      if (this.authManager.getAuthMode() !== 'oauth') {
        throw new Error('This operation requires OAuth authentication. Please configure OAuth credentials.');
      }
      
      const response = await this.youtube.playlists.list({
        part: ['snippet', 'contentDetails', 'status'],
        mine: true,
        maxResults
      });
      
      return response.data.items || [];
    } catch (error) {
      throw new Error(`Failed to get user playlists: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}