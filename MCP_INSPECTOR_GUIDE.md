# Testing with MCP Inspector

The MCP Inspector is a developer tool for testing and debugging MCP servers. Here's how to use it with the WebOptEnv server.

## Option 1: Test Locally (Without Docker)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Build the TypeScript Code

```bash
npm run build
```

### Step 3: Install MCP Inspector

```bash
npx @modelcontextprotocol/inspector
```

### Step 4: Configure Inspector

The inspector will ask for the command to run your MCP server. Use:

```bash
node dist/index.js
```

### Step 5: Test the Tools

Once the inspector opens in your browser, you can:

1. See all available tools in the left sidebar
2. Click on a tool to see its schema
3. Fill in the parameters and execute the tool
4. View the responses

## Option 2: Test with Docker

### Step 1: Build the Docker Image

```bash
docker build -t web-opt-env-mcp .
```

### Step 2: Run MCP Inspector with Docker Command

```bash
npx @modelcontextprotocol/inspector docker run -i --rm web-opt-env-mcp
```

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

Create a file `test-with-inspector.sh`:

```bash
#!/bin/bash

echo "🔨 Building the project..."
npm run build

echo "🚀 Starting MCP Inspector..."
echo "The inspector will open in your browser."
echo ""
echo "Test the following tools in order:"
echo "  1. serve_html - Serve a test HTML file"
echo "  2. audit_with_lighthouse - Run Lighthouse audit"
echo "  3. stop_server - Stop the server"
echo ""

npx @modelcontextprotocol/inspector node dist/index.js
```

Make it executable:

```bash
chmod +x test-with-inspector.sh
```

Run it:

```bash
./test-with-inspector.sh
```

## Example: Complete Test Flow

1. **Start Inspector**:
   ```bash
   npm run build && npx @modelcontextprotocol/inspector node dist/index.js
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

1. Integrate with your MCP client (Claude Desktop, etc.)
2. Use in your workflow for web optimization
3. Extend the server with additional tools if needed
