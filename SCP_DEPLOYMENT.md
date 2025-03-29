# SCP Deployment with GitHub Actions

This guide explains how to use GitHub Actions for deploying the One-Time Secrets application directly to your server using SCP (Secure Copy Protocol).

## Overview

Instead of using Docker Hub, this deployment method:
1. Creates a zip package of the application
2. Transfers it directly to your server using SCP
3. Extracts and deploys it on the server

## Required GitHub Secrets

You need to set up the following secrets in your GitHub repository:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SERVER_HOST` | Hostname or IP of your server | `123.456.789.0` |
| `SERVER_USERNAME` | SSH username for your server | `ubuntu` |
| `SERVER_SSH_KEY` | Private SSH key for server access | `-----BEGIN RSA PRIVATE KEY-----...` |
| `DOMAIN_test` | Domain name for test environment | `test.example.com` |
| `DOMAIN_production` | Domain name for production environment | `example.com` |

**Note**: Instead of using an SSH key, you can alternatively use a password by uncommenting the `password` line in the workflow file and adding a `SERVER_PASSWORD` secret.

## Setting Up SSH Authentication

### Option 1: SSH Key Authentication (Recommended)

1. Create a deployment SSH key pair on your local machine:
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_deploy_key -N ""
   ```

2. Add the public key to your server's authorized_keys:
   ```bash
   cat ~/.ssh/github_deploy_key.pub | ssh user@your-server "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
   ```

3. Add the private key as a GitHub secret named `SERVER_SSH_KEY`:
   - Go to your repository on GitHub
   - Click on "Settings" > "Secrets and variables" > "Actions"
   - Click "New repository secret"
   - Name: `SERVER_SSH_KEY`
   - Value: Copy the entire content of the private key file (~/.ssh/github_deploy_key)

### Option 2: Password Authentication

If you prefer to use password authentication:

1. In your GitHub repository, go to "Settings" > "Secrets and variables" > "Actions"
2. Click "New repository secret"
3. Name: `SERVER_PASSWORD`
4. Value: Your server SSH password

5. Edit the GitHub Actions workflow file (.github/workflows/deploy.yml) to uncomment the password lines:
   ```yaml
   - name: Deploy to server via SCP
     uses: appleboy/scp-action@master
     with:
       host: ${{ secrets.SERVER_HOST }}
       username: ${{ secrets.SERVER_USERNAME }}
       # key: ${{ secrets.SERVER_SSH_KEY }}
       password: ${{ secrets.SERVER_PASSWORD }}
       # ...
   ```

## Server Preparation

To prepare your server for SCP-based deployments, follow these steps:

1. Install Docker and Nginx:
   ```bash
   sudo apt update
   sudo apt install -y docker.io nginx unzip
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

4. Create Nginx configuration directories:
   ```bash
   mkdir -p /opt/one-time-secrets/test/docker/nginx/ssl
   mkdir -p /opt/one-time-secrets/test/docker/nginx/conf.d
   mkdir -p /opt/one-time-secrets/production/docker/nginx/ssl
   mkdir -p /opt/one-time-secrets/production/docker/nginx/conf.d
   ```

5. Set up SSL certificates using Nginx and Certbot:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d test.example.com
   sudo certbot --nginx -d example.com
   ```

6. Create symbolic links to the certificates:
   ```bash
   sudo ln -s /etc/letsencrypt/live/test.example.com/fullchain.pem /opt/one-time-secrets/test/docker/nginx/ssl/fullchain.pem
   sudo ln -s /etc/letsencrypt/live/test.example.com/privkey.pem /opt/one-time-secrets/test/docker/nginx/ssl/privkey.pem
   sudo ln -s /etc/letsencrypt/live/example.com/fullchain.pem /opt/one-time-secrets/production/docker/nginx/ssl/fullchain.pem
   sudo ln -s /etc/letsencrypt/live/example.com/privkey.pem /opt/one-time-secrets/production/docker/nginx/ssl/privkey.pem
   ```

## Triggering a Deployment

1. Go to the "Actions" tab in your GitHub repository
2. Select the "Deploy" workflow
3. Click "Run workflow"
4. Choose the environment (test or production)
5. Click "Run workflow" to start the deployment

## Deployment Process

The GitHub Actions workflow will:

1. Run tests to ensure the application is working correctly
2. Create a deployment package with all necessary files
3. Add a version.txt file with timestamp and commit hash
4. Create a zip archive of the deployment package
5. Transfer the zip file to your server using SCP
6. Extract the zip file on your server
7. Set up environment variables
8. Install production dependencies
9. Create the storage directory with appropriate permissions
10. Deploy the application using Docker Compose
11. Clean up temporary files

## Troubleshooting

### SSH Connection Issues

If you encounter SSH connection issues:

1. Verify that your server is accessible via SSH from your local machine:
   ```bash
   ssh user@your-server
   ```

2. Check that the SSH key or password is correctly set in GitHub secrets

3. Ensure the user has appropriate permissions on the server:
   ```bash
   sudo chown -R $USER:$USER /opt/one-time-secrets
   ```

### Deployment Failures

If the deployment fails:

1. Check the GitHub Actions logs for error messages

2. Verify that all required directories exist on the server:
   ```bash
   ls -la /opt/one-time-secrets
   ```

3. Check Docker and Docker Compose logs on your server:
   ```bash
   docker-compose -f /opt/one-time-secrets/test/docker/docker-compose.yml logs
   ```

4. Ensure Docker is running and the user has permissions to use it:
   ```bash
   sudo systemctl status docker
   groups $USER  # Should include 'docker'
   ```

### SSL Certificate Issues

If you encounter SSL certificate issues:

1. Verify that the certificates are correctly linked:
   ```bash
   ls -la /opt/one-time-secrets/test/docker/nginx/ssl/
   ```

2. Check certificate expiration dates:
   ```bash
   sudo certbot certificates
   ```

3. Renew certificates if needed:
   ```bash
   sudo certbot renew
   ```
