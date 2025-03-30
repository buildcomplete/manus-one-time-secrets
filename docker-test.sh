#!/bin/bash

# Script to run tests inside Docker container
# This allows testing without installing Node.js or npm locally

echo "Running tests inside Docker container..."

# Build the development Docker image if it doesn't exist
docker build -t one-time-secrets-dev -f docker/Dockerfile.dev .

# Create and run a container for testing
docker run --rm \
  -v "$(pwd)/test-storage:/usr/src/app/test-storage" \
  -e NODE_ENV=test \
  -e STORAGE_DIR=/usr/src/app/test-storage \
  one-time-secrets-dev \
  npm test

echo "Tests completed!"
