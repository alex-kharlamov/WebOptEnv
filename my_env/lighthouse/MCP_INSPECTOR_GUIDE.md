# Testing with MCP Inspector

The MCP Inspector is a developer tool for testing and debugging MCP servers. Here's how to use it with the WebOptEnv OpenEnv environment.

## Option 1: Test with OpenEnv (Recommended)

### Using the Combined Docker Image

The WebOptEnv environment is now integrated into the OpenEnv Docker image that includes both the FastAPI server and Lighthouse MCP capabilities.

### Step 1: Build the OpenEnv Image

```bash
cd /path/to/WebOptEnv/my_env
docker build -t my_env-env:latest -f server/Dockerfile .
```

### Step 2: Run MCP Inspector with OpenEnv Container

```bash
npx @modelcontextprotocol/inspector docker run -i --rm --network host my_env-env:latest node /app/mcp/dist/index.js
```

**Note**: The container includes both:
- FastAPI server (default CMD, runs on port 8000)
- Lighthouse MCP server (accessible via Node.js command, uses port 8080 for web serving)

## Option 2: Test Locally (Without Docker)

### Step 1: Install Dependencies

Navigate to the root WebOptEnv directory (not my_env):

```bash
cd /path/to/WebOptEnv
npm install
```

### Step 2: Build the TypeScript Code

```bash
npm run build
```

### Step 3: Run MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

### Step 4: Test the Tools

Once the inspector opens in your browser, you can:

1. See all available tools in the left sidebar
2. Click on a tool to see its schema
3. Fill in the parameters and execute the tool
4. View the responses

## Option 3: Test with OpenEnv Python Wrapper

### Step 1: Use the OpenEnv Wrapper

```bash
cd /path/to/WebOptEnv/open-env
./openenv.py inspect
```

This will automatically:
- Build the Docker image if needed
- Launch the MCP Inspector with the correct configuration
- Open the inspector in your browser

### Step 2: Test in the Inspector UI

## Integration with MCP Clients

### Claude Desktop Configuration

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "web-opt-env": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "--network", "host", "my_env-env:latest", "node", "/app/mcp/dist/index.js"]
    }
  }
}
```

### Using OpenEnv Wrapper

```json
{
  "mcpServers": {
    "web-opt-env": {
      "command": "python3",
      "args": ["/path/to/WebOptEnv/open-env/openenv.py", "start"]
    }
  }
}
```

## Available MCP Tools

The Lighthouse MCP server provides the following tools:

1. **deploy_zip** - Deploy a complete web application from a base64-encoded zip file
2. **serve_html** - Serve a single HTML file on a local web server
3. **audit_with_lighthouse** - Run Lighthouse audit on served content
4. **stop_server** - Stop the currently running web server

## Testing Scenarios

### Test 1: Serve HTML File

**Tool**: `serve_html`

**Parameters**:
```json
{
  "html_content": "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello from MCP!</h1></body></html>",
  "filename": "test.html",
  "port": 8080
}
```

**Expected Result**: Server starts and returns URL `http://localhost:8080/test.html`

### Test 2: Deploy from ZIP

**Tool**: `deploy_zip`

**Parameters**:
```json
{
  "zip_content": "<base64-encoded-zip-file>",
  "port": 8080
}
```

To create a base64-encoded zip:

```bash
# Create a simple test app
mkdir -p test-deploy
echo '<!DOCTYPE html><html><body><h1>Deployed App</h1></body></html>' > test-deploy/index.html

# Create zip file
cd test-deploy && zip -r ../deploy-test.zip . && cd ..

# Encode to base64
base64 -i deploy-test.zip | tr -d '\n'

# Use the output in the zip_content parameter
```

**Expected Result**: Application is deployed and served on port 8080

### Test 3: Run Lighthouse Audit

**Prerequisites**: First serve an HTML file using `serve_html`

**Tool**: `audit_with_lighthouse`

**Parameters**:
```json
{
  "categories": ["performance", "accessibility"]
}
```

**Expected Result**: Lighthouse audit results with scores and metrics

### Test 4: Stop Server

**Tool**: `stop_server`

**Parameters**: `{}` (empty object)

**Expected Result**: Server stopped successfully

## Troubleshooting

### Chrome/Lighthouse Issues

If you see errors about Chrome not launching:

**Local testing**: Install Chrome/Chromium on your system
**Docker testing**: The Docker image includes Chrome, so it should work out of the box

### Port Already in Use

If port 8080 is already in use, change the port parameter:

```json
{
  "html_content": "...",
  "port": 3000
}
```

### Inspector Can't Connect

Make sure the MCP server is running and outputting to stdio correctly. Check for:
- No syntax errors in TypeScript
- Build completed successfully (`npm run build`)
- Node.js version is compatible (v20+)

## Inspector UI Tips

1. **Tools Tab**: Lists all available tools and their schemas
2. **Resources Tab**: Shows any resources exposed by the server (not used in this server)
3. **Prompts Tab**: Shows any prompts (not used in this server)
4. **Logs Tab**: View server logs and debug output

## Quick Start Script

The repository includes a test script:

```bash
cd /path/to/WebOptEnv
./test-with-inspector.sh
```

Or build and run manually:

```bash
#!/bin/bash

echo "🔨 Building the project..."
cd /path/to/WebOptEnv
npm run build

echo "🚀 Starting MCP Inspector..."
echo "The inspector will open in your browser."
echo ""
echo "Test the following tools in order:"
echo "  1. deploy_zip or serve_html - Deploy/serve content"
echo "  2. audit_with_lighthouse - Run Lighthouse audit"
echo "  3. stop_server - Stop the server"
echo ""

npx @modelcontextprotocol/inspector node dist/index.js
```

## Docker-Specific Notes

When using the OpenEnv Docker image:

- **Network Mode**: Use `--network host` to allow the MCP server to access localhost for serving files and running Lighthouse
- **Chrome Path**: The container includes Chromium at `/usr/bin/chromium`
- **Ports**: Port 8000 (FastAPI), Port 8080 (MCP web server)
- **Node.js**: Node.js 20 is included in the runtime stage
- **Python Environment**: Python virtual environment is at `/app/.venv`

## Environment Structure

The combined OpenEnv image contains:

```
/app/
├── .venv/              # Python virtual environment (FastAPI)
├── env/                # OpenEnv environment code
├── mcp/                # Lighthouse MCP server
│   ├── dist/           # Compiled TypeScript (if built)
│   ├── node_modules/   # Node.js dependencies
│   ├── temp/           # Temporary files for serving
│   └── deployed/       # Deployed zip applications
└── lighthouse/         # Lighthouse configuration (if exists)
```

## Example: Complete Test Flow

### Using Docker/OpenEnv

1. **Start Inspector**:
   ```bash
   cd /path/to/WebOptEnv/my_env
   npx @modelcontextprotocol/inspector docker run -i --rm --network host my_env-env:latest node /app/mcp/dist/index.js
   ```

2. **In the Inspector UI**:
   - Click `serve_html` tool
   - Enter test HTML content
   - Click "Execute"
   - Note the returned URL

3. **Run Audit**:
   - Click `audit_with_lighthouse` tool
   - Leave parameters empty (will use current server)
   - Click "Execute"
   - Review the performance scores

4. **View in Browser**:
   - Open `http://localhost:8080/test.html`
   - Verify the page loads

5. **Clean Up**:
   - Click `stop_server` tool
   - Click "Execute"

### Using Local Build

1. **Start Inspector**:
   ```bash
   cd /path/to/WebOptEnv
   npm run build && npx @modelcontextprotocol/inspector node dist/index.js
   ```

2. Follow steps 2-5 from the Docker flow above

## Advanced: Testing with Real Projects

To test deploying a real project:

```bash
# Create a test project
mkdir my-test-app
cd my-test-app
npm init -y
echo '<!DOCTYPE html><html><body><h1>My App</h1></body></html>' > index.html

# Create package.json with start script
cat > package.json << 'EOF'
{
  "name": "my-test-app",
  "version": "1.0.0",
  "scripts": {
    "start": "npx http-server -p 8080"
  }
}
EOF

# Zip it
zip -r ../my-test-app.zip .
cd ..

# Convert to base64
base64 -i my-test-app.zip | tr -d '\n' > my-test-app.b64

# Use the content of my-test-app.b64 in the deploy_zip tool
```

## Next Steps

Once you've tested with the Inspector:

1. **Integrate with MCP clients** - Use with Claude Desktop or other MCP-compatible applications
2. **Deploy to production** - The Docker image is production-ready
3. **Extend functionality** - Add custom tools to the MCP server
4. **Use with OpenEnv** - Leverage the full OpenEnv environment capabilities
5. **Combine with FastAPI** - Run both servers for comprehensive web optimization workflows

## Additional Resources

- **OpenEnv Documentation**: See `/path/to/WebOptEnv/open-env/README.md`
- **Main README**: See `/path/to/WebOptEnv/README.md`
- **Quick Start Guide**: See `/path/to/WebOptEnv/QUICKSTART.md`
- **Server Dockerfile**: `/path/to/WebOptEnv/my_env/server/Dockerfile`
