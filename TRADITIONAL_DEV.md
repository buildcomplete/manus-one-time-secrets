# Traditional Development Guide

This guide explains how to set up and use a traditional development environment for the One-Time Secrets application using npm and Node.js directly on your machine.

## Prerequisites

- [Node.js](https://nodejs.org/) (version 16.x or 18.x recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/one-time-secrets.git
   cd one-time-secrets
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development

To start the application in development mode:

```bash
npm run dev
```

This will start the application with nodemon, which automatically restarts the server when you make changes to the code.

The application will be available at http://localhost:3000

## Testing

To run the tests:

```bash
npm test
```

For test coverage:

```bash
npm test -- --coverage
```

## Building for Production

To build the application for production:

```bash
npm run build
```

## Running in Production

To run the application in production mode:

```bash
npm start
```

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
└── storage/              # Secret storage directory (created at runtime)
```

## Environment Variables

The application uses the following environment variables:

- `PORT`: The port to run the application on (default: 3000)
- `NODE_ENV`: The environment to run the application in (development, test, production)

You can create a `.env` file in the root directory to set these variables:

```
PORT=3000
NODE_ENV=development
```

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```
   Error: listen EADDRINUSE: address already in use :::3000
   ```
   Solution: Change the port in the `.env` file or use the `PORT` environment variable:
   ```bash
   PORT=3001 npm run dev
   ```

2. **Missing dependencies**:
   ```
   Error: Cannot find module 'some-module'
   ```
   Solution: Make sure you've installed all dependencies:
   ```bash
   npm install
   ```

3. **Storage directory permissions**:
   ```
   Error: EACCES: permission denied, mkdir 'storage'
   ```
   Solution: Create the storage directory manually with appropriate permissions:
   ```bash
   mkdir -p storage
   chmod 777 storage
   ```

### Getting Help

If you encounter issues not covered here, please:

1. Check the error logs
2. Search for similar issues in the project's issue tracker
3. Create a new issue with detailed information about the problem
