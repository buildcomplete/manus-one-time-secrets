#!/bin/bash

# Test script for the one-time secrets application
# This script runs a series of tests to verify the application works as expected

echo "Starting tests for one-time secrets application..."

# Test 1: Run unit tests
echo "Running unit tests..."
npm test

# Test 2: Start the application for manual testing
echo "Starting the application for manual testing..."
echo "Press Ctrl+C to stop the application when done testing."
npm run dev
