# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Available MCP Servers

### Context7 AI Analysis Server

This project has Context7 MCP server configured, providing advanced AI analysis capabilities for images and videos through the Model Context Protocol.

**Capabilities:**

- Advanced image analysis and description
- Video content analysis
- AI-powered visual content understanding

**Setup:**

```bash
# API Key (get your key from context7.com)
export CONTEXT7_API_KEY="your_context7_api_key_here"

# MCP server is registered at project level in ~/.claude.json
# Server endpoint: https://mcp.context7.com/mcp
```

**Security Note:** API key is stored securely in environment variables and project configuration. Never commit API keys to version control.

**Usage:**
The Context7 tools are automatically available when working in this project directory. Use the Context7 MCP tools for analyzing visual content, generating detailed descriptions, and extracting insights from images and videos.

## Repository Overview

This is a Pinterest Video Downloader - a dual-mode Node.js application that provides both CLI and web interface for downloading videos from Pinterest. The application extracts video URLs from Pinterest pages using multiple scraping techniques and downloads them with progress tracking. It also includes a React frontend with liquid glass visual effects.

## Development Setup

Install dependencies:

```bash
npm install
```

## Common Commands

### CLI Mode

```bash
# Run CLI interface
npm run cli <Pinterest URL>
# Example:
npm run cli "https://pinterest.com/pin/1234567890"

# Development mode with auto-restart
npm run dev:cli <Pinterest URL>
```

### Web Server Mode

```bash
# Start web server (default port 3001)
npm start
# or
npm run web

# Development mode with auto-restart
npm run dev
```

### React Frontend Development

```bash
# Start Vite development server for React frontend (port 3002)
npm run react
npm run react:dev

# Build React frontend for production
npm run react:build

# Preview production build
npm run react:preview
```

**Note**: The Vite dev server runs on port 3002 and proxies API calls to the Express server on port 3001.

### Download with custom options (CLI)

```bash
npm run cli <URL> -- --output ./my-videos --quality high
```

## Project Architecture

### Key Components

- **src/index.js**: CLI entry point with Russian interface and yargs argument parsing
- **src/server.js**: Express web server with REST API endpoints (runs on port 3002)
- **src/downloader.js**: Core Pinterest video extraction and download logic
- **src/App.tsx**: React main application component
- **src/components/LiquidGlassDemo.tsx**: Liquid glass visual effect demo component
- **src/components/LiquidEther.tsx**: 3D liquid ether visualization using Three.js
- **src/main.tsx**: React application entry point
- **src/lib/utils.ts**: Utility functions for React components
- **src/index.css**: Global styles with Tailwind CSS
- **downloads/**: Default directory for downloaded videos (auto-created)
- **public/**: Frontend static files (referenced by server)

### Dual Frontend Architecture

The project serves both:

1. **Static HTML interface** via Express server (traditional web interface)
2. **React SPA** via Vite development server (modern frontend with visual effects)

### Video Extraction Strategy

The application uses a multi-layered approach with fallback methods:

1. **DOM Data Extraction**: Scrapes embedded JSON data from `__INITIAL_STATE__` and `__PWS_DATA__` script tags
2. **Pattern Matching**: Searches HTML content for video URL patterns using regex
3. **HTML Video Elements**: Extracts URLs from `<video>` tags and `<source>` elements
4. **Fallback API**: Placeholder for future Pinterest API integration

### Web Server API Endpoints

- `POST /api/download`: Download video with quality selection
- `POST /api/info`: Get video information without downloading
- `GET /api/health`: Server health check
- `GET /api/stats`: Download statistics
- `GET /`: Main web interface (serves static HTML)
- `GET /downloads/*`: Serve downloaded files

### Key Dependencies

#### Backend

- **axios**: HTTP client with browser header simulation and timeout handling
- **cheerio**: Server-side HTML parsing and DOM manipulation
- **express**: Web server framework with CORS and JSON parsing middleware
- **yargs**: Command line argument parsing with Russian help text
- **progress**: CLI download progress bars
- **fs-extra**: Enhanced file system operations with promises
- **multer**: File upload handling (for future features)
- **cors**: Cross-origin resource sharing

#### Frontend (React)

- **React 19**: Modern React with TypeScript support
- **TypeScript**: Type safety and better development experience
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Three.js**: 3D graphics library for liquid visual effects
- **Lucide React**: Modern icon library
- **Class Variance Authority**: Utility for component variants
- **Liquid Glass React**: Specialized library for liquid glass effects
- **Tailwind Merge**: Utility for merging Tailwind classes

### Error Handling

- Network timeout protection (15 seconds for scraping, no timeout for downloads)
- Comprehensive error categorization with appropriate HTTP status codes
- Download failure cleanup with partial file removal
- Graceful degradation across multiple extraction methods
- File existence checking to prevent duplicate downloads

### Browser Simulation

The application uses sophisticated browser header simulation to avoid Pinterest blocking:

- Chrome User-Agent with realistic sec-ch-ua headers
- Complete browser request headers including Accept-Language and caching
- Referer headers for video download requests

### Visual Effects Architecture

The React frontend features advanced visual effects:

- **Liquid Glass Demo**: Interactive liquid glass morphing effects
- **Liquid Ether**: 3D animated liquid simulation using Three.js shaders
- **Responsive Design**: Mobile-optimized interface with Tailwind CSS
- **Modern UI Components**: Clean, minimalist design with smooth animations

## Important Notes

- **Dual Interface**: Application serves both CLI and web server modes
- **Dual Frontend**: Supports both traditional HTML and modern React interfaces
- **Russian Language**: CLI interface and logs are in Russian
- **Port Configuration**: Express server runs on port 3001, Vite dev server on port 3002
- **Auto-restart**: Development scripts use Node.js --watch flag
- **File Caching**: Server checks for existing files before re-downloading
- **Quality Selection**: Supports high/medium/low quality preferences
- **URL Validation**: Validates Pinterest video URLs and video file extensions
- **Progress Tracking**: CLI shows progress bars, web API returns file statistics
- **Graceful Shutdown**: Server handles SIGTERM and SIGINT signals
- **Modern Tooling**: Uses Vite for fast frontend development builds

## Testing

### CLI Testing

```bash
npm run cli "https://pinterest.com/pin/YOUR_PIN_ID"
```

### Web Server Testing

```bash
npm start
# Then access http://localhost:3001
# Or test API: curl -X POST http://localhost:3001/api/info -H "Content-Type: application/json" -d '{"url":"YOUR_PIN_URL"}'
```

### React Frontend Testing

```bash
npm run react:dev
# Then access the Vite dev server at http://localhost:3002
```

## Pinterest URL Format

Valid URLs should match Pinterest pin patterns across international domains:

- `https://pinterest.com/pin/[PIN_ID]`
- `https://www.pinterest.com/pin/[PIN_ID]`
- `https://pinterest.it/pin/[PIN_ID]` (and other country domains)
- `https://pin.it/[SHORT_CODE]` (shortened URLs)

## File Management

- Downloaded files use sanitized titles with timestamps
- Default output directory: `./downloads/`
- Supported video formats: mp4, mov, webm, avi, m4v
- File size reporting in MB through API responses
- Automatic cleanup of failed downloads

## Development Workflow

1. **Backend Development**: Use `npm run dev` for Express server (port 3001) with hot reload
2. **Frontend Development**: Use `npm run react:dev` for Vite React development server (port 3002)
3. **Full Stack Testing**: Run both servers concurrently for complete application testing
4. **Production Build**: Use `npm run react:build` then `npm start` for production deployment

## Port Configuration

- **Express Server**: Port 3001 (main backend API)
- **Vite Dev Server**: Port 3002 (React frontend with API proxy to port 3001)
- **API Proxy**: React dev server proxies `/api/*` requests to `http://localhost:3001`

## Build Output

- React production builds are output to `dist/` directory
- Downloaded videos are saved to `downloads/` directory (auto-created)
- Static HTML files are served from `public/` directory by Express server

- Отвечай на русском языке
