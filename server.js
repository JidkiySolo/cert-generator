const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));

let browser;

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

const escapeHtml = (str) => String(str).replace(/[&<>"'`=\/]/g, s => `&#${s.charCodeAt(0)};`);

// 1. API Маршрут
app.post('/api/generate', async (req, res) => {
  try {
    const { fullName, issueDate } = req.body;
    if (!fullName || !issueDate) return res.status(400).json({ error: 'Поля обязательны' });

    const fontPath = path.join(__dirname, 'fonts', 'Montserrat-Regular.ttf');
    let fontBase64 = '';
    if (fs.existsSync(fontPath)) {
      fontBase64 = `data:font/ttf;base64,${fs.readFileSync(fontPath).toString('base64')}`;
    }

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      @font-face { font-family: 'CertFont'; src: url('${fontBase64}') format('truetype'); }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { width: 210mm; height: 297mm; background: #fff; position: relative; font-family: 'CertFont', sans-serif; }
      .border { position: absolute; top: 10mm; left: 10mm; right: 10mm; bottom: 10mm; border: 2px solid #1a365d; border-radius: 4px; }
      .title { position: absolute; top: 40mm; left: 0; right: 0; text-align: center; font-size: 48px; color: #1a365d; text-transform: uppercase; letter-spacing: 4px; }
      .name { position: absolute; top: 90mm; left: 20mm; right: 20mm; text-align: center; font-size: 42px; color: #2d3748; border-bottom: 1px solid #cbd5e0; padding-bottom: 10px; }
      .date { position: absolute; bottom: 30mm; right: 20mm; font-size: 18px; color: #4a5568; }
    </style></head><body>
      <div class="border"></div>
      <div class="title">Сертификат</div>
      <div class="name">${escapeHtml(fullName)}</div>
      <div class="date">Дата выдачи: ${escapeHtml(issueDate)}</div>
    </body></html>`;

    if (!browser) throw new Error('Chromium не инициализирован');
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, preferCSSPageSize: true });
    await page.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate_${Date.now()}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('❌ Ошибка PDF:', err.message);
    if (!res.headersSent) res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 2. Диагностика: Явная проверка, существует ли собранный фронтенд
const distPath = path.join(__dirname, 'frontend', 'dist');
console.log('📂 Ожидаемый путь к фронтенду:', distPath);

app.get('/check-frontend', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    const files = fs.readdirSync(distPath);
    res.send(`<h1>Фронтенд найден!</h1><p>Файлы в папке dist: ${files.join(', ')}</p><hr><pre>${fs.readFileSync(indexPath, 'utf8')}</pre>`);
  } else {
    res.status(404).send('<h1>❌ ОШИБКА: Папка frontend/dist не найдена!</h1><p>Сборка Vite не сработала или файлы скопированы не туда.</p>');
  }
});

// 3. Раздача статики (БЕЗ app.get('*'), чтобы не ломать загрузку JS-файлов)
app.use(express.static(distPath));

// 4. Fallback для SPA (только если запрошенный путь не является файлом)
app.get('*', (req, res) => {
  // express.static уже обработал файлы, сюда попадут только несуществующие пути
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Сервер запущен на порту ${PORT}`));