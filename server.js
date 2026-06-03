const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' })); // Увеличил лимит на случай больших base64

let browser;

(async () => {
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none']
    });
    console.log('✅ Chromium успешно запущен');
  } catch (err) {
    console.error('❌ Ошибка запуска Chromium:', err);
  }
})();

const escapeHtml = (str) => String(str).replace(/[&<>"'`=\/]/g, s => `&#${s.charCodeAt(0)};`);

app.post('/api/generate', async (req, res) => {
  try {
    const { fullName, issueDate } = req.body;
    if (!fullName || !issueDate) return res.status(400).json({ error: 'Поля обязательны' });

    // 1. Читаем шрифт в Base64
    const fontPath = path.join(__dirname, 'fonts', 'Montserrat-Regular.ttf');
    let fontBase64 = '';
    if (fs.existsSync(fontPath)) {
      fontBase64 = `data:font/ttf;base64,${fs.readFileSync(fontPath).toString('base64')}`;
    }

    // 2. Читаем ШАБЛОН (картинку) в Base64
    const templatePath = path.join(__dirname, 'frontend', 'dist', 'template.png');
    let templateBase64 = '';
    if (fs.existsSync(templatePath)) {
      const imgBuffer = fs.readFileSync(templatePath);
      templateBase64 = `data:image/png;base64,${imgBuffer.toString('base64')}`;
      console.log('✅ Шаблон template.png успешно загружен в память');
    } else {
      console.warn('⚠️ Шаблон template.png НЕ НАЙДЕН! Проверьте папку frontend/public/');
    }

    // 3. Формируем HTML
    const html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @font-face { 
          font-family: 'CertFont'; 
          src: url('${fontBase64}') format('truetype'); 
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          width: 210mm; 
          height: 297mm; 
          /* Встраиваем картинку напрямую. Если её нет, будет белый фон */
          background: #ffffff url('${templateBase64}') center/cover no-repeat; 
          position: relative; 
          font-family: 'CertFont', sans-serif; 
        }
        .title {
          position: absolute;
          top: 40mm; left: 0; right: 0;
          text-align: center;
          font-size: 48px;
          color: #1a365d;
          text-transform: uppercase;
          letter-spacing: 4px;
          font-weight: bold;
        }
        .name {
          position: absolute;
          top: 90mm; left: 20mm; right: 20mm;
          text-align: center;
          font-size: 42px;
          color: #2d3748;
          /* Подчеркивание УДАЛЕНО */
        }
        .date {
          position: absolute;
          bottom: 30mm; right: 20mm;
          font-size: 18px;
          color: #4a5568;
        }
      </style>
    </head>
    <body>
      <div class="name">${escapeHtml(fullName)}</div>
      <div class="date">Дата выдачи: ${escapeHtml(issueDate)}</div>
    </body>
    </html>`;

    if (!browser) throw new Error('Chromium не инициализирован');
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    
    const pdfBuffer = await page.pdf({ 
      format: 'A4', 
      printBackground: true, // Обязательно для фонов
      margin: { top: 0, right: 0, bottom: 0, left: 0 }, 
      preferCSSPageSize: true 
    });
    await page.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate_${Date.now()}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('❌ Ошибка PDF:', err.message);
    if (!res.headersSent) res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Раздача статики
const distPath = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not found. Run npm run build in frontend folder.');
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Сервер запущен на порту ${PORT}`));