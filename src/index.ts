import { startMcpServer } from './server.js';

// Check for required environment variables
// Either YOUTUBE_API_KEY or OAuth credentials are required
const hasApiKey = !!process.env.YOUTUBE_API_KEY;
const hasOAuthConfig = !!(process.env.YOUTUBE_OAUTH_CLIENT_ID && process.env.YOUTUBE_OAUTH_CLIENT_SECRET);

if (!hasApiKey && !hasOAuthConfig) {
    console.error('Error: YouTube authentication is not configured.');
    console.error('Please provide either:');
    console.error('  - YOUTUBE_API_KEY environment variable, or');
    console.error('  - YOUTUBE_OAUTH_CLIENT_ID and YOUTUBE_OAUTH_CLIENT_SECRET for OAuth');
    process.exit(1);
}

// Log authentication mode
if (hasOAuthConfig) {
    console.log('Starting YouTube MCP Server with OAuth authentication...');
} else {
    console.log('Starting YouTube MCP Server with API key authentication...');
}

// Start the MCP server
startMcpServer()
    .then(() => {
        console.log('YouTube MCP Server started successfully');
    })
    .catch(error => {
        console.error('Failed to start YouTube MCP Server:', error);
        process.exit(1);
    });
