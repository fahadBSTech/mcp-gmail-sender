# Dockerfile for Email MCP Server
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Set environment variables for HTTP transport
ENV TRANSPORT=http
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Start the server
CMD ["node", "dist/src/index.js"]