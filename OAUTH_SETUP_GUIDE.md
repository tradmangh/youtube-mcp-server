# OAuth Setup and Testing Guide

This guide helps you set up and test OAuth authentication for the YouTube MCP Server.

## Prerequisites

1. Google Cloud Project with YouTube Data API v3 enabled
2. OAuth 2.0 credentials (Client ID and Client Secret)

## Setup Steps

### 1. Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select or create a project
3. Enable the YouTube Data API v3:
   - Navigate to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create OAuth credentials:
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Configure OAuth consent screen if prompted
   - Choose application type: "Desktop app" (recommended)
   - Note down the Client ID and Client Secret

### 2. Set Environment Variables

```bash
export YOUTUBE_OAUTH_CLIENT_ID="your_client_id_here"
export YOUTUBE_OAUTH_CLIENT_SECRET="your_client_secret_here"
```

Optional:
```bash
export YOUTUBE_OAUTH_REDIRECT_URI="urn:ietf:wg:oauth:2.0:oob"  # Default
export YOUTUBE_OAUTH_SCOPES="https://www.googleapis.com/auth/youtube.readonly,https://www.googleapis.com/auth/youtube.force-ssl"
```

### 3. Run Authorization Flow

```bash
npx zubeid-youtube-mcp-server authorize
```

This will:
1. Display an authorization URL
2. Open your browser (or provide a URL to copy)
3. Prompt you to sign in to Google and grant permissions
4. Ask you to enter the authorization code
5. Save the token to `~/.youtube-mcp-token.json`

### 4. Verify Setup

Check that the token file was created:
```bash
ls -la ~/.youtube-mcp-token.json
```

The file should have permissions `-rw-------` (read/write for owner only).

## Testing OAuth Features

### Test 1: List Your Private Playlists

Start the server with OAuth:
```bash
YOUTUBE_OAUTH_CLIENT_ID="..." YOUTUBE_OAUTH_CLIENT_SECRET="..." npx zubeid-youtube-mcp-server
```

Use the MCP client to call:
```javascript
{
  "method": "tools/call",
  "params": {
    "name": "playlists_getMyPlaylists",
    "arguments": {
      "maxResults": 10
    }
  }
}
```

Expected result: List of all your playlists (including private ones).

### Test 2: Access Private Playlist Items

```javascript
{
  "method": "tools/call",
  "params": {
    "name": "playlists_getPlaylistItems",
    "arguments": {
      "playlistId": "your_private_playlist_id",
      "maxResults": 10
    }
  }
}
```

Expected result: Items from your private playlist.

### Test 3: Verify Backward Compatibility

Test that API key mode still works:
```bash
YOUTUBE_API_KEY="your_api_key" npx zubeid-youtube-mcp-server
```

Use public data tools (videos_getVideo, videos_searchVideos, etc.).
Expected result: All public data tools work normally.

## Troubleshooting

### "OAuth is not configured" Error

Make sure both `YOUTUBE_OAUTH_CLIENT_ID` and `YOUTUBE_OAUTH_CLIENT_SECRET` are set.

### "No valid OAuth token found" Error

Run the authorization flow:
```bash
npx zubeid-youtube-mcp-server authorize
```

### Token Expired

The server automatically refreshes expired tokens. If refresh fails:
1. Delete the old token: `rm ~/.youtube-mcp-token.json`
2. Re-run authorization: `npx zubeid-youtube-mcp-server authorize`

### Permission Denied Errors

Check that the OAuth consent screen includes the correct scopes:
- `https://www.googleapis.com/auth/youtube.readonly`
- `https://www.googleapis.com/auth/youtube.force-ssl`

## Security Notes

- **Token Storage**: Tokens are stored in `~/.youtube-mcp-token.json` with restricted permissions (0o600)
- **Scopes**: By default, only read access is requested. Modify `YOUTUBE_OAUTH_SCOPES` to request additional permissions
- **Token Refresh**: Tokens are automatically refreshed when they expire
- **Revocation**: To revoke access, delete the token file and revoke access in [Google Account Settings](https://myaccount.google.com/permissions)

## Claude Desktop Configuration

### With OAuth:

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

**Important**: Run the authorization flow before starting Claude Desktop:
```bash
YOUTUBE_OAUTH_CLIENT_ID="..." YOUTUBE_OAUTH_CLIENT_SECRET="..." npx zubeid-youtube-mcp-server authorize
```

## VS Code Configuration

Add to `.vscode/mcp.json`:

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "oauthClientId",
      "description": "YouTube OAuth Client ID",
      "password": true
    },
    {
      "type": "promptString",
      "id": "oauthClientSecret",
      "description": "YouTube OAuth Client Secret",
      "password": true
    }
  ],
  "servers": {
    "youtube": {
      "command": "npx",
      "args": ["-y", "zubeid-youtube-mcp-server"],
      "env": {
        "YOUTUBE_OAUTH_CLIENT_ID": "${input:oauthClientId}",
        "YOUTUBE_OAUTH_CLIENT_SECRET": "${input:oauthClientSecret}"
      }
    }
  }
}
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/tradmangh/youtube-mcp-server/issues
- Documentation: README.md
