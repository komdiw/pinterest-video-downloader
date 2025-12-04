FROM node:18-alpine

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Копируем исходный код
COPY --chown=nodejs:nodejs . .

# Создаем временную директорию для загрузок
RUN mkdir -p /tmp/downloads && chown nodejs:nodejs /tmp/downloads

USER nodejs

EXPOSE 80

# Health check for CapRover
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:80/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

CMD ["npm", "start"]