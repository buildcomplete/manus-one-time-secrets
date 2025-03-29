#!/bin/bash

# Script to run tests inside Docker container
# This allows testing without installing Node.js or npm locally

echo "Running tests inside Docker container..."

# Build the development Docker image if it doesn't exist
docker-compose -f docker/docker-compose.dev.yml build

# Run tests inside the container
docker-compose -f docker/docker-compose.dev.yml run --rm app npm test

echo "Tests completed!"
