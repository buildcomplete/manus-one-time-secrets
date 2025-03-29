# Docker Development Guide

This guide explains how to use Docker for development and testing of the One-Time Secrets application without installing any dependencies locally.

## Development Environment

The project includes a Docker-based development environment that allows you to run the application and tests without installing Node.js, npm, or any other dependencies on your local machine.

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

That's it! You don't need Node.js, npm, or any other dependencies installed locally.

### Running the Application in Development Mode

To start the application in development mode:

```bash
./docker-dev.sh
```

This script will:
1. Build the development Docker image if it doesn't exist
2. Start the application in development mode
3. Mount your local source code, so changes are reflected immediately

The application will be available at http://localhost:3000

### Running Tests

To run the tests inside a Docker container:

```bash
./docker-test.sh
```

This script will:
1. Build the development Docker image if it doesn't exist
2. Run the tests inside the container
3. Display the test results

## Production Deployment

For production deployment, the application is designed to run in a Docker container with Nginx on the host server acting as a reverse proxy.

### Docker Configuration

The production Docker setup is simplified to only include the application container:

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    container_name: one-time-secrets-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - secret_storage:/usr/src/app/storage
    ports:
      - "3000:3000"

volumes:
  secret_storage:
    driver: local
```

### Host Nginx Configuration

Instead of running Nginx in a container, you should configure Nginx on the host server as a reverse proxy to the application container.

Here's a sample Nginx configuration for your host server:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect all HTTP requests to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self'; style-src 'self';" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Proxy requests to the Docker container
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Server Setup Steps

1. Install Docker on your server:
   ```bash
   sudo apt update
   sudo apt install -y docker.io
   sudo systemctl enable docker
   sudo systemctl start docker
   sudo usermod -aG docker $USER
   ```

2. Install Nginx on your server:
   ```bash
   sudo apt install -y nginx
   ```

3. Set up SSL certificates using Certbot:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

4. Create Nginx configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/one-time-secrets
   # Paste the Nginx configuration from above
   sudo ln -s /etc/nginx/sites-available/one-time-secrets /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. Deploy the application using the GitHub Actions workflow, which will:
   - Create a deployment package
   - Transfer it to your server via SCP
   - Extract and deploy it on the server
   - Start the Docker container

## GitHub Actions Deployment

The GitHub Actions workflow has been updated to deploy the application without using Docker Hub. Instead, it:

1. Creates a zip package of the application
2. Transfers it directly to your server using SCP
3. Extracts and deploys it on the server
4. Starts the Docker container

For detailed instructions on setting up GitHub Actions for deployment, see the [SCP Deployment Guide](SCP_DEPLOYMENT.md).

## Troubleshooting

### Docker Issues

If you encounter issues with Docker:

1. Check Docker is running:
   ```bash
   docker info
   ```

2. Check Docker Compose is installed:
   ```bash
   docker-compose --version
   ```

3. Check container logs:
   ```bash
   docker logs one-time-secrets-app
   ```

### Nginx Issues

If you encounter issues with Nginx:

1. Check Nginx configuration:
   ```bash
   sudo nginx -t
   ```

2. Check Nginx logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. Check Nginx is running:
   ```bash
   sudo systemctl status nginx
   ```

### Application Issues

If you encounter issues with the application:

1. Check application logs:
   ```bash
   docker logs one-time-secrets-app
   ```

2. Try running the application in development mode to debug:
   ```bash
   ./docker-dev.sh
   ```

3. Run the tests to verify functionality:
   ```bash
   ./docker-test.sh
   ```
