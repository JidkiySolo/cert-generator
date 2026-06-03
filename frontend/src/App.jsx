import { useState } from 'react';
import './App.css';

function App() {
  const [fullName, setFullName] = useState('Иванов Иван Иванович');
  const [organization, setOrganization] = useState('Название Организации');
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, organization }),
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
          <input 
            type="text" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            placeholder="Введите ФИО"
          />
        </div>
        <div className="form-group">
          <label>Название организации:</label>
          <input 
            type="text" 
            value={organization} 
            onChange={(e) => setOrganization(e.target.value)} 
            placeholder="Введите название организации"
          />
        </div>
        <button onClick={handleDownload} disabled={isLoading}>
          {isLoading ? 'Генерация...' : 'Скачать PDF'}
        </button>
      </div>

      <div className="preview-area">
        <h3>Предпросмотр (A4)</h3>
        <div className="certificate-preview">
          {/* Заголовок "СЕРТИФИКАТ" удален */}
          <div className="preview-name">{fullName || 'ФИО Получателя'}</div>
          <div className="preview-org">{organization || 'Название Организации'}</div>
        </div>
      </div>
    </div>
  );
}

export default App;