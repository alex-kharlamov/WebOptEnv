FROM node:20-slim

# Install Chrome dependencies and utilities
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
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
    && rm -rf /var/lib/apt/lists/*

# Install Chromium (works on both ARM64 and AMD64)
RUN apt-get update \
    && apt-get install -y chromium \
    && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Copy deployment script
COPY deploy-and-serve.sh /usr/local/bin/deploy-and-serve
RUN chmod +x /usr/local/bin/deploy-and-serve

# Build TypeScript
RUN npm run build

# Create temp and deployed directories
RUN mkdir -p /app/temp /app/deployed

# Expose default server port (can be overridden)
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV CHROME_PATH=/usr/bin/chromium

# Run the MCP server
CMD ["node", "dist/index.js"]
