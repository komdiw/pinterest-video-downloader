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

EXPOSE 4000

# Устанавливаем переменные окружения по умолчанию
ENV NODE_ENV=production
ENV PORT=4000
ENV DOWNLOADS_DIR=/tmp/downloads

# Health check для CapRover (упрощенный)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Запускаем простую тестовую версию для диагностики
CMD ["npm", "run", "start:simple"]