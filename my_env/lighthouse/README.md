# WebOptEnv - Web Optimization Environment MCP Server

An MCP (Model Context Protocol) server that accepts HTML files, serves them locally, and runs Lighthouse audits for web performance optimization.

## Features

- **Serve HTML Files**: Accept HTML content and serve it on a local web server
- **Lighthouse Auditing**: Run comprehensive Lighthouse audits on served files
- **Docker Support**: Fully containerized with Chrome and all dependencies
- **MCP Protocol**: Standard MCP server interface for easy integration

## Quick Start with Docker

### Build the Docker Image

```bash
docker build -t web-opt-env-mcp .
```

### Run the Container

```bash
docker run -i web-opt-env-mcp
```

The server runs on stdio and communicates via the MCP protocol.

## Available Tools

### 1. `deploy_zip`

Accepts a base64-encoded zip file, extracts it, and serves the application. Automatically detects and handles Node.js projects or static sites.

**Parameters:**
- `zip_content` (required): Base64-encoded zip file content
- `port` (optional): Port number to serve on (defaults to `8080`)

**Returns:**
```json
{
  "success": true,
  "port": 8080,
  "message": "Application deployed and serving on port 8080",
  "output": "..."
}
```

### 2. `serve_html`

Accepts HTML content and serves it on a local web server.

**Parameters:**
- `html_content` (required): The HTML content to serve
- `filename` (optional): Filename for the HTML file (defaults to `index.html`)
- `port` (optional): Port number to serve on (defaults to `8080`)

**Returns:**
```json
{
  "success": true,
  "url": "http://localhost:8080/index.html",
  "port": 8080,
  "filename": "index.html",
  "message": "Server started successfully..."
}
```

### 2. `audit_with_lighthouse`

Runs a Lighthouse audit on the currently served HTML file.

**Parameters:**
- `url` (optional): The URL to audit (defaults to currently served file)
- `categories` (optional): Array of categories to audit. Options:
  - `performance`
  - `accessibility`
  - `best-practices`
  - `seo`
  - `pwa`

**Returns:**
```json
{
  "success": true,
  "audit": {
    "url": "http://localhost:8080/index.html",
    "scores": {
      "performance": { "score": 95, "title": "Performance" },
      "accessibility": { "score": 88, "title": "Accessibility" }
    },
    "metrics": {
      "first-contentful-paint": {
        "title": "First Contentful Paint",
        "displayValue": "0.5 s",
        "score": 0.99
      }
    },
    "opportunities": [...],
    "diagnostics": [...]
  }
}
```

### 3. `stop_server`

Stops the currently running web server and cleans up temporary files.

**Returns:**
```json
{
  "success": true,
  "message": "Server stopped successfully"
}
```

## Usage Example

Here's a typical workflow:

1. **Serve an HTML file:**
```json
{
  "tool": "serve_html",
  "arguments": {
    "html_content": "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello World</h1></body></html>",
    "filename": "test.html",
    "port": 8080
  }
}
```

2. **Run a Lighthouse audit:**
```json
{
  "tool": "audit_with_lighthouse",
  "arguments": {
    "categories": ["performance", "accessibility"]
  }
}
```

3. **Stop the server:**
```json
{
  "tool": "stop_server",
  "arguments": {}
}
```

## Local Development

### Prerequisites

- Node.js 20+
- Chrome/Chromium browser

### Install Dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

### Run Locally

```bash
npm start
```

or for development with watch mode:

```bash
npm run dev
```

## Docker Configuration

The Docker image includes:
- Node.js 20 (slim variant)
- Google Chrome Stable
- All necessary system dependencies for Chrome
- TypeScript compilation
- Express server for serving HTML files
- Lighthouse for auditing

### Environment Variables

- `NODE_ENV`: Set to `production` in Docker
- `CHROME_PATH`: Path to Chrome executable (`/usr/bin/google-chrome-stable`)

### Exposed Ports

- Port `8080`: Default HTTP server port (configurable via `serve_html` tool)

## Architecture

The MCP server provides three main capabilities:

1. **File Serving**: Uses Express.js to serve HTML files from a temporary directory
2. **Lighthouse Integration**: Launches headless Chrome and runs Lighthouse audits
3. **MCP Protocol**: Standard MCP server interface for tool discovery and execution

All operations are performed within the container, ensuring a consistent environment for auditing.

## Integration with MCP Clients

This server can be integrated with any MCP-compatible client. Configure your client to launch the Docker container:

```json
{
  "mcpServers": {
    "web-opt-env": {
      "command": "docker",
      "args": ["run", "-i", "web-opt-env-mcp"]
    }
  }
}
```

## License

MIT
