#!/bin/bash

# This script creates the necessary directory structure for Nginx
mkdir -p nginx/ssl nginx/www

# Generate self-signed SSL certificates for development
chmod +x nginx/generate-ssl-cert.sh
./nginx/generate-ssl-cert.sh

echo "Nginx directory structure created."
echo "For production deployment, replace the self-signed certificates with real ones."
