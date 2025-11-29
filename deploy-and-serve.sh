#!/bin/bash

set -e

# Default values
ZIP_FILE=""
PORT=8080
WORK_DIR="/app/deployed"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --zip)
      ZIP_FILE="$2"
      shift 2
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 --zip <zip_file> [--port <port>]"
      exit 1
      ;;
  esac
done

if [ -z "$ZIP_FILE" ]; then
  echo "Error: --zip argument is required"
  echo "Usage: $0 --zip <zip_file> [--port <port>]"
  exit 1
fi

if [ ! -f "$ZIP_FILE" ]; then
  echo "Error: ZIP file not found: $ZIP_FILE"
  exit 1
fi

echo "📦 Extracting $ZIP_FILE to $WORK_DIR..."

# Create and clean work directory
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"

# Extract the zip file
unzip -q "$ZIP_FILE" -d "$WORK_DIR"

echo "✅ Extraction complete!"

# Check if there's a package.json (Node.js project)
if [ -f "$WORK_DIR/package.json" ]; then
  echo "📦 Detected Node.js project, installing dependencies..."
  cd "$WORK_DIR"
  npm install

  # Check for build script
  if grep -q '"build"' package.json; then
    echo "🔨 Running build script..."
    npm run build
  fi

  # Start the server
  if grep -q '"start"' package.json; then
    echo "🚀 Starting server on port $PORT..."
    npm start
  else
    echo "⚠️  No start script found, serving with http-server..."
    npx http-server -p "$PORT"
  fi
else
  # No package.json, just serve static files
  echo "🌐 Serving static files on port $PORT..."
  cd "$WORK_DIR"
  npx http-server -p "$PORT"
fi
