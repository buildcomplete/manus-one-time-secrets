# One-Time Secrets

A secure web application for sharing secrets that can only be read once.

[![Test](https://github.com/buildcomplete/manus-one-time-secrets/actions/workflows/test.yml/badge.svg)](https://github.com/buildcomplete/manus-one-time-secrets/actions/workflows/test.yml)

## Overview

One-Time Secrets is a secure web application that allows users to share sensitive information through one-time accessible links. The application ensures that:

1. Secrets are only readable once
2. Secrets are not readable even with filesystem access
3. No database is required; only the filesystem is used for storage
4. The implementation is simple and understandable
5. Secrets can be shared via links that work only once
6. Secrets are protected from being deleted by virus checkers that might invoke the link

## Development Options

### Recommended: Docker-based Development (No Local Dependencies)

The recommended way to develop and test this application is using Docker, which requires **no local installation** of Node.js, npm, or any other dependencies:

- [Docker Guide](DOCKER_GUIDE.md) - How to use Docker for development and testing

With this approach, you only need Docker installed on your machine. All development and testing can be done using the provided scripts:
- `./docker-dev.sh` - Run the application in development mode
- `./docker-test.sh` - Run tests inside Docker

### Alternative: Traditional Development

If you prefer a traditional development approach using npm and Node.js directly:

- [Traditional Development Guide](TRADITIONAL_DEV.md) - Development using npm and Node.js

## GitHub Actions Integration

This project includes GitHub Actions workflows for automated testing and deployment. For detailed instructions on setting up and using GitHub Actions with this project, please see:

- [GitHub Actions Guide](GITHUB_ACTIONS.md) - General GitHub Actions setup
- [SCP Deployment Guide](SCP_DEPLOYMENT.md) - Direct deployment via SCP without Docker Hub

## Architecture

The application follows a security-first design with client-side encryption:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Web Interface  │────▶│   API Server    │────▶│ Link Generator  │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │                 │     │                 │
                        │ Encryption Svc  │◀───▶│  Storage Svc    │
                        │                 │     │                 │
                        └─────────────────┘     └─────────────────┘
```

### Security Features

- **Client-side encryption**: Secrets are encrypted in the browser before being sent to the server
- **Two-key system**: The encryption key is never stored with the encrypted data
- **URL fragment**: The encryption key is part of the URL fragment, which is never sent to the server
- **One-time access**: Secrets are immediately deleted after being accessed
- **Anti-virus protection**: The system detects automated scanners and prevents them from triggering deletion

## Installation

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (for development only)

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/one-time-secrets.git
   cd one-time-secrets
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Access the application at http://localhost:3000

### Running Tests

Run the automated tests:
```bash
npm test
```

Or use the test script which runs tests and starts the application:
```bash
./test.sh
```

## Deployment

### Using Docker Compose

1. Navigate to the project directory:
   ```bash
   cd one-time-secrets
   ```

2. Set up Nginx directory structure and generate self-signed SSL certificates:
   ```bash
   cd docker
   ./setup-nginx.sh
   ```

3. Edit the Nginx configuration in `docker/nginx/conf.d/app.conf` to use your domain name:
   ```
   server_name your-domain.com www.your-domain.com;
   ```

4. For production, replace the self-signed SSL certificates in `docker/nginx/ssl/` with real certificates from a certificate authority.

5. Start the application with Docker Compose:
   ```bash
   docker-compose -f docker/docker-compose.yml up -d
   ```

6. Access the application at https://your-domain.com

### Manual Deployment with Nginx

1. Build and run the Node.js application:
   ```bash
   npm install --production
   npm start
   ```

2. Configure Nginx as a reverse proxy:
   ```nginx
   server {
       listen 443 ssl;
       server_name your-domain.com;

       ssl_certificate /path/to/fullchain.pem;
       ssl_certificate_key /path/to/privkey.pem;
       
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

3. Restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

## How It Works

### Creating a Secret

1. User enters a secret in the web interface
2. Client generates a random encryption key
3. Secret is encrypted client-side using AES-256-GCM
4. Encrypted secret is sent to the server
5. Server generates a unique ID for the secret
6. Server stores the encrypted secret on the filesystem
7. Server returns the unique ID to the client
8. Client constructs a one-time URL with the ID and encryption key

### Accessing a Secret

1. User opens the one-time URL
2. Server identifies the secret by ID in the URL path
3. Server verifies the request is legitimate (not from an automated scanner)
4. Server retrieves the encrypted secret
5. Server immediately deletes the secret from storage
6. Server sends the encrypted secret to the client
7. Client extracts the encryption key from the URL fragment
8. Client decrypts and displays the secret

## Security Considerations

- **No logs of secret content**: The application does not log the content of secrets
- **Encryption/decryption happens client-side**: The server never sees the unencrypted secret
- **Encrypted data is immediately deleted**: After access, the secret is permanently removed
- **HTTPS is required**: All communication should be over HTTPS
- **Anti-virus protection**: The application detects and handles requests from automated scanners

## Project Structure

```
one-time-secrets/
├── src/                  # Source code
│   ├── api/              # API routes and controllers
│   ├── encryption/       # Encryption service
│   ├── storage/          # Storage service
│   └── utils/            # Utility functions
├── public/               # Static files
│   ├── css/              # CSS styles
│   ├── js/               # Client-side JavaScript
│   └── index.html        # Main HTML file
├── tests/                # Test files
├── docker/               # Docker configuration
│   ├── nginx/            # Nginx configuration
│   ├── Dockerfile        # Node.js application Dockerfile
│   └── docker-compose.yml # Docker Compose configuration
└── storage/              # Secret storage directory (created at runtime)
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
