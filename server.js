// Найдите этот блок в server.js:
(async () => {
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none']
    });
    console.log('✅ Chromium успешно запущен');
  } catch (err) {
    console.error('❌ Ошибка запуска Chromium:', err);
  }
})();

// Замените на это (headless: "new"):
(async () => {
  try {
    browser = await puppeteer.launch({
      headless: "new", // Используем новый headless-режим
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none']
    });
    console.log('✅ Chromium успешно запущен');
  } catch (err) {
    console.error('❌ Ошибка запуска Chromium:', err);
  }
})();