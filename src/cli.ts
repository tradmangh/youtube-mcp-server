#!/usr/bin/env node

import { startMcpServer } from './server.js';
import { AuthManager } from './auth.js';

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Handle OAuth authorization command
if (command === 'authorize' || command === 'auth') {
    console.log('YouTube MCP Server - OAuth Authorization');
    console.log('========================================\n');
    
    const authManager = AuthManager.getInstance();
    
    // Check if OAuth is configured
    if (!process.env.YOUTUBE_OAUTH_CLIENT_ID || !process.env.YOUTUBE_OAUTH_CLIENT_SECRET) {
        console.error('Error: OAuth is not configured.');
        console.error('Please set the following environment variables:');
        console.error('  - YOUTUBE_OAUTH_CLIENT_ID');
        console.error('  - YOUTUBE_OAUTH_CLIENT_SECRET');
        console.error('  - YOUTUBE_OAUTH_REDIRECT_URI (optional, defaults to urn:ietf:wg:oauth:2.0:oob)');
        process.exit(1);
    }
    
    authManager.initialize()
        .then(() => authManager.runInteractiveAuth())
        .then(() => {
            console.log('\nAuthorization complete! You can now use OAuth-enabled features.');
            process.exit(0);
        })
        .catch(error => {
            console.error('Authorization failed:', error.message);
            process.exit(1);
        });
} else {
    // Check for required environment variables
    // Either YOUTUBE_API_KEY or OAuth credentials are required
    const hasApiKey = !!process.env.YOUTUBE_API_KEY;
    const hasOAuthConfig = !!(process.env.YOUTUBE_OAUTH_CLIENT_ID && process.env.YOUTUBE_OAUTH_CLIENT_SECRET);

    if (!hasApiKey && !hasOAuthConfig) {
        console.error('Error: YouTube authentication is not configured.');
        console.error('Please provide either:');
        console.error('  - YOUTUBE_API_KEY environment variable, or');
        console.error('  - YOUTUBE_OAUTH_CLIENT_ID and YOUTUBE_OAUTH_CLIENT_SECRET for OAuth');
        console.error('\nTo authorize with OAuth, run: zubeid-youtube-mcp-server authorize');
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
}
