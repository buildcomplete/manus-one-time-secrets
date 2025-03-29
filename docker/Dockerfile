# Use Node.js 18 as the base image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app source
COPY . .

# Create storage directory with appropriate permissions
RUN mkdir -p storage && chmod 777 storage

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "src/index.js"]
