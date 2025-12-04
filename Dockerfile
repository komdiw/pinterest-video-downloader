FROM node:18-alpine

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Копируем исходный код (включая debug файл)
COPY --chown=nodejs:nodejs . .

# Создаем временную директорию для загрузок
RUN mkdir -p /tmp/downloads && chown nodejs:nodejs /tmp/downloads

USER nodejs

EXPOSE 80

# Устанавливаем переменные окружения по умолчанию
ENV NODE_ENV=production
ENV PORT=80
ENV DOWNLOADS_DIR=/tmp/downloads

# Health check для CapRover с детальной диагностикой
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "
console.log('🔍 Health check running...');
const http = require('http');
const options = { hostname: 'localhost', port: 80, path: '/api/health', timeout: 5000 };
const req = http.get(options, (res) => {
  console.log('🏥 Health check status:', res.statusCode);
  process.exit(res.statusCode === 200 ? 0 : 1);
});
req.on('error', (err) => {
  console.log('❌ Health check error:', err.message);
  process.exit(1);
});
req.on('timeout', () => {
  console.log('⏰ Health check timeout');
  req.destroy();
  process.exit(1);
});
"

# Запускаем с диагностикой
CMD ["sh", "-c", "echo '🚀 Starting Pinterest Video Downloader...' && echo '🌍 Environment:' && echo '  PORT='$PORT && echo '  NODE_ENV='$NODE_ENV && echo '  DOWNLOADS_DIR='$DOWNLOADS_DIR && npm run start:debug"]