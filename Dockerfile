FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source files
COPY . .

# Run the app
CMD ["node", "start-simple.js"]