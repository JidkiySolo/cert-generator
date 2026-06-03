import { useState } from 'react';
import './App.css';

function App() {
  const [fullName, setFullName] = useState('Иванов Иван Иванович');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, issueDate }),
      });

      if (!response.ok) throw new Error('Ошибка сервера');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Не удалось сгенерировать сертификат. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="controls">
        <h2>Настройки сертификата</h2>
        <div className="form-group">
          <label>ФИО Получателя:</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Введите ФИО" />
        </div>
        <div className="form-group">
          <label>Дата выдачи:</label>
          <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
        </div>
        <button onClick={handleDownload} disabled={isLoading}>
          {isLoading ? 'Генерация...' : 'Скачать PDF'}
        </button>
      </div>

      <div className="preview-area">
        <h3>Предпросмотр (A4)</h3>
        <div className="certificate-preview">
          <div className="preview-border"></div>
          <div className="preview-name">{fullName || 'ФИО Получателя'}</div>
          <div className="preview-date">Дата выдачи: {issueDate}</div>
        </div>
      </div>
    </div>
  );
}

export default App;