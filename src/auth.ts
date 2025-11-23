import { google, Auth } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

/**
 * Token storage interface
 */
interface TokenStorage {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
}

/**
 * Authentication manager for YouTube API
 * Supports both API key and OAuth2 authentication
 */
export class AuthManager {
  private static instance: AuthManager;
  private authMode: 'api-key' | 'oauth' = 'api-key';
  private oauth2Client?: OAuth2Client;
  private apiKey?: string;
  private tokenPath?: string;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  /**
   * Initialize authentication
   * Auto-detects whether to use API key or OAuth based on environment variables
   */
  public async initialize(): Promise<void> {
    const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
    const redirectUri = process.env.YOUTUBE_OAUTH_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob';
    
    // Check if OAuth credentials are provided
    if (clientId && clientSecret) {
      this.authMode = 'oauth';
      await this.initializeOAuth(clientId, clientSecret, redirectUri);
    } else {
      this.authMode = 'api-key';
      this.initializeApiKey();
    }
  }

  /**
   * Initialize API key authentication
   */
  private initializeApiKey(): void {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    if (!this.apiKey) {
      throw new Error('YOUTUBE_API_KEY environment variable is required when OAuth is not configured.');
    }
  }

  /**
   * Initialize OAuth2 authentication
   */
  private async initializeOAuth(clientId: string, clientSecret: string, redirectUri: string): Promise<void> {
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Set token storage path
    const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
    this.tokenPath = path.join(homeDir, '.youtube-mcp-token.json');

    // Try to load existing token
    try {
      const token = await this.loadToken();
      this.oauth2Client.setCredentials(token);
      
      // Refresh token if needed
      if (this.isTokenExpired(token)) {
        await this.refreshToken();
      }
    } catch (error) {
      // No valid token found, need to authorize
      console.log('No valid OAuth token found. Authorization required.');
      console.log('Please run the authorization flow to obtain a token.');
      
      // In a server context, we can't do interactive auth
      // The token must be obtained separately and stored
      if (process.env.YOUTUBE_OAUTH_ENABLED === 'true') {
        throw new Error(
          'OAuth is enabled but no valid token found. Please run authorization flow first. ' +
          'Set YOUTUBE_OAUTH_ENABLED=false to use API key mode.'
        );
      }
    }
  }

  /**
   * Get authorization URL for OAuth flow
   */
  public getAuthorizationUrl(): string | null {
    if (this.authMode !== 'oauth' || !this.oauth2Client) {
      return null;
    }

    const scopes = this.getScopes();
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  public async authorizeWithCode(code: string): Promise<void> {
    if (this.authMode !== 'oauth' || !this.oauth2Client) {
      throw new Error('OAuth is not configured');
    }

    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    await this.saveToken(tokens);
  }

  /**
   * Get OAuth scopes from environment or use defaults
   */
  private getScopes(): string[] {
    const scopesEnv = process.env.YOUTUBE_OAUTH_SCOPES;
    if (scopesEnv) {
      return scopesEnv.split(',').map(s => s.trim());
    }
    
    // Default scopes - readonly for safety
    return [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.force-ssl', // For playlist management
    ];
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(token: TokenStorage): boolean {
    if (!token.expiry_date) {
      return false;
    }
    // Check if token expires in the next 5 minutes
    return token.expiry_date <= Date.now() + 5 * 60 * 1000;
  }

  /**
   * Refresh OAuth token
   */
  private async refreshToken(): Promise<void> {
    if (!this.oauth2Client) {
      throw new Error('OAuth client not initialized');
    }

    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      await this.saveToken(credentials);
    } catch (error) {
      throw new Error(`Failed to refresh token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load token from storage
   */
  private async loadToken(): Promise<TokenStorage> {
    if (!this.tokenPath) {
      throw new Error('Token path not set');
    }

    try {
      const tokenData = fs.readFileSync(this.tokenPath, 'utf8');
      return JSON.parse(tokenData);
    } catch (error) {
      throw new Error('Failed to load token');
    }
  }

  /**
   * Save token to storage
   */
  private async saveToken(token: any): Promise<void> {
    if (!this.tokenPath) {
      throw new Error('Token path not set');
    }

    try {
      fs.writeFileSync(this.tokenPath, JSON.stringify(token, null, 2), { mode: 0o600 });
      console.log('Token saved successfully');
    } catch (error) {
      throw new Error(`Failed to save token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get authentication client for googleapis
   */
  public getAuth(): string | OAuth2Client {
    if (this.authMode === 'oauth' && this.oauth2Client) {
      return this.oauth2Client;
    }
    
    if (this.apiKey) {
      return this.apiKey;
    }
    
    throw new Error('Authentication not initialized');
  }

  /**
   * Get current authentication mode
   */
  public getAuthMode(): 'api-key' | 'oauth' {
    return this.authMode;
  }

  /**
   * Check if OAuth is enabled and ready
   */
  public isOAuthReady(): boolean {
    return this.authMode === 'oauth' && this.oauth2Client !== undefined;
  }

  /**
   * Interactive authorization flow (for CLI usage)
   */
  public async runInteractiveAuth(): Promise<void> {
    if (this.authMode !== 'oauth' || !this.oauth2Client) {
      throw new Error('OAuth is not configured');
    }

    const authUrl = this.getAuthorizationUrl();
    if (!authUrl) {
      throw new Error('Failed to generate authorization URL');
    }

    console.log('Authorize this app by visiting this url:', authUrl);
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve, reject) => {
      rl.question('Enter the code from that page here: ', async (code) => {
        rl.close();
        try {
          await this.authorizeWithCode(code);
          console.log('Authorization successful!');
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}
