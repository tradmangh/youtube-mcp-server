# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YouTube MCP Server is a Model Context Protocol (MCP) server implementation that enables AI language models to interact with YouTube content. It provides tools for accessing video information, transcripts, channel data, and playlist management through standardized MCP interfaces.

## Development Commands

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Start the server
npm start

# Development mode with auto-rebuild and hot reload
npm run dev

# Publish to npm (runs build first)
npm run prepublishOnly
```

## Architecture

### Core Structure

The project uses a **service-based architecture** with the following layers:

1. **Entry Point** (`src/index.ts`): Validates authentication configuration and starts the MCP server
2. **Server** (`src/server.ts`): Sets up the MCP server, defines available tools, and routes tool calls to appropriate services
3. **Authentication** (`src/auth.ts`): Manages OAuth2 and API key authentication modes
4. **Services** (`src/services/`): Core business logic for interacting with YouTube APIs
   - `VideoService`: Handles video operations (get video details, search videos)
   - `TranscriptService`: Retrieves and manages video transcripts
   - `PlaylistService`: Manages playlist operations (including private playlists with OAuth)
   - `ChannelService`: Handles channel-related operations
5. **Types** (`src/types.ts`): TypeScript interfaces for function parameters and data structures
6. **Functions** (`src/functions/`): Additional functionality (currently excluded from compilation but available for future extensions)

### Authentication Architecture

The project supports **dual authentication modes**:

1. **API Key Mode (Default)**: Simple authentication using a YouTube Data API key
   - Suitable for public data access
   - Configured via `YOUTUBE_API_KEY` environment variable
   - No setup required beyond obtaining an API key

2. **OAuth Mode (Optional)**: Full OAuth2 authentication for private content
   - Required for private playlists and user-specific data
   - Configured via `YOUTUBE_OAUTH_CLIENT_ID`, `YOUTUBE_OAUTH_CLIENT_SECRET`
   - Token storage in `~/.youtube-mcp-token.json`
   - Automatic token refresh handled by googleapis
   - Authorization flow via CLI: `zubeid-youtube-mcp-server authorize`

**AuthManager** (`src/auth.ts`):
- Singleton pattern for centralized authentication management
- Auto-detects authentication mode based on environment variables
- Provides unified authentication interface to all services
- Handles OAuth token storage, loading, and refresh
- Supports interactive authorization flow for CLI usage

### MCP Tool Registration

Tools are registered in `src/server.ts` through the `ListToolsRequestSchema` handler. Each tool has:
- A name following the pattern `{service}_{operation}` (e.g., `videos_getVideo`)
- A description for the AI model
- An input schema defining expected parameters

Tool execution is handled in `CallToolRequestSchema` handler with a switch statement routing to the appropriate service method.

**OAuth-Required Tools**:
- `playlists_getMyPlaylists`: Lists all playlists owned by the authenticated user (requires OAuth)

### API Integration

Services use the **Google APIs Node.js client library** (`googleapis` package) with lazy initialization:
- The YouTube API client is initialized only when needed (not in constructor)
- Authentication credentials are obtained from AuthManager
- Each service maintains its own `youtube` client instance
- Services automatically use the appropriate auth mode (API key or OAuth)

### Module System

The project uses **ES modules** (ESNext) as configured in:
- `package.json`: `"type": "module"`
- `tsconfig.json`: `"module": "ESNext"`, `"moduleResolution": "bundler"`
- All imports use `.js` extensions (e.g., `import { VideoService } from './services/video.js'`)

## Key Files and Responsibilities

| File | Purpose |
|------|---------|
| `src/index.ts` | Entry point, validates authentication configuration (API key or OAuth) |
| `src/cli.ts` | CLI entry point with OAuth authorization command support |
| `src/server.ts` | MCP server setup and tool routing |
| `src/auth.ts` | AuthManager - handles OAuth2 and API key authentication |
| `src/services/video.ts` | Video lookup and search functionality |
| `src/services/transcript.ts` | Video transcript retrieval |
| `src/services/playlist.ts` | Playlist operations (public and private with OAuth) |
| `src/services/channel.ts` | Channel information and video listing |
| `src/types.ts` | TypeScript type definitions for all parameters |

## Configuration

### Authentication Configuration

**API Key Mode (Default):**
- `YOUTUBE_API_KEY`: Your YouTube Data API v3 key (required if OAuth not configured)

**OAuth Mode (Optional, for Private Playlists):**
- `YOUTUBE_OAUTH_CLIENT_ID`: OAuth 2.0 client ID (required for OAuth)
- `YOUTUBE_OAUTH_CLIENT_SECRET`: OAuth 2.0 client secret (required for OAuth)
- `YOUTUBE_OAUTH_REDIRECT_URI`: OAuth redirect URI (optional, defaults to 'urn:ietf:wg:oauth:2.0:oob')
- `YOUTUBE_OAUTH_SCOPES`: Comma-separated OAuth scopes (optional, defaults to readonly and playlist management)

**Other Configuration:**
- `YOUTUBE_TRANSCRIPT_LANG`: Default language for transcripts (optional, defaults to 'en')

### OAuth Setup

To enable OAuth for private playlists:

1. Set OAuth environment variables
2. Run authorization: `npx zubeid-youtube-mcp-server authorize`
3. Follow the browser prompt to grant permissions
4. Enter the authorization code when prompted
5. Token is saved to `~/.youtube-mcp-token.json`

## Available Tools

The MCP server exposes these tools to clients:

**Public Data Tools (Work with API Key or OAuth):**
- `videos_getVideo`: Get detailed video information
- `videos_searchVideos`: Search for videos
- `transcripts_getTranscript`: Retrieve video transcript
- `channels_getChannel`: Get channel information
- `channels_listVideos`: List videos from a channel
- `playlists_getPlaylist`: Get playlist details
- `playlists_getPlaylistItems`: List items in a playlist

**OAuth-Only Tools:**
- `playlists_getMyPlaylists`: List all playlists owned by the authenticated user (requires OAuth)

## Build and Distribution

The project is published as an npm package (`zubeid-youtube-mcp-server`) and can be installed globally or used via npx. The build process:
1. TypeScript compiles to JavaScript in `dist/` directory
2. Binary entry point is set via `bin` field in package.json
3. The `main` field points to `dist/index.js`

## Testing and Validation

When making changes:
- Ensure all imports use `.js` extensions for relative imports
- Verify TypeScript compiles without errors: `npm run build`
- Test API key mode: `YOUTUBE_API_KEY=test npm start` (server should start)
- Test OAuth mode detection: Set OAuth env vars and verify proper mode selection
- Test authorization CLI: `npx zubeid-youtube-mcp-server authorize` (requires valid OAuth credentials)

## Important Notes

- **Backward Compatibility**: API key-only mode remains the default and fully functional
- **OAuth is Optional**: System works without OAuth configuration for public data access
- Lazy initialization of YouTube client prevents validation errors until tools are called
- AuthManager uses singleton pattern - all services share the same auth instance
- Token refresh is handled automatically by the googleapis library
- OAuth tokens are stored securely in `~/.youtube-mcp-token.json` with restricted permissions (mode 0600)
- The services handle errors gracefully and return error messages to the MCP client
- Response content is JSON-stringified for transmission to the client
- No tests are currently configured in the project

## Recent Changes

**OAuth Support for Private Playlists (Latest)**:
- Added `src/auth.ts` - AuthManager for dual authentication modes
- Updated all services to use AuthManager instead of direct API key access
- Added `getMyPlaylists()` method to PlaylistService
- Added `playlists_getMyPlaylists` MCP tool
- CLI now supports `authorize` command for OAuth setup
- Comprehensive OAuth documentation in README
- Backward compatible - API key mode still works as before
