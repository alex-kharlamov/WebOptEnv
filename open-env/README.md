# OpenEnv Environment for WebOptEnv

This directory contains the OpenEnv wrapper for the WebOptEnv MCP server, providing easy environment management for web optimization and Lighthouse auditing.

## Quick Start

```bash
# Setup (build Docker image)
./openenv.py setup

# Start the MCP server
./openenv.py start

# Check status
./openenv.py status

# Run MCP Inspector for testing
./openenv.py inspect

# Stop the server
./openenv.py stop
```

## Available Commands

### `setup`
Builds the Docker image if not already built.

```bash
./openenv.py setup
```

### `start`
Starts the MCP server in a Docker container. The server communicates via stdio and serves web content on port 8080.

```bash
./openenv.py start
```

### `stop`
Stops the running MCP server container.

```bash
./openenv.py stop
```

### `status`
Checks if the MCP server container is currently running.

```bash
./openenv.py status
```

### `inspect`
Launches the MCP Inspector for interactive testing of the server's tools.

```bash
./openenv.py inspect
```

### `logs`
Shows the logs from the running container.

```bash
./openenv.py logs
```

### `clean`
Removes the Docker image and cleans up resources.

```bash
./openenv.py clean
```

## MCP Tools Available

The environment provides the following MCP tools:

- **deploy_zip**: Deploy a complete web application from a base64-encoded zip file
- **serve_html**: Serve a single HTML file on a local web server
- **audit_with_lighthouse**: Run Lighthouse performance audit on served content
- **stop_server**: Stop the currently running web server

## Integration

### With MCP Clients

Configure your MCP client to use the OpenEnv wrapper:

```json
{
  "mcpServers": {
    "web-opt-env": {
      "command": "python3",
      "args": ["/path/to/open-env/openenv.py", "start"]
    }
  }
}
```

### Direct Docker Usage

Alternatively, use Docker directly:

```json
{
  "mcpServers": {
    "web-opt-env": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "--network", "host", "web-opt-env-mcp:latest"]
    }
  }
}
```

## Environment Configuration

The OpenEnv wrapper uses the following defaults:

- **Container Name**: `web-opt-env-mcp`
- **Image Name**: `web-opt-env-mcp:latest`
- **Web Server Port**: `8080`
- **Network Mode**: `host` (allows localhost access)

## Requirements

- Python 3.6+
- Docker
- Node.js and npm (for MCP Inspector)

## Troubleshooting

**Image not found:**
Run `./openenv.py setup` to build the Docker image.

**Port 8080 in use:**
Stop any services using port 8080 or modify the port in the code.

**Inspector fails to start:**
Ensure npx and @modelcontextprotocol/inspector are available.

**Container won't stop:**
Use `docker stop web-opt-env-mcp` manually if needed.
