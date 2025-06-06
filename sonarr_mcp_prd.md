# Sonarr MCP Server - Product Requirements Document

## Executive Summary

This PRD outlines the development of a Model Context Protocol (MCP) Server for Sonarr API v4, enabling AI assistants like Claude to seamlessly interact with Sonarr installations for TV series management, monitoring, and automation.

## Product Overview

### What is Sonarr?
Sonarr is a PVR for Usenet and BitTorrent users. It can monitor multiple RSS feeds for new episodes of your favorite shows and will grab, sort and rename them. It can also be configured to automatically upgrade the quality of files already downloaded when a better quality format becomes available

### What is MCP?
The Model Context Protocol (MCP) is an open standard introduced by Anthropic with the goal to standardize how AI applications (chatbots, IDE assistants, or custom agents) connect with external tools, data sources, and systems. Think of it like USB for AI integrations.

### Product Vision
Create a standardized MCP server that allows AI assistants to manage Sonarr installations through natural language interactions, automating TV series management workflows and providing intelligent media library insights.

## Problem Statement

Currently, users must manually interact with Sonarr's web interface or write custom scripts to:
- Add new TV series to their collection
- Monitor series and episode availability
- Manage quality profiles and download preferences
- Search for missing episodes
- Review download history and activity

This MCP server will enable AI assistants to perform these operations through conversational interfaces, making media management more accessible and automated.

## Target Users

### Primary Users
- **Home Media Enthusiasts**: Users with personal Sonarr installations who want AI-assisted media management
- **System Administrators**: Managing multiple Sonarr instances across different environments
- **Automation Engineers**: Building intelligent workflows for media acquisition

### Secondary Users
- **Developers**: Building custom AI applications that integrate with Sonarr
- **Media Server Operators**: Commercial or community media services

## Core Requirements

### Functional Requirements

#### FR1: Authentication & Connection Management
- **FR1.1**: Support API key-based authentication with Sonarr instances
- **FR1.2**: Handle multiple Sonarr server configurations
- **FR1.3**: Validate server connectivity and API compatibility
- **FR1.4**: Support both HTTP and HTTPS connections with SSL verification

#### FR2: Series Management Tools
- **FR2.1**: **Add Series**: Search for and add new TV series to Sonarr
  - Input: Series name, TVDB ID, or IMDB ID
  - Configure: Root folder, quality profile, language profile, monitoring options
- **FR2.2**: **List Series**: Retrieve all series in the collection with filtering options
- **FR2.3**: **Update Series**: Modify series settings (monitoring, quality profile, etc.)
- **FR2.4**: **Remove Series**: Delete series from collection with file handling options
- **FR2.5**: **Search Series**: Find series by name, year, or network

#### FR3: Episode Management Tools
- **FR3.1**: **List Episodes**: Get episodes for specific series or across all series
- **FR3.2**: **Monitor Episodes**: Toggle monitoring status for episodes/seasons
- **FR3.3**: **Search Episodes**: Trigger manual searches for missing episodes
- **FR3.4**: **Episode Files**: Manage episode files (rename, delete, quality info)

#### FR4: Quality & Profile Management Tools
- **FR4.1**: **Quality Profiles**: List, create, and modify quality profiles
- **FR4.2**: **Language Profiles**: Manage language preferences
- **FR4.3**: **Custom Formats**: Handle v4 custom format configurations
- **FR4.4**: **Release Profiles**: Manage release filtering and preferences

#### FR5: Download & Activity Monitoring Tools
- **FR5.1**: **Queue Management**: View and manage download queue
- **FR5.2**: **History**: Access download and import history
- **FR5.3**: **Activity**: Monitor current Sonarr activity and status
- **FR5.4**: **Calendar**: View upcoming episodes and air dates

#### FR6: System & Configuration Tools
- **FR6.1**: **System Status**: Check Sonarr health and system information
- **FR6.2**: **Root Folders**: Manage storage locations
- **FR6.3**: **Indexers**: View configured indexers and their status
- **FR6.4**: **Download Clients**: Manage download client configurations

#### FR7: Search & Discovery Tools
- **FR7.1**: **TVDB Lookup**: Search The Movie Database for series information
- **FR7.2**: **Release Search**: Find available releases for specific episodes
- **FR7.3**: **Missing Episodes**: Identify and search for missing content
- **FR7.4**: **Wanted Lists**: Manage and search wanted/missing episodes

### Non-Functional Requirements

#### NFR1: Performance
- **NFR1.1**: Response time for API calls should be < 5 seconds for 95% of requests
- **NFR1.2**: Support concurrent requests from multiple AI assistant sessions
- **NFR1.3**: Implement request caching for frequently accessed data (series lists, profiles)

#### NFR2: Security
- **NFR2.1**: Secure API key storage and transmission
- **NFR2.2**: Input validation and sanitization for all user inputs
- **NFR2.3**: Rate limiting to prevent API abuse
- **NFR2.4**: No credential storage beyond session scope

#### NFR3: Reliability
- **NFR3.1**: 99.5% uptime for MCP server operations
- **NFR3.2**: Graceful error handling and meaningful error messages
- **NFR3.3**: Automatic retry logic for transient Sonarr API failures

#### NFR4: Compatibility
- **NFR4.1**: Support Sonarr v4.x with v3 API endpoints
- **NFR4.2**: Compatible with MCP specification 2025-03-26
- **NFR4.3**: Cross-platform support (Windows, macOS, Linux)

## Technical Architecture

### MCP Server Structure

#### Transport Layer
- **Primary**: STDIO transport for local AI assistant integration
- **Secondary**: HTTP+SSE for remote deployments
- **Protocol**: JSON-RPC 2.0 as per MCP specification

#### Core Components

```
┌─────────────────────────────────────────┐
│              MCP Client                 │
│            (Claude, etc.)               │
└─────────────────┬───────────────────────┘
                  │ JSON-RPC 2.0
┌─────────────────▼───────────────────────┐
│          Sonarr MCP Server              │
├─────────────────────────────────────────┤
│  Tools Handler │  Resources Handler     │
│  - Series mgmt │  - Series data         │
│  - Episode ops │  - Episode lists       │
│  - Search funcs│  - Calendar data       │
├─────────────────────────────────────────┤
│         Sonarr API Client               │
│    - Authentication                     │
│    - Request handling                   │
│    - Error management                   │
└─────────────────┬───────────────────────┘
                  │ HTTP/HTTPS
┌─────────────────▼───────────────────────┐
│            Sonarr Instance              │
│              (v4.x API)                 │
└─────────────────────────────────────────┘
```

### Implementation Technology Stack

#### Recommended: Python Implementation
- **Framework**: FastMCP (Python MCP SDK)
- **HTTP Client**: `httpx` for async Sonarr API requests
- **Validation**: `pydantic` for data models and validation
- **Configuration**: Environment variables and JSON config files

#### Alternative: TypeScript Implementation
- **Framework**: MCP TypeScript SDK
- **HTTP Client**: `axios` or `fetch`
- **Validation**: `zod` for schema validation

## API Design

### MCP Tools (Actions)

#### Series Management
```json
{
  "name": "add_series",
  "description": "Add a new TV series to Sonarr",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {"type": "string", "description": "Series name or TVDB ID"},
      "rootFolder": {"type": "string", "description": "Root folder path"},
      "qualityProfile": {"type": "string", "description": "Quality profile name"},
      "monitor": {"type": "string", "enum": ["all", "future", "missing", "existing", "none"]},
      "searchForMissingEpisodes": {"type": "boolean", "default": false}
    },
    "required": ["query", "rootFolder", "qualityProfile"]
  }
}
```

#### Episode Operations
```json
{
  "name": "search_missing_episodes",
  "description": "Search for missing episodes across all or specific series",
  "inputSchema": {
    "type": "object", 
    "properties": {
      "seriesId": {"type": "integer", "description": "Specific series ID (optional)"},
      "seasonNumber": {"type": "integer", "description": "Specific season (optional)"}
    }
  }
}
```

#### Queue Management
```json
{
  "name": "manage_queue",
  "description": "View and manage the download queue",
  "inputSchema": {
    "type": "object",
    "properties": {
      "action": {"type": "string", "enum": ["list", "remove", "retry"]},
      "queueId": {"type": "integer", "description": "Queue item ID for remove/retry actions"}
    },
    "required": ["action"]
  }
}
```

### MCP Resources (Context)

#### Series Collection
```json
{
  "uri": "sonarr://series/collection",
  "name": "TV Series Collection",
  "description": "Complete list of series in Sonarr with metadata"
}
```

#### Calendar Data
```json
{
  "uri": "sonarr://calendar/upcoming",
  "name": "Upcoming Episodes",
  "description": "Calendar view of upcoming episodes and air dates"
}
```

#### System Status
```json
{
  "uri": "sonarr://system/status",
  "name": "Sonarr System Status",
  "description": "Health, disk space, and system information"
}
```

## Configuration

### Environment Variables
```bash
# Required
SONARR_API_URL=http://localhost:8989
SONARR_API_KEY=your_api_key_here

# Optional
SONARR_TIMEOUT=30
SONARR_MAX_RETRIES=3
MCP_LOG_LEVEL=INFO
```

### Configuration File (sonarr-mcp.json)
```json
{
  "sonarr": {
    "url": "http://localhost:8989",
    "apiKey": "${SONARR_API_KEY}",
    "timeout": 30,
    "verifySsl": true
  },
  "mcp": {
    "name": "sonarr-server",
    "version": "1.0.0",
    "logLevel": "INFO"
  },
  "features": {
    "enableFileOperations": false,
    "enableSystemCommands": true,
    "maxConcurrentRequests": 10
  }
}
```

## Error Handling

### Error Categories
1. **Connection Errors**: Network issues, invalid URLs, SSL problems
2. **Authentication Errors**: Invalid API keys, permissions
3. **API Errors**: Sonarr-specific errors, invalid requests
4. **Validation Errors**: Invalid input parameters, schema mismatches

### Error Response Format
```json
{
  "error": {
    "code": "SONARR_API_ERROR",
    "message": "Failed to add series: Series already exists",
    "details": {
      "sonarrResponse": "...",
      "timestamp": "2025-06-06T10:30:00Z"
    }
  }
}
```

## Testing Strategy

### Unit Tests
- API client functionality
- Data model validation
- Error handling scenarios
- Configuration parsing

### Integration Tests
- End-to-end MCP tool execution
- Sonarr API interaction
- Multiple server configurations

### Manual Testing
- Claude Desktop integration
- Real-world usage scenarios
- Performance under load

## Deployment

### Local Development
```bash
# Install dependencies
npm install @modelcontextprotocol/sdk-typescript
# or
pip install mcp fastmcp

# Run server
node sonarr-mcp-server.js
# or  
python -m sonarr_mcp_server
```

### Claude Desktop Integration
```json
{
  "mcpServers": {
    "sonarr": {
      "command": "node",
      "args": ["path/to/sonarr-mcp-server.js"],
      "env": {
        "SONARR_API_URL": "http://localhost:8989",
        "SONARR_API_KEY": "your_key_here"
      }
    }
  }
}
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## Security Considerations

### Data Protection
- API keys stored in environment variables only
- No sensitive data logging
- Input sanitization for all user inputs
- Rate limiting to prevent abuse

### Access Control
- Read-only operations by default
- Destructive operations require explicit confirmation
- Configurable permission levels
- Audit logging for all operations

## Success Metrics

### Adoption Metrics
- Number of active MCP server instances
- Monthly active users
- Integration usage frequency

### Performance Metrics
- Average response time < 3 seconds
- 99.5% success rate for API calls
- Zero security incidents

### User Satisfaction
- Successful completion rate for common tasks
- User feedback scores
- Feature request analysis

## Future Enhancements

### Phase 2 Features
- **Multi-instance Support**: Manage multiple Sonarr servers
- **Advanced Automation**: Smart series recommendations
- **Batch Operations**: Bulk series management
- **Custom Workflows**: User-defined automation sequences

### Phase 3 Features
- **Analytics Integration**: Usage insights and trends
- **Community Features**: Shared configurations and workflows
- **Mobile Support**: Smartphone AI assistant integration
- **Voice Interface**: Voice command support

### Integration Opportunities
- **Radarr MCP Server**: Companion server for movies
- **Prowlarr Integration**: Indexer management
- **Jellyfin/Plex**: Media server integration
- **Notification Services**: Discord, Slack, email alerts

## Conclusion

The Sonarr MCP Server will provide a standardized, secure, and user-friendly way for AI assistants to interact with Sonarr installations. By implementing this according to MCP specifications, we enable powerful natural language interactions for TV series management while maintaining the flexibility to extend functionality in the future.

This implementation will serve as a foundation for the broader *arr ecosystem integration and demonstrate the power of MCP for home automation and media management use cases.