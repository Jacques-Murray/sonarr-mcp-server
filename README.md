# Sonarr MCP Server

[![CI/CD Pipeline](https://github.com/Jacques-Murray/sonarr-mcp-server/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Jacques-Murray/sonarr-mcp-server/actions/workflows/ci-cd.yml)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/Jacques-Murray/sonarr-mcp-server)](https://github.com/Jacques-Murray/sonarr-mcp-server/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-supported-blue)](https://hub.docker.com/r/jacques-murray/sonarr-mcp-server)

A comprehensive Model Context Protocol (MCP) server implementation for Sonarr, enabling AI assistants to manage TV series through natural language interactions.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Local Installation](#local-installation)
  - [Docker Installation](#docker-installation)
- [Usage](#usage)
  - [Running the MCP Server](#running-the-mcp-server)
  - [Integrating with AI Assistants](#integrating-with-ai-assistants)
- [API Documentation](#api-documentation)
  - [MCP Tools](#mcp-tools)
  - [MCP Resources](#mcp-resources)
- [Configuration](#configuration)
- [Development Setup](#development-setup)
- [Docker Usage](#docker-usage)
- [CI/CD Information](#cicd-information)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

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

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Sonarr**: Version 4.x running and accessible
- **API Access**: Valid Sonarr API key with appropriate permissions

### Local Installation

1. **Clone the repository:**

```bash
git clone https://github.com/Jacques-Murray/sonarr-mcp-server.git
cd sonarr-mcp-server
```

1. **Install dependencies:**

```bash
npm install
```

1. **Configure environment variables:**

```bash
cp .env.example .env
```

Edit [`.env`](.env.example) with your Sonarr settings:

```env
# Sonarr Configuration (Required)
SONARR_API_URL=http://localhost:8989
SONARR_API_KEY=your_sonarr_api_key_here

# Connection Settings (Optional)
SONARR_TIMEOUT=30
SONARR_MAX_RETRIES=3
SONARR_VERIFY_SSL=true

# MCP Server Configuration (Optional)
MCP_LOG_LEVEL=INFO
MCP_SERVER_NAME=sonarr-server
MCP_SERVER_VERSION=1.0.0

# Feature Flags (Optional)
ENABLE_FILE_OPERATIONS=false
ENABLE_SYSTEM_COMMANDS=true
MAX_CONCURRENT_REQUESTS=10
```

1. **Build the project:**

```bash
npm run build
```

1. **Test the connection:**

```bash
npm run start -- --test
```

### Docker Installation

#### Quick Start with Docker

```bash
# Pull the latest image
docker pull ghcr.io/jacques-murray/sonarr-mcp-server:latest

# Run with environment variables
docker run -d \
  --name sonarr-mcp-server \
  -e SONARR_API_URL=http://your-sonarr-host:8989 \
  -e SONARR_API_KEY=your_api_key_here \
  -e MCP_LOG_LEVEL=INFO \
  --restart unless-stopped \
  ghcr.io/jacques-murray/sonarr-mcp-server:latest
```

#### Using Docker Compose

Create a [`docker-compose.yml`](docker-compose.yml) file:

```yaml
version: '3.8'

services:
  sonarr-mcp-server:
    image: ghcr.io/jacques-murray/sonarr-mcp-server:latest
    container_name: sonarr-mcp-server
    environment:
      - SONARR_API_URL=http://sonarr:8989
      - SONARR_API_KEY=${SONARR_API_KEY}
      - MCP_LOG_LEVEL=INFO
      - SONARR_VERIFY_SSL=false
    volumes:
      - ./logs:/usr/src/app/logs
    restart: unless-stopped
    depends_on:
      - sonarr
    healthcheck:
      test: ["CMD", "node", "-e", "console.log('Health check: MCP server process running')"]
      interval: 30s
      timeout: 10s
      retries: 3

  sonarr:
    image: linuxserver/sonarr:latest
    container_name: sonarr
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=UTC
    volumes:
      - ./config:/config
      - ./tv:/tv
      - ./downloads:/downloads
    ports:
      - "8989:8989"
    restart: unless-stopped
```

#### Building from Source

```bash
# Clone and build
git clone https://github.com/Jacques-Murray/sonarr-mcp-server.git
cd sonarr-mcp-server

# Build Docker image
docker build -t sonarr-mcp-server .

# Run your custom build
docker run -d \
  --name sonarr-mcp-server \
  --env-file .env \
  sonarr-mcp-server
```

### Environment Setup

#### Getting Your Sonarr API Key

1. Open your Sonarr web interface
2. Navigate to **Settings → General**
3. Scroll down to **Security** section
4. Copy the **API Key** value
5. Paste it into your `.env` file as `SONARR_API_KEY`

#### Verification

Test your setup with:

```bash
# Local installation
npm run start -- --test

# Docker installation
docker logs sonarr-mcp-server
```

## Usage

### Running the MCP Server

#### Development Mode

```bash
# Start with hot reload
npm run dev

# Start with debug logging
MCP_LOG_LEVEL=DEBUG npm run dev
```

#### Production Mode

```bash
# Start the built server
npm start

# Or run directly
node dist/index.js
```

#### Docker Mode

```bash
# Run with Docker
docker run -d \
  --name sonarr-mcp-server \
  --env-file .env \
  ghcr.io/jacques-murray/sonarr-mcp-server:latest

# View logs
docker logs -f sonarr-mcp-server
```

The server communicates via stdio (standard input/output) following the MCP protocol specification.

### Integrating with AI Assistants

The MCP server can be integrated with various AI assistants that support the Model Context Protocol:

#### Claude Desktop

Add this configuration to your [`claude_desktop_config.json`](https://claude.ai/docs/mcp) file:

```json
{
  "mcpServers": {
    "sonarr": {
      "command": "node",
      "args": ["/absolute/path/to/sonarr-mcp-server/dist/index.js"],
      "env": {
        "SONARR_API_URL": "http://localhost:8989",
        "SONARR_API_KEY": "your_api_key_here",
        "MCP_LOG_LEVEL": "INFO"
      }
    }
  }
}
```

#### Continue.dev

Add to your [`config.json`](https://continue.dev/docs/reference/config):

```json
{
  "mcpServers": {
    "sonarr": {
      "transport": {
        "type": "stdio"
      },
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

#### Using with Docker

For Docker-based AI assistants, mount the container or use network connections:

```json
{
  "mcpServers": {
    "sonarr": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "--env-file", "/path/to/.env",
        "ghcr.io/jacques-murray/sonarr-mcp-server:latest"
      ]
    }
  }
}
```

### Basic Usage Examples

Once integrated, you can interact with Sonarr using natural language:

```text
"Add Breaking Bad to my collection using HD-1080p quality"
"Show me what's downloading right now"
"Search for missing episodes of The Office"
"What episodes are coming up this week?"
"Remove the series 'Lost' but keep the files"
```

## API Documentation

### API Overview

The Sonarr MCP Server provides a comprehensive set of tools and resources that map to Sonarr's API v4 capabilities. All operations are exposed through the MCP protocol, allowing AI assistants to interact with your Sonarr instance naturally.

### Authentication & Connection

- **Base URL**: Configurable via `SONARR_API_URL` environment variable
- **Authentication**: API Key-based authentication via `SONARR_API_KEY`
- **Protocol**: HTTP/HTTPS with optional SSL verification
- **Timeout**: Configurable request timeout (default: 30 seconds)
- **Retries**: Automatic retry logic with exponential backoff (default: 3 retries)

### Error Handling

The server implements comprehensive error handling:

- **Connection Errors**: Automatic retry with backoff
- **Authentication Errors**: Clear error messages for invalid API keys
- **Rate Limiting**: Respects Sonarr's rate limits
- **Validation**: Input validation using [Zod schemas](src/types/index.ts)
- **Logging**: Structured logging with configurable levels

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

```text
Add "Breaking Bad" to my collection using HD-1080p quality profile in the /tv folder
```

#### `list_series`

List all series with optional filtering.

**Parameters:**

- `monitored`: Filter by monitoring status
- `status`: Filter by series status
- `search`: Search by title

**Example:**

```text
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

```text
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

```text
Show me the current download queue
```

### System Information

#### `system_status`

Get Sonarr system status and health.

**Example:**

```text
What's the current status of my Sonarr system?
```

#### `get_calendar`

View upcoming episodes.

**Parameters:**

- `start`: Start date (YYYY-MM-DD)
- `end`: End date (YYYY-MM-DD)
- `unmonitored`: Include unmonitored episodes

**Example:**

```text
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

```text
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

```text
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

```text
User: What's currently downloading?
Assistant: Here's your current download queue:

📥 Active Downloads (3 items):
1. "House of the Dragon S02E08" - 85% complete (5 minutes remaining)
2. "The Bear S03E01" - 45% complete (12 minutes remaining)
3. "Stranger Things S05E01" - 10% complete (45 minutes remaining)

All downloads are progressing normally.
```

## Development Setup

### Development Prerequisites

- **Node.js**: 18.0.0+ (LTS recommended)
- **npm**: 8.0.0+ (or equivalent package manager)
- **TypeScript**: 5.3+ (included in dev dependencies)
- **Git**: For version control

### Development Environment

1. **Clone and setup:**

```bash
git clone https://github.com/Jacques-Murray/sonarr-mcp-server.git
cd sonarr-mcp-server
npm install
```

1. **Environment configuration:**

```bash
cp .env.example .env
# Edit .env with your development Sonarr instance details
```

1. **Development scripts:**

```bash
# Start development server with hot reload
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Testing

The project uses [Jest](https://jestjs.io/) for comprehensive testing:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report (generates local coverage reports)
npm run test -- --coverage

# Run specific test file
npm test -- tests/sonarr-client.test.ts

# Run tests with specific timeout
npm test -- --testTimeout=15000
```

#### Test Structure

- **Unit Tests**: [`tests/`](tests/) directory contains unit tests for all modules
- **Integration Tests**: Test actual Sonarr API interactions (requires test instance)
- **Coverage**: Minimum 80% coverage requirement enforced in CI/CD, reports generated locally
- **Test Environment**: Uses [`jest-environment-node`](tests/setup.ts) for proper Node.js simulation

#### Local Coverage Reports

When running tests with coverage, Jest generates comprehensive reports locally:

```bash
# Generate coverage reports in ./coverage/ directory
npm test -- --coverage

# View HTML coverage report (generated in ./coverage/lcov-report/index.html)
# Open in browser to see detailed line-by-line coverage
```

Coverage reports include:

- **Line Coverage**: Percentage of code lines executed
- **Branch Coverage**: Percentage of code branches taken
- **Function Coverage**: Percentage of functions called
- **Statement Coverage**: Percentage of statements executed

### Code Quality

#### Linting

The project uses [ESLint](eslint.config.js) with TypeScript support:

```bash
# Check for linting errors
npm run lint

# Fix auto-fixable linting errors
npm run lint:fix

# Lint specific files
npx eslint src/**/*.ts
```

#### Type Checking

```bash
# Run TypeScript compiler check
npx tsc --noEmit

# Build with type checking
npm run build
```

#### Code Formatting

The project follows consistent coding standards:

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Trailing Commas**: ES5 compatible
- **Line Endings**: LF (Unix-style)

### Project Structure

```text
sonarr-mcp-server/
├── src/                    # Source code
│   ├── api/               # Sonarr API client
│   ├── config/            # Configuration and environment
│   ├── resources/         # MCP resources implementation
│   ├── tools/             # MCP tools implementation
│   ├── types/             # TypeScript type definitions
│   ├── index.ts           # Main entry point
│   └── mcp-server.ts      # MCP server implementation
├── tests/                 # Test files
├── dist/                  # Built JavaScript (generated)
├── .github/workflows/     # CI/CD configuration
├── Dockerfile             # Docker configuration
└── package.json           # Project configuration
```

### Building

```bash
# Clean previous builds
npm run clean

# Build TypeScript to JavaScript
npm run build

# Verify build output
ls -la dist/
```

The build process:

1. Cleans the `dist/` directory
2. Compiles TypeScript using [`tsconfig.json`](tsconfig.json)
3. Generates source maps for debugging
4. Creates type declaration files (.d.ts)

## Docker Usage

### Development with Docker

#### Quick Development Setup

```bash
# Build development image
docker build -t sonarr-mcp-server:dev .

# Run development container
docker run -it --rm \
  --env-file .env \
  -v $(pwd)/src:/usr/src/app/src \
  sonarr-mcp-server:dev npm run dev
```

#### Production Docker Deployment

```bash
# Pull latest production image
docker pull ghcr.io/jacques-murray/sonarr-mcp-server:latest

# Run production container
docker run -d \
  --name sonarr-mcp-server \
  --restart unless-stopped \
  --env-file .env \
  --health-cmd="node -e 'console.log(\"Health check passed\")'" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  ghcr.io/jacques-murray/sonarr-mcp-server:latest
```

### Docker Compose for Full Stack

Create a complete setup with Sonarr and the MCP server:

```yaml
# docker-compose.yml
version: '3.8'

services:
  sonarr-mcp-server:
    image: ghcr.io/jacques-murray/sonarr-mcp-server:latest
    container_name: sonarr-mcp-server
    environment:
      - SONARR_API_URL=http://sonarr:8989
      - SONARR_API_KEY=${SONARR_API_KEY}
      - MCP_LOG_LEVEL=${MCP_LOG_LEVEL:-INFO}
      - SONARR_VERIFY_SSL=false
    volumes:
      - ./logs:/usr/src/app/logs:rw
    restart: unless-stopped
    depends_on:
      sonarr:
        condition: service_healthy
    networks:
      - sonarr-network

  sonarr:
    image: linuxserver/sonarr:latest
    container_name: sonarr
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=${TZ:-UTC}
    volumes:
      - ./sonarr-config:/config
      - ./tv:/tv
      - ./downloads:/downloads
    ports:
      - "8989:8989"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8989/api/v3/system/status"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - sonarr-network

networks:
  sonarr-network:
    driver: bridge
```

### Docker Build Optimization

The [`Dockerfile`](Dockerfile) uses multi-stage builds for optimization:

- **Builder Stage**: Installs dev dependencies, builds TypeScript, runs tests
- **Production Stage**: Only includes runtime dependencies and built code
- **Security**: Runs as non-root user (`sonarr-mcp`)
- **Signal Handling**: Uses `dumb-init` for proper signal handling
- **Health Checks**: Built-in health check functionality

### Container Management

```bash
# Build custom image
docker build -t sonarr-mcp-server:custom .

# Run with custom configuration
docker run -d \
  --name sonarr-mcp-server \
  -e SONARR_API_URL=http://host.docker.internal:8989 \
  -e SONARR_API_KEY=your_key_here \
  -e MCP_LOG_LEVEL=DEBUG \
  --add-host=host.docker.internal:host-gateway \
  sonarr-mcp-server:custom

# View logs
docker logs -f sonarr-mcp-server

# Execute shell in container
docker exec -it sonarr-mcp-server sh

# Stop and remove
docker stop sonarr-mcp-server
docker rm sonarr-mcp-server
```

## CI/CD Information

### GitHub Actions Workflow

The project uses a comprehensive CI/CD pipeline defined in [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml):

#### Workflow Triggers

- **Push**: `main`, `develop`, `release/*` branches
- **Pull Request**: Target branches `main`, `develop`
- **Release**: Published releases trigger deployment

#### Build Matrix

The pipeline tests across multiple environments:

- **Node.js Versions**: 18.x, 20.x, 22.x
- **Operating Systems**: Ubuntu Latest, Windows Latest, macOS Latest
- **Test Coverage**: Comprehensive local coverage reporting

#### Pipeline Stages

1. **Code Quality & Security**
   - ESLint code linting
   - TypeScript type checking
   - Security audit (`npm audit`)
   - Dependency vulnerability scanning

2. **Testing Matrix**
   - Cross-platform testing
   - Coverage reporting
   - Test artifact archival
   - Environment validation

3. **Build & Artifacts**
   - TypeScript compilation
   - Build verification
   - Artifact generation and storage

4. **Docker Build** (main branch only)
   - Multi-platform Docker builds (AMD64, ARM64)
   - GitHub Container Registry publishing
   - Image metadata and tagging

5. **Release Management**
   - Automated changelog generation
   - Release asset creation
   - Version tagging and publishing

6. **Deployment Preview** (PR only)
   - Build artifact preview
   - Deployment readiness verification

7. **Notifications**
   - Workflow status summaries
   - Failure notifications and debugging info

#### Environment Variables

The CI/CD pipeline uses these environment variables:

```yaml
env:
  NODE_ENV: test
  SONARR_API_URL: http://localhost:8989
  SONARR_API_KEY: test-api-key
  MCP_LOG_LEVEL: ERROR
```

#### Artifacts & Caching

- **npm Cache**: Automatic dependency caching
- **Build Artifacts**: 30-day retention for builds
- **Test Results**: 7-day retention across all platforms
- **Docker Layer Caching**: GitHub Actions cache for faster builds

### Release Process

#### Automated Releases

1. **Version Bumping**: Update version in [`package.json`](package.json)
2. **Release Branch**: Create `release/vX.Y.Z` branch
3. **Automatic Build**: CI/CD pipeline builds and tests
4. **Docker Publishing**: Multi-platform images published to GHCR
5. **GitHub Release**: Automated release with changelog
6. **Asset Distribution**: Packaged binaries (.tar.gz, .zip)

#### Manual Release Commands

```bash
# Create release branch
git checkout -b release/v1.1.0

# Update version
npm version patch  # or minor, major

# Push release branch
git push origin release/v1.1.0

# CI/CD will handle the rest automatically
```

### Deployment Strategies

#### GitHub Container Registry

Images are automatically published to GitHub Container Registry:

```bash
# Pull latest
docker pull ghcr.io/jacques-murray/sonarr-mcp-server:latest

# Pull specific version
docker pull ghcr.io/jacques-murray/sonarr-mcp-server:v1.0.0

# Pull development builds
docker pull ghcr.io/jacques-murray/sonarr-mcp-server:main-abc1234
```

#### Integration Testing

The pipeline includes integration testing against actual Sonarr instances:

- **Mock API Testing**: Unit tests with mocked Sonarr responses
- **Integration Testing**: Real API calls in controlled environment
- **End-to-End Testing**: Full MCP protocol testing with sample clients

## Configuration

### Environment Variable Configuration

The server supports comprehensive configuration through environment variables. See [`.env.example`](.env.example) for a complete template.

#### Sonarr Connection (Required)

| Variable | Default | Description | Example |
|----------|---------|-------------|---------|
| `SONARR_API_URL` | `http://localhost:8989` | Base URL for Sonarr server | `https://sonarr.example.com` |
| `SONARR_API_KEY` | - | **Required** API key for authentication | `a1b2c3d4e5f6...` |

#### Connection Settings (Optional)

| Variable | Default | Description | Values |
|----------|---------|-------------|--------|
| `SONARR_TIMEOUT` | `30` | Request timeout in seconds | `10-300` |
| `SONARR_MAX_RETRIES` | `3` | Maximum retry attempts for failed requests | `0-10` |
| `SONARR_VERIFY_SSL` | `true` | Verify SSL certificates | `true`, `false` |

#### MCP Server Configuration (Optional)

| Variable | Default | Description | Values |
|----------|---------|-------------|--------|
| `MCP_LOG_LEVEL` | `INFO` | Logging verbosity level | `ERROR`, `WARN`, `INFO`, `DEBUG` |
| `MCP_SERVER_NAME` | `sonarr-server` | Server identifier for MCP clients | Any string |
| `MCP_SERVER_VERSION` | `1.0.0` | Version reported to MCP clients | Semantic version |

#### Feature Flags (Optional)

| Variable | Default | Description | Values |
|----------|---------|-------------|--------|
| `ENABLE_FILE_OPERATIONS` | `false` | Allow file system operations | `true`, `false` |
| `ENABLE_SYSTEM_COMMANDS` | `true` | Allow system command execution | `true`, `false` |
| `MAX_CONCURRENT_REQUESTS` | `10` | Maximum concurrent API requests | `1-50` |

### Configuration Files

#### Environment File

Create a [`.env`](.env.example) file in the project root:

```bash
# Copy the example
cp .env.example .env

# Edit with your settings
nano .env  # or your preferred editor
```

#### TypeScript Configuration

The project uses [`tsconfig.json`](tsconfig.json) for TypeScript compilation:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### Sonarr Setup

#### Getting Your API Key

1. Open your Sonarr web interface
2. Navigate to **Settings → General**
3. Scroll down to **Security** section
4. Copy the **API Key** value
5. Add it to your `.env` file as `SONARR_API_KEY`

#### Required Permissions

The API key needs access to:

- **Series Management**: Add, edit, delete series
- **Episode Operations**: Search, monitor episodes
- **Queue Management**: View and manage downloads
- **System Information**: Health checks and status
- **Calendar Access**: Upcoming episodes

#### Network Configuration

Ensure the MCP server can reach Sonarr:

```bash
# Test connectivity
curl -H "X-Api-Key: YOUR_API_KEY" \
  http://your-sonarr-url:8989/api/v3/system/status

# Expected response
{
  "appName": "Sonarr",
  "instanceName": "Sonarr",
  "version": "4.0.0.746",
  "buildTime": "2024-01-01T00:00:00Z",
  "isDebug": false,
  "isProduction": true,
  "isAdmin": true,
  "isUserInteractive": false,
  "startupPath": "/app/sonarr/bin",
  "appData": "/config",
  "osName": "ubuntu",
  "osVersion": "22.04",
  "isMonoRuntime": false,
  "isMono": false,
  "isLinux": true,
  "isOsx": false,
  "isWindows": false,
  "mode": "console",
  "branch": "main",
  "authentication": "forms",
  "sqliteVersion": "3.40.1",
  "migrationVersion": 228,
  "urlBase": "",
  "runtimeVersion": "8.0.1",
  "runtimeName": ".NET"
}
```

### Logging Configuration

The server uses structured logging with configurable levels:

#### Log Levels

- **ERROR**: Only error messages
- **WARN**: Warnings and errors
- **INFO**: General information, warnings, and errors (default)
- **DEBUG**: Detailed debugging information

#### Log Output

```bash
# Set log level for debugging
MCP_LOG_LEVEL=DEBUG npm start

# Example log output
2024-01-15T10:30:45.123Z [INFO] MCP Server starting...
2024-01-15T10:30:45.456Z [INFO] Sonarr connection established: v4.0.0.746
2024-01-15T10:30:45.789Z [DEBUG] Registered 12 tools and 8 resources
2024-01-15T10:30:46.012Z [INFO] MCP Server ready for connections
```

### Performance Tuning

#### Connection Pool Settings

```env
# Optimize for high-traffic scenarios
MAX_CONCURRENT_REQUESTS=25
SONARR_TIMEOUT=45
SONARR_MAX_RETRIES=5
```

#### Memory Management

```bash
# Increase Node.js memory limit for large libraries
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### Security Configuration

#### SSL/TLS Settings

```env
# For self-signed certificates
SONARR_VERIFY_SSL=false

# For production with valid certificates
SONARR_VERIFY_SSL=true
```

#### API Key Security

- Store API keys in environment variables, never in code
- Use different API keys for different environments
- Rotate API keys regularly
- Monitor API key usage in Sonarr logs

#### Network Security

- Run MCP server on internal networks only
- Use reverse proxies for external access
- Implement proper firewall rules
- Enable audit logging

## Troubleshooting

### Common Issues

#### Connection Problems

#### Connection Refused

```text
Error: connect ECONNREFUSED 127.0.0.1:8989
```

**Solutions:**

1. Verify Sonarr is running: `curl http://localhost:8989`
2. Check the `SONARR_API_URL` in your `.env` file
3. Ensure firewall allows connections to port 8989
4. For Docker: Use `host.docker.internal` instead of `localhost`

#### Network Timeout

```text
Error: Request timeout after 30000ms
```

**Solutions:**

1. Increase timeout: `SONARR_TIMEOUT=60`
2. Check network connectivity
3. Verify Sonarr isn't overloaded

#### Authentication Issues

#### Invalid API Key

```text
Error: 401 Unauthorized - Invalid API Key
```

**Solutions:**

1. Get correct API key from Sonarr: Settings → General → API Key
2. Verify `.env` file has correct `SONARR_API_KEY`
3. Ensure no extra spaces or quotes around the API key
4. Restart the MCP server after changing the API key

#### Permission Denied

```text
Error: 403 Forbidden - Insufficient permissions
```

**Solutions:**

1. Verify API key has admin privileges
2. Check Sonarr authentication settings
3. Ensure Forms authentication is enabled

#### SSL/TLS Issues

#### Certificate Verification Failed

```text
Error: unable to verify the first certificate
```

**Solutions:**

1. For self-signed certificates: `SONARR_VERIFY_SSL=false`
2. Install proper SSL certificates
3. Use HTTP instead of HTTPS for local instances

#### Environment Configuration

#### Missing Environment Variables

```text
Error: SONARR_API_KEY is required
```

**Solutions:**

1. Create `.env` file: `cp .env.example .env`
2. Edit `.env` with your Sonarr details
3. Verify environment variables are loaded: `node -e "console.log(process.env.SONARR_API_KEY)"`

#### MCP Protocol Issues

#### MCP Client Connection Failed

```text
Error: MCP transport error
```

**Solutions:**

1. Verify MCP client configuration
2. Check file paths in client config
3. Ensure executable permissions: `chmod +x dist/index.js`
4. Test standalone: `node dist/index.js`

### Debugging

#### Enable Debug Logging

```bash
# Maximum verbosity
MCP_LOG_LEVEL=DEBUG npm start

# For specific debugging
DEBUG=sonarr:* npm start
```

#### Debug Output Example

```text
2024-01-15T10:30:45.123Z [DEBUG] Environment loaded: {"SONARR_API_URL":"http://localhost:8989"}
2024-01-15T10:30:45.456Z [DEBUG] Sonarr client initialized with timeout: 30000ms
2024-01-15T10:30:45.789Z [DEBUG] Testing connection to Sonarr...
2024-01-15T10:30:46.012Z [INFO] Sonarr connection established: v4.0.0.746
2024-01-15T10:30:46.234Z [DEBUG] Registered tools: ["add_series", "list_series", ...]
2024-01-15T10:30:46.456Z [DEBUG] Registered resources: ["sonarr://series/collection", ...]
2024-01-15T10:30:46.678Z [INFO] MCP Server ready for connections
```

#### Connection Testing

#### Basic Connectivity Test

```bash
# Test MCP server startup
npm run start -- --test

# Test Sonarr API directly
curl -H "X-Api-Key: YOUR_API_KEY" \
  http://localhost:8989/api/v3/system/status

# Test from Docker
docker run --rm \
  -e SONARR_API_URL=http://host.docker.internal:8989 \
  -e SONARR_API_KEY=your_key_here \
  ghcr.io/jacques-murray/sonarr-mcp-server:latest \
  --test
```

#### Network Connectivity Test

```bash
# Test network connectivity
telnet localhost 8989

# Test DNS resolution
nslookup your-sonarr-host

# Test with verbose curl
curl -v -H "X-Api-Key: YOUR_API_KEY" \
  http://localhost:8989/api/v3/system/status
```

#### Configuration Validation

#### Environment Variable Checker

```bash
# Create a test script
cat > test-env.js << 'EOF'
const config = require('./dist/config/config.js');
console.log('Configuration loaded successfully:', config);
EOF

node test-env.js
```

#### Sonarr Version Compatibility

```bash
# Check Sonarr version
curl -H "X-Api-Key: YOUR_API_KEY" \
  http://localhost:8989/api/v3/system/status | jq '.version'

# Required: Sonarr v4.x
# Minimum: v4.0.0.746
```

### Docker-Specific Issues

#### Container Networking

#### Cannot connect to Sonarr from container

```bash
# Use host networking (Linux only)
docker run --network host \
  -e SONARR_API_URL=http://localhost:8989 \
  -e SONARR_API_KEY=your_key_here \
  ghcr.io/jacques-murray/sonarr-mcp-server:latest

# Use host.docker.internal (Windows/Mac)
docker run \
  -e SONARR_API_URL=http://host.docker.internal:8989 \
  -e SONARR_API_KEY=your_key_here \
  ghcr.io/jacques-murray/sonarr-mcp-server:latest
```

#### Volume Permissions

#### Log directory permission issues

```bash
# Fix log directory permissions
sudo chown -R 1001:1001 ./logs

# Or run with current user
docker run --user $(id -u):$(id -g) \
  -v $(pwd)/logs:/usr/src/app/logs \
  ghcr.io/jacques-murray/sonarr-mcp-server:latest
```

### Performance Issues

#### High Memory Usage

#### Memory optimization

```bash
# Limit Node.js memory
NODE_OPTIONS="--max-old-space-size=1024" npm start

# Monitor memory usage
docker stats sonarr-mcp-server
```

#### Request Timeouts

#### Optimize request settings

```env
# Increase timeouts for slow networks
SONARR_TIMEOUT=60
SONARR_MAX_RETRIES=5
MAX_CONCURRENT_REQUESTS=5
```

### Log Analysis

#### Common Error Patterns

#### Rate Limiting

```text
Rate limit exceeded, retrying in 5000ms
```

Solution: Reduce `MAX_CONCURRENT_REQUESTS` or increase `SONARR_TIMEOUT`

#### Memory Leaks

```text
JavaScript heap out of memory
```

Solution: Set `NODE_OPTIONS="--max-old-space-size=2048"`

#### Parse Errors

```text
Unexpected token in JSON at position 0
```

Solution: Check Sonarr API response format, may indicate authentication issues

#### Log File Locations

```bash
# Default log locations
./logs/sonarr-mcp.log          # Application logs
./logs/error.log               # Error logs only
./logs/debug.log               # Debug logs (if enabled)

# Docker logs
docker logs sonarr-mcp-server
docker logs sonarr-mcp-server 2>&1 | grep ERROR
```

### Community Support

#### Before Reporting Issues

1. **Check existing issues**: [GitHub Issues](https://github.com/Jacques-Murray/sonarr-mcp-server/issues)
2. **Enable debug logging**: `MCP_LOG_LEVEL=DEBUG`
3. **Test basic connectivity**: `npm run start -- --test`
4. **Verify Sonarr version**: Must be v4.x
5. **Check configuration**: Ensure all required env vars are set

#### When Reporting Bugs

Include this information:

```bash
# System information
node --version
npm --version
uname -a  # or systeminfo on Windows

# Sonarr information
curl -H "X-Api-Key: YOUR_API_KEY" \
  http://localhost:8989/api/v3/system/status

# MCP Server logs (with sensitive data removed)
MCP_LOG_LEVEL=DEBUG npm start 2>&1 | head -50

# Configuration (remove sensitive values)
cat .env | sed 's/API_KEY=.*/API_KEY=***redacted***/'
```

#### Help Resources

- **GitHub Discussions**: [General questions and discussions](https://github.com/Jacques-Murray/sonarr-mcp-server/discussions)
- **GitHub Issues**: [Bug reports and feature requests](https://github.com/Jacques-Murray/sonarr-mcp-server/issues)
- **Wiki**: [Extended troubleshooting guides](https://github.com/Jacques-Murray/sonarr-mcp-server/wiki)

#### Quick Diagnostics Script

Create a diagnostic script to gather information:

```bash
#!/bin/bash
# save as diagnostic.sh
echo "=== Sonarr MCP Server Diagnostics ==="
echo "Date: $(date)"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "OS: $(uname -a)"
echo ""
echo "=== Environment ==="
cat .env | sed 's/API_KEY=.*/API_KEY=***redacted***/'
echo ""
echo "=== Sonarr Connectivity ==="
curl -s -H "X-Api-Key: $SONARR_API_KEY" \
  "$SONARR_API_URL/api/v3/system/status" | jq '.version,.appName,.isProduction' 2>/dev/null || echo "Connection failed"
echo ""
echo "=== MCP Server Test ==="
timeout 10 npm run start -- --test 2>&1 || echo "MCP server test failed"
```

Run with: `chmod +x diagnostic.sh && ./diagnostic.sh`

## Contributing

We welcome contributions from the community! This project follows standard open-source contribution practices.

### Quick Start for Contributors

1. **Fork and Clone**

   ```bash
   # Fork the repo on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/sonarr-mcp-server.git
   cd sonarr-mcp-server
   
   # Add upstream remote
   git remote add upstream https://github.com/Jacques-Murray/sonarr-mcp-server.git
   ```

2. **Set Up Development Environment**

   ```bash
   # Install dependencies
   npm install
   
   # Copy environment template
   cp .env.example .env
   # Edit .env with your test Sonarr instance details
   
   # Run tests to verify setup
   npm test
   ```

3. **Create Feature Branch**

   ```bash
   # Sync with upstream
   git fetch upstream
   git checkout main
   git merge upstream/main
   
   # Create feature branch
   git checkout -b feature/your-feature-name
   ```

### Development Workflow

#### Code Style and Standards

- **TypeScript**: Strict mode enabled, use proper typing
- **ESLint**: All code must pass linting (`npm run lint`)
- **Formatting**: Use consistent formatting (2 spaces, single quotes)
- **Comments**: Document complex logic and public APIs
- **Naming**: Use descriptive names for functions, variables, and files

#### Testing Requirements

All contributions must include appropriate tests:

```bash
# Run full test suite
npm test

# Run tests with coverage
npm run test -- --coverage

# Run specific test file
npm test -- tests/your-test.test.ts

# Run tests in watch mode during development
npm run test:watch
```

**Test Coverage Requirements:**

- New code must have **≥80% test coverage**
- Critical paths require **≥90% coverage**
- All public APIs must have unit tests
- Integration tests for new Sonarr API endpoints
- Coverage reports generated locally for development

**Local Coverage Development:**

```bash
# Generate and view coverage reports locally
npm test -- --coverage

# Open HTML coverage report in browser
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
start coverage/lcov-report/index.html  # Windows
```

#### Commit Message Guidelines

We follow [Conventional Commits](https://conventionalcommits.org/):

```bash
# Format: type(scope): description
git commit -m "feat(tools): add episode search functionality"
git commit -m "fix(api): handle rate limiting in sonarr client"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(integration): add calendar endpoint tests"
```

**Types:**

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `test`: Test additions/changes
- `refactor`: Code refactoring
- `style`: Code style changes
- `chore`: Build/tooling changes

### Pull Request Process

#### Before Submitting

1. **Sync with upstream:**

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run quality checks:**

   ```bash
   npm run lint          # Fix any linting errors
   npm test              # Ensure all tests pass
   npm run build         # Verify build succeeds
   ```

3. **Update documentation:**
   - Update README.md for new features
   - Add JSDoc comments for new APIs
   - Update type definitions if needed

#### Pull Request Template

When creating a PR, include:

```text
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

#### Review Process

1. **Automated Checks**: CI/CD pipeline runs automatically
2. **Code Review**: Maintainer reviews code quality and design
3. **Testing**: Verify functionality with test Sonarr instance
4. **Documentation**: Ensure adequate documentation
5. **Approval**: At least one maintainer approval required

### Types of Contributions

#### 🐛 Issue Reporting

Use the [issue template](.github/ISSUE_TEMPLATE/bug_report.md):

```text
**Bug Description**
Clear description of the bug.

**Reproduction Steps**
1. Configure environment with...
2. Run command...
3. Expected vs actual behavior...

**Environment**
- OS: [e.g., Ubuntu 22.04]
- Node.js: [e.g., 20.10.0]
- Sonarr: [e.g., 4.0.0.746]
- MCP Server: [e.g., 1.0.0]
```

#### ✨ Feature Requests

Before implementing new features:

1. **Check existing issues** for similar requests
2. **Open a feature request** to discuss the proposal
3. **Wait for maintainer feedback** before implementation
4. **Follow the development workflow** outlined above

#### 📚 Documentation

Documentation improvements are always welcome:

- Fix typos or unclear explanations
- Add missing examples or use cases
- Improve code comments and JSDoc
- Update installation or setup guides

#### 🧪 Testing

Help improve test coverage:

- Add unit tests for uncovered code
- Create integration tests for new scenarios
- Test edge cases and error conditions
- Performance and load testing

### Code Review Guidelines

#### For Contributors

- **Keep PRs focused**: One feature/fix per PR
- **Write clear descriptions**: Explain what and why
- **Respond to feedback**: Address review comments promptly
- **Test thoroughly**: Both positive and negative cases

#### For Reviewers

- **Be constructive**: Suggest improvements, don't just point out problems
- **Focus on code quality**: Readability, maintainability, performance
- **Check test coverage**: Ensure adequate testing
- **Verify documentation**: Make sure docs match the code

### Development Guidelines

#### Adding New MCP Tools

When adding new Sonarr functionality:

1. **Define the tool schema** in [`src/tools/index.ts`](src/tools/index.ts)
2. **Implement the handler** with proper error handling
3. **Add comprehensive tests** in [`tests/tools.test.ts`](tests/tools.test.ts)
4. **Update documentation** with usage examples
5. **Test with real Sonarr instance**

#### Adding New MCP Resources

For new data resources:

1. **Define resource URI** in [`src/resources/index.ts`](src/resources/index.ts)
2. **Implement data fetching** with caching if appropriate
3. **Add tests** in [`tests/resources.test.ts`](tests/resources.test.ts)
4. **Document resource format** and update README

#### Modifying Sonarr API Client

Changes to [`src/api/sonarr-client.ts`](src/api/sonarr-client.ts):

1. **Follow existing patterns** for consistency
2. **Add proper TypeScript types** for all responses
3. **Implement error handling** and retry logic
4. **Test with multiple Sonarr versions** if possible
5. **Update integration tests**

### Getting Help

#### Community Resources

- **GitHub Discussions**: Ask questions and discuss ideas
- **Issues**: Report bugs and request features
- **Wiki**: Extended documentation and guides

#### Contact Maintainers

- **GitHub**: [@Jacques-Murray](https://github.com/Jacques-Murray)
- **Issues**: Tag maintainers in issues when needed
- **Email**: Available in git commit history

### Recognition

Contributors are recognized in:

- **GitHub Contributors**: Automatic recognition
- **Release Notes**: Major contributions highlighted
- **Documentation**: Contributor acknowledgments

Thank you for contributing to the Sonarr MCP Server project! 🎉

## License

This project is licensed under the **MIT License** - see the [`LICENSE`](LICENSE) file for complete details.

### MIT License Summary

- ✅ **Commercial use**: Use in commercial projects
- ✅ **Modification**: Modify the source code
- ✅ **Distribution**: Distribute the software
- ✅ **Private use**: Use privately
- ❌ **Liability**: No warranty or liability
- ❌ **Warranty**: No warranty provided

### License Terms

```text
MIT License

Copyright (c) 2024 Jacques Murray

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Acknowledgments

### Core Technologies

- **[Sonarr](https://sonarr.tv/)** - Excellent TV series management software that makes this integration possible
- **[Model Context Protocol](https://modelcontextprotocol.io/)** - Revolutionary standard for AI assistant integrations
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript that powers this implementation
- **[Node.js](https://nodejs.org/)** - Runtime environment enabling server-side execution

### Development Tools

- **[Jest](https://jestjs.io/)** - Comprehensive testing framework
- **[ESLint](https://eslint.org/)** - Code quality and style enforcement
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD automation
- **[Docker](https://www.docker.com/)** - Containerization and deployment

### Community & Libraries

- **[@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)** - Official MCP SDK
- **[Axios](https://axios-http.com/)** - HTTP client for API communication
- **[Zod](https://zod.dev/)** - Runtime type validation
- **[Winston](https://github.com/winstonjs/winston)** - Logging infrastructure

### Special Thanks

- **Open Source Community** - For invaluable tools, libraries, and inspiration
- **Sonarr Development Team** - For creating and maintaining excellent software
- **MCP Working Group** - For developing the Model Context Protocol standard
- **Contributors** - Everyone who helps improve this project

## Support & Community

### Support Resources

#### 🐛 Bug Reports

Found a bug? Please report it through our issue tracker:

- **GitHub Issues**: [Report Bug](https://github.com/Jacques-Murray/sonarr-mcp-server/issues/new?template=bug_report.md)
- **Include**: Environment details, reproduction steps, expected vs actual behavior
- **Response Time**: Usually within 48 hours

#### 💬 General Discussion

Have questions or want to discuss features?

- **GitHub Discussions**: [Join the Conversation](https://github.com/Jacques-Murray/sonarr-mcp-server/discussions)
- **Topics**: Feature requests, usage questions, integration help
- **Community**: Connect with other users and contributors

#### 📖 Documentation

Comprehensive guides and references:

- **Wiki**: [Extended Documentation](https://github.com/Jacques-Murray/sonarr-mcp-server/wiki)
- **API Reference**: [Tool and Resource Documentation](https://github.com/Jacques-Murray/sonarr-mcp-server/wiki/API-Reference)
- **Examples**: [Usage Examples and Tutorials](https://github.com/Jacques-Murray/sonarr-mcp-server/wiki/Examples)

### Project Resources

#### 🚀 Quick Links

- **Repository**: [GitHub](https://github.com/Jacques-Murray/sonarr-mcp-server)
- **Releases**: [Latest Versions](https://github.com/Jacques-Murray/sonarr-mcp-server/releases)
- **Docker Images**: [GitHub Container Registry](https://github.com/Jacques-Murray/sonarr-mcp-server/pkgs/container/sonarr-mcp-server)
- **CI/CD Status**: [GitHub Actions](https://github.com/Jacques-Murray/sonarr-mcp-server/actions)

#### 📊 Project Status

- **Build Status**: [![CI/CD](https://github.com/Jacques-Murray/sonarr-mcp-server/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Jacques-Murray/sonarr-mcp-server/actions/workflows/ci-cd.yml)
- **Latest Release**: [![GitHub release](https://img.shields.io/github/v/release/Jacques-Murray/sonarr-mcp-server)](https://github.com/Jacques-Murray/sonarr-mcp-server/releases)

#### 🤝 Contributing

Want to contribute? We'd love your help!

- **Contributing Guide**: [How to Contribute](https://github.com/Jacques-Murray/sonarr-mcp-server#contributing)
- **Good First Issues**: [Beginner-Friendly Tasks](https://github.com/Jacques-Murray/sonarr-mcp-server/labels/good%20first%20issue)
- **Development Setup**: [Local Development Guide](https://github.com/Jacques-Murray/sonarr-mcp-server#development-setup)

### Maintenance & Updates

#### Release Schedule

- **Major Releases**: Every 3-6 months with significant new features
- **Minor Releases**: Monthly with feature additions and improvements
- **Patch Releases**: As needed for bug fixes and security updates
- **LTS Support**: Long-term support for major versions

#### Compatibility

- **Sonarr**: v4.0.0+ (actively tested with latest versions)
- **Node.js**: 18.x, 20.x, 22.x (LTS versions recommended)
- **MCP Protocol**: v1.x (following specification updates)
- **Operating Systems**: Linux, macOS, Windows

#### Security

- **Security Policy**: [Security Guidelines](https://github.com/Jacques-Murray/sonarr-mcp-server/security/policy)
- **Vulnerability Reporting**: [security@example.com](mailto:security@example.com)
- **Dependency Updates**: Automated dependency scanning and updates
- **Security Audits**: Regular security reviews and penetration testing

---

### Made with ❤️ for the Sonarr and AI Automation Community

**[⭐ Star this project](https://github.com/Jacques-Murray/sonarr-mcp-server)** if you find it useful!

**[🍴 Fork and contribute](https://github.com/Jacques-Murray/sonarr-mcp-server/fork)** to help make it even better!

**[📢 Share with others](https://twitter.com/intent/tweet?text=Check%20out%20this%20awesome%20Sonarr%20MCP%20Server%21&url=https%3A//github.com/Jacques-Murray/sonarr-mcp-server)** who might benefit from AI-powered Sonarr management!

---

[![GitHub stars](https://img.shields.io/github/stars/Jacques-Murray/sonarr-mcp-server?style=social)](https://github.com/Jacques-Murray/sonarr-mcp-server/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Jacques-Murray/sonarr-mcp-server?style=social)](https://github.com/Jacques-Murray/sonarr-mcp-server/network/members)
[![GitHub watchers](https://img.shields.io/github/watchers/Jacques-Murray/sonarr-mcp-server?style=social)](https://github.com/Jacques-Murray/sonarr-mcp-server/watchers)
