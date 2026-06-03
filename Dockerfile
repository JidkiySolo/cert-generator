FROM node:18-slim

RUN apt-get update && apt-get install -y \
    wget gnupg ca-certificates \
    libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxrandr2 libgbm1 libxss1 libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Бэкенд зависимости
COPY package*.json ./
RUN npm install --omit=dev

# 2. Фронтенд сборка
COPY frontend/ ./frontend/
RUN cd frontend && npm install && npm run build

# 3. ВАЖНО: Выводим содержимое папки dist в логи Railway
RUN echo "=== ПРОВЕРКА ПАПКИ DIST ===" && ls -laR frontend/dist

# 4. Код сервера и шрифты
COPY server.js ./
COPY fonts/ ./fonts/

ENV HOST=0.0.0.0
ENV PORT=8080

EXPOSE 8080
CMD ["npm", "start"]