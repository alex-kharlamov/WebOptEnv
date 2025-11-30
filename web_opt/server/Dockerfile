# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree.

# Multi-stage build using openenv-base
# This Dockerfile is flexible and works for both:
# - In-repo environments (with local src/core)
# - Standalone environments (with openenv-core from pip)
# The build script (openenv build) handles context detection and sets appropriate build args.

ARG BASE_IMAGE=ghcr.io/meta-pytorch/openenv-base:latest
FROM ${BASE_IMAGE} AS builder

WORKDIR /app

# Ensure git is available (required for installing dependencies from VCS)
RUN apt-get update && \
    apt-get install -y --no-install-recommends git && \
    rm -rf /var/lib/apt/lists/*

# Build argument to control whether we're building standalone or in-repo
ARG BUILD_MODE=in-repo
ARG ENV_NAME=web_opt

# Copy environment code (always at root of build context)
COPY . /app/env

# For in-repo builds, openenv-core is already in the pyproject.toml dependencies
# For standalone builds, openenv-core will be installed from pip via pyproject.toml
WORKDIR /app/env

# Ensure uv is available (for local builds where base image lacks it)
RUN if ! command -v uv >/dev/null 2>&1; then \
        curl -LsSf https://astral.sh/uv/install.sh | sh && \
        mv /root/.local/bin/uv /usr/local/bin/uv && \
        mv /root/.local/bin/uvx /usr/local/bin/uvx; \
    fi

# Install dependencies using uv sync
# If uv.lock exists, use it; otherwise resolve on the fly
RUN --mount=type=cache,target=/root/.cache/uv \
    if [ -f uv.lock ]; then \
        uv sync --frozen --no-install-project --no-editable; \
    else \
        uv sync --no-install-project --no-editable; \
    fi

RUN --mount=type=cache,target=/root/.cache/uv \
    if [ -f uv.lock ]; then \
        uv sync --frozen --no-editable; \
    else \
        uv sync --no-editable; \
    fi

# Node.js builder stage for Lighthouse MCP server
FROM node:22-slim AS node-builder

WORKDIR /app/mcp

# Build context is web_opt/, so lighthouse/ is a subdirectory
COPY lighthouse/package.json lighthouse/package-lock.json* ./
COPY lighthouse/tsconfig.json ./
COPY lighthouse/src ./src
COPY lighthouse/deploy-and-serve.sh ./

# Install dependencies and build TypeScript
RUN npm install
RUN npm run build

# Verify build output exists
RUN ls -la /app/mcp/dist/ && test -f /app/mcp/dist/index.js

# Final runtime stage
FROM ${BASE_IMAGE}

WORKDIR /app

# Install all Chrome dependencies and utilities from root Dockerfile
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf-2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libgbm1 \
    libxss1 \
    unzip \
    chromium \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22 for MCP server
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy the virtual environment from builder
COPY --from=builder /app/env/.venv /app/.venv

# Copy the environment code
COPY --from=builder /app/env /app/env

# Copy the Lighthouse MCP server from node-builder
COPY --from=node-builder /app/mcp/dist /app/mcp/dist
COPY --from=node-builder /app/mcp/node_modules /app/mcp/node_modules
COPY --from=node-builder /app/mcp/package*.json /app/mcp/
COPY --from=node-builder /app/mcp/deploy-and-serve.sh /usr/local/bin/deploy-and-serve
RUN chmod +x /usr/local/bin/deploy-and-serve

# Create directories for Lighthouse MCP server
RUN mkdir -p /app/mcp/temp /app/mcp/deployed

# Set PATH to use the virtual environment and Node.js
ENV PATH="/app/.venv/bin:$PATH"

# Set PYTHONPATH so imports work correctly
ENV PYTHONPATH="/app/env:$PYTHONPATH"

# Set environment variables for Lighthouse MCP server
ENV NODE_ENV=production
ENV CHROME_PATH=/usr/bin/chromium

# Expose ports for both servers (FastAPI on 8000, MCP web server on 8080)
EXPOSE 8000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default: Run the FastAPI server
# To run Lighthouse MCP server: CMD ["node", "/app/mcp/dist/index.js"]
# Note: MCP server dist needs to be built separately and added to web_opt context
# The MCP server communicates via stdio and can serve web content on port 8080
CMD ["uvicorn", "web_opt.server.app:app", "--host", "0.0.0.0", "--port", "8000"]
