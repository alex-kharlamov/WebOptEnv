#!/bin/bash

# Example: Test the WebOptEnv MCP Docker image

echo "🧪 Testing WebOptEnv MCP Docker container..."
echo ""
echo "The container is now running and waiting for MCP commands via stdio."
echo ""
echo "Available tools:"
echo "  1. deploy_zip - Deploy a zip file containing web application"
echo "  2. serve_html - Serve a single HTML file"
echo "  3. audit_with_lighthouse - Run Lighthouse audit"
echo "  4. stop_server - Stop the running server"
echo ""
echo "To use with MCP client, configure in your MCP settings:"
echo ""
echo '{
  "mcpServers": {
    "web-opt-env": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-p", "8080:8080", "web-opt-env-mcp"]
    }
  }
}'
echo ""
echo "Starting container..."

docker run -i --rm -p 8080:8080 web-opt-env-mcp
