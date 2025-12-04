FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source files
COPY . .

# Create downloads directory
RUN mkdir -p /tmp/downloads

# Run the full Pinterest downloader server
CMD ["npm", "start"]