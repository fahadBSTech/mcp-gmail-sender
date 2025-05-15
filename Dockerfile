# Dockerfile for Email MCP Server
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy the entire project first
COPY . .

# Install dependencies with script execution disabled
RUN npm ci --ignore-scripts && npm run build

# Set environment variables for HTTP transport
ENV TRANSPORT=http
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Start the server
CMD ["node", "dist/index.js"]