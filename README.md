# YouTube MCP Server
[![smithery badge](https://smithery.ai/badge/@ZubeidHendricks/youtube)](https://smithery.ai/server/@ZubeidHendricks/youtube)

A Model Context Protocol (MCP) server implementation for YouTube, enabling AI language models to interact with YouTube content through a standardized interface.

## Features

### Video Information
* Get video details (title, description, duration, etc.)
* List channel videos
* Get video statistics (views, likes, comments)
* Search videos across YouTube

### Transcript Management
* Retrieve video transcripts
* **NEW: `get_transcript` - Enhanced transcript access with text normalization for LLM processing**
* Support for multiple languages
* Get timestamped captions
* Search within transcripts

### Channel Management
* Get channel details
* List channel playlists
* Get channel statistics
* Search within channel content

### Playlist Management
* List playlist items
* Get playlist details
* Search within playlists
* Get playlist video transcripts
* Merge multiple playlists with deduplication support

## Installation

### Quick Setup for Claude Desktop

#### API Key Mode (Basic Features)

1. Install the package:
```bash
npm install -g zubeid-youtube-mcp-server
```

2. Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "zubeid-youtube-mcp-server": {
      "command": "zubeid-youtube-mcp-server",
      "env": {
        "YOUTUBE_API_KEY": "your_youtube_api_key_here"
      }
    }
  }
}
```

#### OAuth Mode (For Private Playlists)

1. Install the package and authorize:
```bash
npm install -g zubeid-youtube-mcp-server

# Set OAuth credentials
export YOUTUBE_OAUTH_CLIENT_ID="your_client_id"
export YOUTUBE_OAUTH_CLIENT_SECRET="your_client_secret"

# Run authorization
zubeid-youtube-mcp-server authorize
```

2. Add to your Claude Desktop configuration with OAuth credentials:

```json
{
  "mcpServers": {
    "zubeid-youtube-mcp-server": {
      "command": "zubeid-youtube-mcp-server",
      "env": {
        "YOUTUBE_OAUTH_CLIENT_ID": "your_client_id_here",
        "YOUTUBE_OAUTH_CLIENT_SECRET": "your_client_secret_here"
      }
    }
  }
}
```

**Note:** After adding OAuth credentials to config, the token file (`~/.youtube-mcp-token.json`) will be used automatically for authentication.

### Alternative: Using NPX (No Installation Required)

Add this to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "youtube": {
      "command": "npx",
      "args": ["-y", "zubeid-youtube-mcp-server"],
      "env": {
        "YOUTUBE_API_KEY": "your_youtube_api_key_here"
      }
    }
  }
}
```

For OAuth with NPX, first authorize locally:
```bash
YOUTUBE_OAUTH_CLIENT_ID="..." YOUTUBE_OAUTH_CLIENT_SECRET="..." npx zubeid-youtube-mcp-server authorize
```

Then update your config:
```json
{
  "mcpServers": {
    "youtube": {
      "command": "npx",
      "args": ["-y", "zubeid-youtube-mcp-server"],
      "env": {
        "YOUTUBE_OAUTH_CLIENT_ID": "your_client_id_here",
        "YOUTUBE_OAUTH_CLIENT_SECRET": "your_client_secret_here"
      }
    }
  }
}
```

### Installing via Smithery

To install YouTube MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@ZubeidHendricks/youtube):

```bash
npx -y @smithery/cli install @ZubeidHendricks/youtube --client claude
```

## Configuration

### Authentication Modes

The YouTube MCP Server supports two authentication modes:

#### 1. API Key Mode (Default)
Simple and suitable for public data access.

**Required Environment Variables:**
* `YOUTUBE_API_KEY`: Your YouTube Data API key (required)
* `YOUTUBE_TRANSCRIPT_LANG`: Default language for transcripts (optional, defaults to 'en')

#### 2. OAuth Mode (Optional)
Required for accessing private playlists and user-specific data.

**Required Environment Variables:**
* `YOUTUBE_OAUTH_CLIENT_ID`: Your OAuth 2.0 client ID
* `YOUTUBE_OAUTH_CLIENT_SECRET`: Your OAuth 2.0 client secret
* `YOUTUBE_OAUTH_REDIRECT_URI`: Redirect URI (optional, defaults to 'urn:ietf:wg:oauth:2.0:oob')
* `YOUTUBE_OAUTH_SCOPES`: Comma-separated list of OAuth scopes (optional)

**Default OAuth Scopes:**
- `https://www.googleapis.com/auth/youtube.readonly` - Read access to YouTube data
- `https://www.googleapis.com/auth/youtube.force-ssl` - Access to manage playlists

### Setting up OAuth Authentication

1. **Get OAuth Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select an existing one
   - Enable the YouTube Data API v3
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose application type (Desktop app recommended)
   - Copy the Client ID and Client Secret

2. **Configure Environment Variables:**
   ```bash
   export YOUTUBE_OAUTH_CLIENT_ID="your_client_id"
   export YOUTUBE_OAUTH_CLIENT_SECRET="your_client_secret"
   ```

3. **Authorize the Application:**
   ```bash
   npx zubeid-youtube-mcp-server authorize
   ```
   
   This will:
   - Display an authorization URL
   - Open it in your browser to grant permissions
   - Prompt you to enter the authorization code
   - Save the token securely in `~/.youtube-mcp-token.json`

4. **Start Using OAuth Features:**
   Once authorized, you can access private playlists and use OAuth-only features.

### OAuth-Only Features

When OAuth is configured and authorized, you gain access to:
- **Private playlists**: Access your own private and unlisted playlists
- **User playlists**: List all playlists owned by the authenticated user
- **Unlisted videos**: Access unlisted video content

Use the `playlists_getMyPlaylists` tool to list your own playlists (requires OAuth).
### Using with VS Code

For one-click installation, click one of the install buttons below:

[![Install with NPX in VS Code](https://img.shields.io/badge/VS_Code-NPM-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=youtube&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22zubeid-youtube-mcp-server%22%5D%2C%22env%22%3A%7B%22YOUTUBE_API_KEY%22%3A%22%24%7Binput%3AapiKey%7D%22%7D%7D&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22apiKey%22%2C%22description%22%3A%22YouTube+API+Key%22%2C%22password%22%3Atrue%7D%5D) [![Install with NPX in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-NPM-24bfa5?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=youtube&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22zubeid-youtube-mcp-server%22%5D%2C%22env%22%3A%7B%22YOUTUBE_API_KEY%22%3A%22%24%7Binput%3AapiKey%7D%22%7D%7D&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22apiKey%22%2C%22description%22%3A%22YouTube+API+Key%22%2C%22password%22%3Atrue%7D%5D&quality=insiders)

### Manual Installation

If you prefer manual installation, first check the install buttons at the top of this section. Otherwise, follow these steps:

Add the following JSON block to your User Settings (JSON) file in VS Code. You can do this by pressing `Ctrl + Shift + P` and typing `Preferences: Open User Settings (JSON)`.

```json
{
  "mcp": {
    "inputs": [
      {
        "type": "promptString",
        "id": "apiKey",
        "description": "YouTube API Key",
        "password": true
      }
    ],
    "servers": {
      "youtube": {
        "command": "npx",
        "args": ["-y", "zubeid-youtube-mcp-server"],
        "env": {
          "YOUTUBE_API_KEY": "${input:apiKey}"
        }
      }
    }
  }
}
```

Optionally, you can add it to a file called `.vscode/mcp.json` in your workspace:

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "apiKey",
      "description": "YouTube API Key",
      "password": true
    }
  ],
  "servers": {
    "youtube": {
      "command": "npx",
      "args": ["-y", "zubeid-youtube-mcp-server"],
      "env": {
        "YOUTUBE_API_KEY": "${input:apiKey}"
      }
    }
  }
}
```
## YouTube API Setup

### API Key Setup (For Basic Features)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create API credentials (API key)
5. Copy the API key for configuration

### OAuth Setup (For Private Playlists and Advanced Features)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen if prompted
6. Choose application type: "Desktop app" (recommended) or "Web application"
7. Copy the Client ID and Client Secret
8. Run `npx zubeid-youtube-mcp-server authorize` to complete authorization

## Examples

### Managing Videos

```javascript
// Get video details
const video = await youtube.videos.getVideo({
  videoId: "video-id"
});

// Get video transcript
const transcript = await youtube.transcripts.getTranscript({
  videoId: "video-id",
  language: "en"
});

// Get improved, normalized transcript for LLM processing
const cleanTranscript = await youtube.get_transcript({
  videoId: "video-id"
});
// Returns: { plainText, timestampedSegments, language, segmentCount }

// Search videos
const searchResults = await youtube.videos.searchVideos({
  query: "search term",
  maxResults: 10
});
```

### Managing Channels

```javascript
// Get channel details
const channel = await youtube.channels.getChannel({
  channelId: "channel-id"
});

// List channel videos
const videos = await youtube.channels.listVideos({
  channelId: "channel-id",
  maxResults: 50
});
```

### Managing Playlists

```javascript
// Get playlist items (works with public and private playlists if authenticated)
const playlistItems = await youtube.playlists.getPlaylistItems({
  playlistId: "playlist-id",
  maxResults: 50
});

// Get playlist details
const playlist = await youtube.playlists.getPlaylist({
  playlistId: "playlist-id"
});

// Get user's own playlists (requires OAuth)
const myPlaylists = await youtube.playlists.getMyPlaylists({
  maxResults: 50
});
```

### OAuth-Enabled Examples

When OAuth is configured, you can access private content:

```javascript
// List your private playlists
const myPlaylists = await youtube.playlists.getMyPlaylists({
  maxResults: 50
});

// Access private playlist items
const privatePlaylistItems = await youtube.playlists.getPlaylistItems({
  playlistId: "your-private-playlist-id",
  maxResults: 50
});

// Get details of unlisted videos (if you have access)
const unlistedVideo = await youtube.videos.getVideo({
  videoId: "unlisted-video-id"
});
// Merge multiple playlists
const mergeReport = await youtube.playlists.mergePlaylists({
  sourcePlaylists: ["playlist-id-1", "playlist-id-2", "playlist-id-3"],
  targetPlaylist: "target-playlist-id",
  dedupe: true  // Remove duplicate videos by videoId
});

// The merge report includes:
// - sourcePlaylists: Array of source playlist stats (itemCount, itemsAdded, duplicatesSkipped)
// - totalItemsProcessed: Total number of items from all source playlists
// - uniqueItems: Number of unique items after deduplication
// - duplicatesRemoved: Number of duplicates removed (if dedupe=true)
// - itemsToMerge: Array of items with videoId, title, sourcePlaylistId, and position
// - targetPlaylistInfo: Target playlist metadata (title, description, itemCount)
// - errors: Array of any errors encountered during processing
// - summary: Human-readable summary of the merge operation
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Lint
npm run lint
```

## Contributing
See CONTRIBUTING.md for information about contributing to this repository.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
