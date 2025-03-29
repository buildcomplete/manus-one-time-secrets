#!/bin/bash

# Script to run tests inside Docker container
# This allows testing without installing Node.js or npm locally

echo "Running tests inside Docker container..."

# Build the development Docker image if it doesn't exist
docker build -t one-time-secrets-dev -f docker/Dockerfile.dev .

# Create and run a container for testing
docker run --rm \
  -v "$(pwd):/usr/src/app" \
  -w /usr/src/app \
  -e NODE_ENV=test \
  -e STORAGE_DIR=/usr/src/app/test-storage \
  one-time-secrets-dev \
  /bin/bash -c "mkdir -p /usr/src/app/test-storage && chmod 777 /usr/src/app/test-storage && npm test"

echo "Tests completed!"
