FROM node:18-alpine

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Копируем исходный код (включая debug файл)
COPY . .

# Создаем временную директорию для загрузок
RUN mkdir -p /tmp/downloads

# CapRover установит PORT переменную окружения
EXPOSE ${PORT:-3000}

# Устанавливаем переменные окружения по умолчанию
ENV NODE_ENV=production

# Health check для CapRover
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3000; require('http').get('http://localhost:' + port + '/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Запускаем простую тестовую версию
CMD ["npm", "run", "start:simple"]