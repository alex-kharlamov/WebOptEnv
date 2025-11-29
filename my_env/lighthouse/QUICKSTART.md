# WebOptEnv Docker Image - Quick Start Guide

## What was built

A Docker image (`web-opt-env-mcp`) that exposes an MCP server with the ability to:

1. **Accept and deploy ZIP files** - Upload a zip file containing a web application, automatically extract it, install dependencies (if Node.js project), and serve it
2. **Serve HTML files** - Serve individual HTML files for quick testing
3. **Run Lighthouse audits** - Analyze web performance, accessibility, SEO, and best practices
4. **Stop servers** - Clean up running servers

## Docker Image Built Successfully ✅

The image includes:
- Node.js 20
- Google Chrome (for Lighthouse)
- TypeScript MCP server
- Express.js for serving files
- Unzip utility for handling zip files
- Custom deployment script

## How to Use

### 1. Build the Image (Already Done)

```bash
docker build -t web-opt-env-mcp .
```

### 2. Run the Container

```bash
docker run -i --rm -p 8080:8080 web-opt-env-mcp
```

The container:
- Runs in interactive mode (`-i`) for MCP stdio communication
- Auto-removes when stopped (`--rm`)
- Maps port 8080 for accessing served files (`-p 8080:8080`)

### 3. Configure in MCP Client

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "web-opt-env": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-p", "8080:8080", "web-opt-env-mcp"]
    }
  }
}
```

## Available MCP Tools

### `deploy_zip`
Deploy a complete web application from a zip file.

**Input:**
- `zip_content`: Base64-encoded zip file
- `port`: (optional) Port number (default: 8080)

**What it does:**
1. Extracts the zip file
2. Detects if it's a Node.js project (package.json)
3. Installs dependencies with `npm install`
4. Runs build script if present
5. Starts server with `npm start` or serves static files

### `serve_html`
Serve a single HTML file.

**Input:**
- `html_content`: HTML content as string
- `filename`: (optional) Filename (default: index.html)
- `port`: (optional) Port number (default: 8080)

### `audit_with_lighthouse`
Run Lighthouse audit on served content.

**Input:**
- `url`: (optional) URL to audit (defaults to currently served file)
- `categories`: (optional) Array of categories to audit

**Returns:**
- Scores for each category (0-100)
- Performance metrics (FCP, LCP, TBT, CLS, etc.)
- Opportunities for improvement
- Diagnostics

### `stop_server`
Stop the currently running web server and clean up.

## Command Line Deployment Script

The image also includes a standalone script for deploying zip files:

```bash
docker run -it --rm -p 8080:8080 web-opt-env-mcp \
  /usr/local/bin/deploy-and-serve --zip /path/to/app.zip --port 8080
```

## Example Workflow

1. **Deploy a web app from zip:**
   ```
   Call deploy_zip with base64-encoded zip content
   → App is extracted, built, and served on port 8080
   ```

2. **Run Lighthouse audit:**
   ```
   Call audit_with_lighthouse
   → Returns performance scores and optimization suggestions
   ```

3. **Access the app:**
   ```
   Open http://localhost:8080 in your browser
   ```

4. **Clean up:**
   ```
   Call stop_server
   → Server stopped, temp files cleaned
   ```

## Files Created

- `Dockerfile` - Docker image definition
- `package.json` - Node.js dependencies
- `tsconfig.json` - TypeScript configuration
- `src/index.ts` - MCP server implementation
- `deploy-and-serve.sh` - Deployment script
- `README.md` - Full documentation
- `build.sh` - Build helper script
- `test-container.sh` - Test script
- `mcp-config.json` - Example MCP configuration

## Next Steps

1. Test the container: `./test-container.sh`
2. Integrate with your MCP client
3. Deploy your first web application
4. Run Lighthouse audits and optimize!

## Troubleshooting

**Port already in use:**
Change the port mapping: `-p 9000:8080`

**Chrome fails to launch:**
Ensure Docker has enough resources allocated (minimum 2GB RAM recommended)

**Zip extraction fails:**
Verify the zip file is valid and properly base64-encoded
