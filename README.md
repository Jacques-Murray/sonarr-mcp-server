# Sonarr MCP Server

A comprehensive Model Context Protocol (MCP) server implementation for Sonarr, enabling AI assistants to manage TV series through natural language interactions.

## Overview

This MCP server provides AI assistants with the ability to:

- **Manage TV Series**: Add, update, remove, and monitor series in your Sonarr collection
- **Episode Operations**: Search for episodes, manage downloads, and monitor file status
- **Queue Management**: View and control the download queue
- **System Monitoring**: Check system health, disk space, and activity
- **Calendar Integration**: View upcoming episodes and air dates
- **Configuration Access**: Manage quality profiles, root folders, and settings

## Features

### 🎬 Series Management

- **Add Series**: Search and add new TV series with customizable monitoring options
- **List Series**: View your collection with filtering by status, monitoring, and search terms
- **Update Series**: Modify series settings, quality profiles, and monitoring status
- **Remove Series**: Delete series with optional file cleanup

### 📺 Episode Operations

- **Search Episodes**: Trigger searches for missing episodes across all or specific series
- **Monitor Episodes**: Toggle monitoring for individual episodes or seasons
- **Episode Status**: Check file availability and download progress
- **Season Management**: Bulk operations on entire seasons

### 📥 Download Management

- **Queue Monitoring**: Real-time view of download progress and status
- **Queue Control**: Remove stuck downloads and manage queue items
- **Download History**: Track successful downloads and failed attempts
- **Release Management**: View available releases and trigger manual downloads

### 🖥️ System Information

- **System Status**: Monitor Sonarr health, version, and runtime information
- **Disk Space**: Track storage usage and available space
- **Activity Monitoring**: View current operations and system activity
- **Calendar View**: Upcoming episodes and air dates

### ⚙️ Configuration

- **Quality Profiles**: View and manage quality settings
- **Root Folders**: Configure storage locations
- **Indexer Status**: Monitor search providers
- **Custom Formats**: Access advanced quality configurations

## Installation

### Prerequisites

- Node.js 18+
- Sonarr v4.x running and accessible
- Valid Sonarr API key

### Setup

1. **Clone and install dependencies:**

```bash
git clone https://github.com/Jacques-Murray/sonarr-mcp-server.git
cd sonarr-mcp-server
npm install
```

2. **Configure environment variables:**

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Sonarr Configuration
SONARR_API_URL=http://localhost:8989
SONARR_API_KEY=your_sonarr_api_key_here

# Optional Configuration
SONARR_TIMEOUT=30
SONARR_MAX_RETRIES=3
SONARR_VERIFY_SSL=true
MCP_LOG_LEVEL=INFO
```

3. **Build the project:**

```bash
npm run build
```

4. **Test the connection:**

```bash
npm run start -- --test
```

## Usage

### Running the MCP Server

**Development mode:**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

The server will start and listen for MCP connections via stdio.

### Integrating with AI Assistants

Add this configuration to your AI assistant's MCP settings:

**Claude Desktop (`claude_desktop_config.json`):**

```json
{
  "mcpServers": {
    "sonarr": {
      "command": "node",
      "args": ["/path/to/sonarr-mcp-server/dist/index.js"],
      "env": {
        "SONARR_API_URL": "http://localhost:8989",
        "SONARR_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## MCP Tools

### Series Management

#### `add_series`

Add a new TV series to Sonarr.

**Parameters:**

- `query` (required): Series name, TVDB ID, or IMDB ID
- `rootFolder` (required): Storage path for the series
- `qualityProfile` (required): Quality profile name or ID
- `monitor`: Monitoring mode (`all`, `future`, `missing`, `existing`, `none`)
- `searchForMissingEpisodes`: Auto-search for missing episodes
- `seasonFolder`: Use season folders

**Example:**

```
Add "Breaking Bad" to my collection using HD-1080p quality profile in the /tv folder
```

#### `list_series`

List all series with optional filtering.

**Parameters:**

- `monitored`: Filter by monitoring status
- `status`: Filter by series status
- `search`: Search by title

**Example:**

```
Show me all currently monitored series
```

#### `update_series`

Update series settings.

**Parameters:**

- `seriesId` (required): Series to update
- `monitored`: New monitoring status
- `qualityProfileId`: New quality profile

#### `remove_series`

Remove a series from Sonarr.

**Parameters:**

- `seriesId` (required): Series to remove
- `deleteFiles`: Delete files from disk

### Episode Operations

#### `search_missing_episodes`

Search for missing episodes.

**Parameters:**

- `seriesId`: Specific series (optional)
- `seasonNumber`: Specific season (requires seriesId)

**Example:**

```
Search for all missing episodes
```

#### `list_episodes`

List episodes for a series.

**Parameters:**

- `seriesId` (required): Series to list episodes for
- `seasonNumber`: Filter by season
- `monitored`: Filter by monitoring status
- `hasFile`: Filter by file availability

#### `monitor_episodes`

Toggle episode monitoring.

**Parameters:**

- `episodeIds` (required): Array of episode IDs
- `monitored` (required): Monitoring status to set

### Queue Management

#### `manage_queue`

View and manage download queue.

**Parameters:**

- `action` (required): `list`, `remove`, or `retry`
- `queueId`: Queue item ID (for remove/retry actions)

**Example:**

```
Show me the current download queue
```

### System Information

#### `system_status`

Get Sonarr system status and health.

**Example:**

```
What's the current status of my Sonarr system?
```

#### `get_calendar`

View upcoming episodes.

**Parameters:**

- `start`: Start date (YYYY-MM-DD)
- `end`: End date (YYYY-MM-DD)
- `unmonitored`: Include unmonitored episodes

**Example:**

```
What episodes are coming up this week?
```

#### `get_wanted`

Get wanted/missing episodes.

**Parameters:**

- `type`: `missing` or `cutoff`
- `page`: Page number
- `pageSize`: Items per page

#### `get_history`

View download history.

**Parameters:**

- `page`: Page number
- `pageSize`: Items per page
- `seriesId`: Filter by series
- `eventType`: Filter by event type

## MCP Resources

The server provides several resources that give AI assistants context about your Sonarr setup:

### `sonarr://series/collection`

Complete series collection with statistics and metadata.

### `sonarr://calendar/upcoming`

Upcoming episodes for the next 30 days.

### `sonarr://system/status`

System health, disk space, and configuration information.

### `sonarr://queue/current`

Current download queue with progress details.

### `sonarr://history/recent`

Recent download and import history.

### `sonarr://wanted/missing`

Episodes that are missing and being monitored.

### `sonarr://config/quality-profiles`

Available quality profiles and their configurations.

### `sonarr://config/root-folders`

Configured root folders and storage information.

## Example Conversations

**Adding a series:**

```
User: Add "The Mandalorian" to my collection using the HD-1080p profile
Assistant: I'll add "The Mandalorian" to your Sonarr collection using the HD-1080p quality profile.

[Searches for the series and adds it with the specified settings]

Successfully added "The Mandalorian" (2019) to your collection! The series has been added with:
- Quality Profile: HD-1080p
- Monitoring: All episodes
- Season folders: Enabled
- 3 seasons with 24 total episodes
```

**Checking system status:**

```
User: How is my Sonarr system doing?
Assistant: Your Sonarr system is running well! Here's the current status:

System Information:
- Version: Sonarr 4.0.0.746
- Uptime: 5 days, 12 hours
- OS: Linux 5.4.0-91-generic

Storage:
- /tv: 1.2 TB free of 2.0 TB (60% free)
- /downloads: 450 GB free of 500 GB (90% free)

Everything looks healthy!
```

**Managing downloads:**

```
User: What's currently downloading?
Assistant: Here's your current download queue:

📥 Active Downloads (3 items):
1. "House of the Dragon S02E08" - 85% complete (5 minutes remaining)
2. "The Bear S03E01" - 45% complete (12 minutes remaining) 
3. "Stranger Things S05E01" - 10% complete (45 minutes remaining)

All downloads are progressing normally.
```

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test -- --coverage
```

### Linting

```bash
# Check for linting errors
npm run lint

# Fix linting errors
npm run lint:fix
```

### Building

```bash
# Clean build directory
npm run clean

# Build TypeScript
npm run build
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SONARR_API_URL` | `http://localhost:8989` | Sonarr server URL |
| `SONARR_API_KEY` | - | Sonarr API key (required) |
| `SONARR_TIMEOUT` | `30` | Request timeout in seconds |
| `SONARR_MAX_RETRIES` | `3` | Maximum retry attempts |
| `SONARR_VERIFY_SSL` | `true` | Verify SSL certificates |
| `MCP_LOG_LEVEL` | `INFO` | Logging level |

### Sonarr API Key

To get your Sonarr API key:

1. Open Sonarr web interface
2. Go to Settings → General
3. Copy the API Key value

## Troubleshooting

### Common Issues

**Connection refused:**

- Verify Sonarr is running and accessible
- Check the `SONARR_API_URL` setting
- Ensure firewall allows connections

**Authentication failed:**

- Verify the `SONARR_API_KEY` is correct
- Check if API key has required permissions

**SSL certificate errors:**

- Set `SONARR_VERIFY_SSL=false` for self-signed certificates
- Or properly configure SSL certificates

### Debug Mode

Enable debug logging:

```bash
MCP_LOG_LEVEL=DEBUG npm start
```

### Test Connection

Test basic connectivity:

```bash
npm run start -- --test
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Add tests for new functionality
- Update documentation for new features
- Use conventional commit messages

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Sonarr](https://sonarr.tv/) for the excellent TV series management software
- [Model Context Protocol](https://modelcontextprotocol.io/) for the integration standard
- The open source community for invaluable tools and libraries

## Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/Jacques-Murray/sonarr-mcp-server/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Jacques-Murray/sonarr-mcp-server/discussions)
- 📖 **Documentation**: [Wiki](https://github.com/Jacques-Murray/sonarr-mcp-server/wiki)

---

**Made with ❤️ for the Sonarr and AI automation community**
