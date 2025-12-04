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

EXPOSE 3000

CMD ["npm", "start"]