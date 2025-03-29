# GitHub Actions Integration Guide

This guide explains how to use GitHub Actions for testing and deploying the One-Time Secrets application.

## Testing with GitHub Actions

The repository includes a GitHub Actions workflow for automated testing. This workflow runs whenever code is pushed to the main branch or when a pull request is created.

### Test Workflow Features

- Runs tests on multiple Node.js versions (16.x and 18.x)
- Generates test coverage reports
- Uploads coverage reports as artifacts
- Publishes test results in a readable format

### Viewing Test Results

1. Go to the "Actions" tab in your GitHub repository
2. Click on the latest workflow run
3. View the test results and coverage reports in the "Artifacts" section

## Deployment with GitHub Actions

The repository includes a GitHub Actions workflow for deploying to test and production environments.

### Required GitHub Secrets

You need to set up the following secrets in your GitHub repository:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DOCKER_USERNAME` | Your Docker Hub username | `username` |
| `DOCKER_PASSWORD` | Your Docker Hub password or token | `password` |
| `SERVER_HOST` | Hostname or IP of your server | `123.456.789.0` |
| `SERVER_USERNAME` | SSH username for your server | `ubuntu` |
| `SERVER_SSH_KEY` | Private SSH key for server access | `-----BEGIN RSA PRIVATE KEY-----...` |
| `DOMAIN_test` | Domain name for test environment | `test.example.com` |
| `DOMAIN_production` | Domain name for production environment | `example.com` |

### Setting Up GitHub Secrets

1. Go to your repository on GitHub
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Add each of the required secrets listed above

### Triggering a Deployment

1. Go to the "Actions" tab in your GitHub repository
2. Select the "Deploy" workflow
3. Click "Run workflow"
4. Choose the environment (test or production)
5. Click "Run workflow" to start the deployment

## Server Preparation

To prepare your server for GitHub Actions deployments, follow these steps:

### Initial Server Setup

1. Install only Docker and Nginx (minimal installation):
   ```bash
   sudo apt update
   sudo apt install -y docker.io nginx
   sudo systemctl enable docker
   sudo systemctl start docker
   sudo usermod -aG docker $USER
   ```

2. Create directory structure for both environments:
   ```bash
   sudo mkdir -p /opt/one-time-secrets/test
   sudo mkdir -p /opt/one-time-secrets/production
   ```

3. Set appropriate permissions:
   ```bash
   sudo chown -R $USER:$USER /opt/one-time-secrets
   ```

### SSH Key Setup

1. Create a deployment SSH key pair on your local machine:
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_deploy_key -N ""
   ```

2. Add the public key to your server's authorized_keys:
   ```bash
   cat ~/.ssh/github_deploy_key.pub >> ~/.ssh/authorized_keys
   ```

3. Add the private key as a GitHub secret named `SERVER_SSH_KEY`

### Deployment Directory Setup

1. Create directories for deployment:
   ```bash
   # For test environment
   mkdir -p /opt/one-time-secrets/test/docker/nginx/ssl
   mkdir -p /opt/one-time-secrets/test/docker/nginx/conf.d
   
   # For production environment
   mkdir -p /opt/one-time-secrets/production/docker/nginx/ssl
   mkdir -p /opt/one-time-secrets/production/docker/nginx/conf.d
   ```

2. Create initial .env files:
   ```bash
   # For test environment
   cd /opt/one-time-secrets/test
   echo "DOCKER_IMAGE=placeholder" > .env
   echo "DOMAIN=test.example.com" >> .env
   
   # For production environment
   cd /opt/one-time-secrets/production
   echo "DOCKER_IMAGE=placeholder" > .env
   echo "DOMAIN=example.com" >> .env
   ```

3. Copy the docker-compose.yml and Nginx configuration files from the repository:
   ```bash
   # For test environment
   cp /path/to/downloaded/repo/docker/docker-compose.yml /opt/one-time-secrets/test/docker/
   cp /path/to/downloaded/repo/docker/nginx/conf.d/app.conf /opt/one-time-secrets/test/docker/nginx/conf.d/
   
   # For production environment
   cp /path/to/downloaded/repo/docker/docker-compose.yml /opt/one-time-secrets/production/docker/
   cp /path/to/downloaded/repo/docker/nginx/conf.d/app.conf /opt/one-time-secrets/production/docker/nginx/conf.d/
   ```

### SSL Certificate Setup

1. Use Nginx to obtain SSL certificates:
   ```bash
   # Install certbot Nginx plugin
   sudo apt install -y certbot python3-certbot-nginx
   
   # Obtain certificates using Nginx plugin
   sudo certbot --nginx -d test.example.com
   sudo certbot --nginx -d example.com
   ```

2. Create symbolic links to the certificates in your deployment directories:
   ```bash
   # For test environment
   sudo ln -s /etc/letsencrypt/live/test.example.com/fullchain.pem /opt/one-time-secrets/test/docker/nginx/ssl/fullchain.pem
   sudo ln -s /etc/letsencrypt/live/test.example.com/privkey.pem /opt/one-time-secrets/test/docker/nginx/ssl/privkey.pem
   
   # For production environment
   sudo ln -s /etc/letsencrypt/live/example.com/fullchain.pem /opt/one-time-secrets/production/docker/nginx/ssl/fullchain.pem
   sudo ln -s /etc/letsencrypt/live/example.com/privkey.pem /opt/one-time-secrets/production/docker/nginx/ssl/privkey.pem
   ```

3. Set appropriate permissions:
   ```bash
   sudo chown -R $USER:$USER /opt/one-time-secrets
   ```

## Downloading the Repository

To download the complete repository structure including the Git history:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/one-time-secrets.git
   cd one-time-secrets
   ```

2. Create a ZIP archive of the repository including Git history:
   ```bash
   git bundle create one-time-secrets.bundle --all
   ```

3. To extract the bundle on another machine:
   ```bash
   git clone one-time-secrets.bundle
   ```

Alternatively, you can download the repository as a ZIP file from GitHub:

1. Go to your repository on GitHub
2. Click on "Code" > "Download ZIP"
3. Extract the ZIP file on your local machine

Note: The ZIP download from GitHub will not include the Git history.

## Modifying the GitHub Actions Workflows

If you need to modify the GitHub Actions workflows:

1. Edit the YAML files in the `.github/workflows/` directory
2. Commit and push your changes
3. The updated workflows will be used for future runs

## Troubleshooting

### Deployment Issues

If you encounter issues with deployment:

1. Check the GitHub Actions logs for error messages
2. Verify that all required secrets are correctly set
3. Ensure your server is accessible via SSH
4. Check Docker and Docker Compose logs on your server:
   ```bash
   docker-compose -f docker/docker-compose.yml logs
   ```

### SSL Certificate Issues

If you encounter SSL certificate issues:

1. Verify that the certificates are correctly linked
2. Check certificate expiration dates:
   ```bash
   sudo certbot certificates
   ```
3. Renew certificates if needed:
   ```bash
   sudo certbot renew
   ```

### Permission Issues

If you encounter permission issues:

1. Verify ownership of directories:
   ```bash
   ls -la /opt/one-time-secrets
   ```
2. Adjust permissions if needed:
   ```bash
   sudo chown -R $USER:$USER /opt/one-time-secrets
   ```
