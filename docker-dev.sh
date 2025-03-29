#!/bin/bash

# Script to run the application in development mode inside Docker
# This allows running the app without installing Node.js or npm locally

echo "Starting One-Time Secrets application in development mode..."

# Build the development Docker image if it doesn't exist
docker-compose -f docker/docker-compose.dev.yml build

# Run the application in development mode
docker-compose -f docker/docker-compose.dev.yml up

# Note: Press Ctrl+C to stop the application
