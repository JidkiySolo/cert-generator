FROM node:18-slim

# 1. Устанавливаем зависимости для Puppeteer (Chromium)
RUN apt-get update && apt-get install -y \
    wget gnupg ca-certificates \
    libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxrandr2 libgbm1 libxss1 libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Копируем корневой package.json и ставим зависимости бэкенда
COPY package*.json ./
RUN npm install --omit=dev

# 3. Копируем фронтенд, ставим зависимости и собираем его
COPY frontend/ ./frontend/
RUN cd frontend && npm install && npm run build

# 4. Копируем код сервера и шрифты
COPY server.js ./
COPY fonts/ ./fonts/

# 5. Настройки окружения для Railway
ENV HOST=0.0.0.0
ENV PORT=8080

EXPOSE 8080
CMD ["npm", "start"]