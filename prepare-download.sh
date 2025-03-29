#!/bin/bash

# Script to prepare the repository for download
# This creates a tar.gz archive containing the complete Git repository with history

echo "Preparing One-Time Secrets repository for download..."

# Create a tar.gz archive of the repository including .git directory for complete history
tar -czf one-time-secrets.tar.gz --exclude="node_modules" --exclude="coverage" .

echo "Repository prepared for download!"
echo "You can download the following file:"
echo "- one-time-secrets.tar.gz: Complete repository with Git history and commit messages"
echo ""
echo "To extract the archive on your machine:"
echo "  tar -xzf one-time-secrets.tar.gz"
echo ""
echo "After extraction, you can view the commit history with:"
echo "  cd one-time-secrets"
echo "  git log"
