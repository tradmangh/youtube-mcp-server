import { google } from 'googleapis';
import { PlaylistParams, PlaylistItemsParams, SearchParams, MergePlaylistsParams } from '../types.js';

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
   * Merge multiple playlists into a target playlist
   * Returns a detailed report of the merge operation
   */
  async mergePlaylists({
    sourcePlaylists,
    targetPlaylist,
    dedupe = false
  }: MergePlaylistsParams): Promise<any> {
    try {
      this.initialize();

      // Validate inputs
      if (!sourcePlaylists || sourcePlaylists.length === 0) {
        throw new Error('At least one source playlist is required');
      }
      if (!targetPlaylist) {
        throw new Error('Target playlist is required');
      }

      const report: any = {
        sourcePlaylists: [],
        targetPlaylist: targetPlaylist,
        totalItemsProcessed: 0,
        uniqueItems: 0,
        duplicatesRemoved: 0,
        errors: []
      };

      // Fetch all items from source playlists
      const allItems: any[] = [];
      const videoIdSet = new Set<string>();

      for (const playlistId of sourcePlaylists) {
        try {
          // Fetch all items from this playlist (may need pagination for large playlists)
          const items = await this.getAllPlaylistItems(playlistId);
          
          const sourceReport = {
            playlistId: playlistId,
            itemCount: items.length,
            itemsAdded: 0,
            duplicatesSkipped: 0
          };

          for (const item of items) {
            const videoId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
            
            if (!videoId) {
              report.errors.push({
                playlistId: playlistId,
                error: 'Missing videoId for item',
                itemId: item.id
              });
              continue;
            }

            report.totalItemsProcessed++;

            if (dedupe && videoIdSet.has(videoId)) {
              sourceReport.duplicatesSkipped++;
              report.duplicatesRemoved++;
            } else {
              allItems.push({
                videoId: videoId,
                title: item.snippet?.title,
                sourcePlaylistId: playlistId,
                position: item.snippet?.position
              });
              videoIdSet.add(videoId);
              sourceReport.itemsAdded++;
            }
          }

          report.sourcePlaylists.push(sourceReport);
        } catch (error) {
          report.errors.push({
            playlistId: playlistId,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      report.uniqueItems = allItems.length;

      // Get target playlist info
      try {
        const targetInfo = await this.getPlaylist({ playlistId: targetPlaylist });
        report.targetPlaylistInfo = {
          title: targetInfo?.snippet?.title,
          description: targetInfo?.snippet?.description,
          itemCount: targetInfo?.contentDetails?.itemCount
        };
      } catch (error) {
        report.errors.push({
          playlistId: targetPlaylist,
          error: `Failed to fetch target playlist: ${error instanceof Error ? error.message : String(error)}`
        });
      }

      // Return the merge report with items that would be added
      report.itemsToMerge = allItems;
      report.summary = `Processed ${report.totalItemsProcessed} items from ${sourcePlaylists.length} source playlist(s). ` +
                       `${report.uniqueItems} unique items ready to merge into target playlist.` +
                       (dedupe ? ` ${report.duplicatesRemoved} duplicates removed.` : '');

      return report;
    } catch (error) {
      throw new Error(`Failed to merge playlists: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Helper method to fetch all items from a playlist (handles pagination)
   */
  private async getAllPlaylistItems(playlistId: string): Promise<any[]> {
    const allItems: any[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const response = await this.youtube.playlistItems.list({
        part: ['snippet', 'contentDetails'],
        playlistId,
        maxResults: 50,
        pageToken
      });

      if (response.data.items) {
        allItems.push(...response.data.items);
      }

      pageToken = response.data.nextPageToken;
    } while (pageToken);

    return allItems;
  }
}