FROM node:18-slim

# Устанавливаем ВСЕ зависимости для Chromium
RUN apt-get update && apt-get install -y \
    wget gnupg ca-certificates \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
    libxfixes3 libxrandr2 libgbm1 libasound2 \
    libpango-1.0-0 libcairo2 libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Бэкенд зависимости
COPY package*.json ./
RUN npm install --omit=dev

# Фронтенд сборка
COPY frontend/ ./frontend/
RUN cd frontend && npm install && npm run build

# Проверка папки dist (для отладки)
RUN echo "=== ПРОВЕРКА ПАПКИ DIST ===" && ls -laR frontend/dist

# Код сервера и шрифты
COPY server.js ./
COPY fonts/ ./fonts/

ENV HOST=0.0.0.0
ENV PORT=8080

EXPOSE 8080
CMD ["npm", "start"]