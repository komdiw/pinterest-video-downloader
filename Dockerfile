FROM node:20-alpine

WORKDIR /app

# Install dependencies (production only - no React build needed)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source files
COPY src/ ./src/
COPY public/ ./public/

# Create downloads directory
RUN mkdir -p /tmp/downloads

# Set environment variables
ENV NODE_ENV=production
ENV DOWNLOADS_DIR=/tmp/downloads

# Expose port (CapRover sets PORT env variable)
EXPOSE 5000

# Run the main server
CMD ["node", "src/server.js"]
