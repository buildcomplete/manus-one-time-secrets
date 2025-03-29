#!/bin/bash

# Script to run tests directly in the local environment
# This is a fallback for when Docker is not available

echo "Running tests in local environment..."

# Ensure the test storage directory exists
mkdir -p test-storage
chmod 777 test-storage

# Set environment variables for testing
export NODE_ENV=test
export STORAGE_DIR=$(pwd)/test-storage

# Run the tests
npm test

echo "Tests completed!"
