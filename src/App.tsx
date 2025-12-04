import React, { useState } from 'react';
import LiquidEther from './components/LiquidEther';
import './index.css';

interface DownloadResult {
  title: string;
  duration?: string;
  fileSize: string;
  downloadUrl: string;
  cached: boolean;
  fileName: string;
  quality?: string;
}

function App() {
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState('high');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          quality: quality
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Произошла ошибка при загрузке видео');
      }
    } catch (err) {
      setError('Не удалось подключиться к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      {/* Liquid Ether Background */}
      <LiquidEther
        colors={['#5227FF', '#FF9FFC', '#B19EEF', '#E60023', '#00D082']}
        mouseForce={25}
        cursorSize={120}
        isViscous={false}
        viscous={20}
        iterationsViscous={16}
        iterationsPoisson={16}
        resolution={0.6}
        isBounce={false}
        autoDemo={true}
        autoSpeed={0.3}
        autoIntensity={1.8}
        takeoverDuration={0.3}
        autoResumeDelay={2000}
        autoRampDuration={0.8}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1
        }}
      />

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh' }}>
        <div className="container">
          <header className="header">
            <div className="logo-section">
              <div className="pinterest-logo">
                <div className="logo-circle">P</div>
                <span className="logo-text">interest</span>
              </div>
            </div>

            <div className="hero-content">
              <h1 className="main-title">
                <span className="title-gradient">Video Downloader</span>
                <br />
                <span className="title-sub">Сохраняйте лучшие моменты</span>
              </h1>
              <p className="hero-description">
                Extract and download Pinterest videos in HD quality.
                Preserve your inspiration offline with style.
              </p>
            </div>
          </header>

          <div className="main-content">
            <div className="download-card">
              <div className="card-header">
                <div className="step-indicator">
                  <span className="step-number">1</span>
                  <span className="step-text">Вставьте URL видео</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="download-form">
                <div className="url-section-enhanced">
                  <div className="input-container">
                    <div className="input-label">
                      <span className="label-icon">🔗</span>
                      <span className="label-text">Pinterest URL</span>
                    </div>
                    <div className="input-wrapper-enhanced">
                      <div className="input-icon-left">📎</div>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Вставьте ссылку на пин с видео..."
                        className="url-field-enhanced"
                        required
                      />
                    </div>
                    <div className="input-helper">Поддерживаются все домены Pinterest (pinterest.com, pin.it и др.)</div>
                  <div className="input-actions">
                    <button
                      type="button"
                      onClick={() => setUrl('')}
                      className="clear-button"
                    >
                      Очистить
                    </button>
                  </div>
                  </div>
                </div>

                <div className="quality-section-enhanced">
                  <div className="quality-selector">
                    <div className="quality-header">
                      <span className="quality-icon">🎥</span>
                      <h3 className="quality-title">Выберите качество видео</h3>
                    </div>
                    <div className="quality-options-enhanced">
                      <label className="quality-option-enhanced">
                        <input
                          type="radio"
                          name="quality"
                          value="low"
                          checked={quality === 'low'}
                          onChange={() => setQuality('low')}
                        />
                        <div className="quality-card">
                          <div className="quality-icon-wrapper low-quality">
                            <span className="quality-icon">⬇</span>
                          </div>
                          <div className="quality-info">
                            <span className="quality-text">Низкое</span>
                            <span className="quality-desc">Быстрее загрузка</span>
                          </div>
                        </div>
                      </label>

                      <label className="quality-option-enhanced">
                        <input
                          type="radio"
                          name="quality"
                          value="medium"
                          checked={quality === 'medium'}
                          onChange={() => setQuality('medium')}
                        />
                        <div className="quality-card">
                          <div className="quality-icon-wrapper medium-quality">
                            <span className="quality-icon">⚖</span>
                          </div>
                          <div className="quality-info">
                            <span className="quality-text">Стандартное</span>
                            <span className="quality-desc">Оптимальный баланс</span>
                          </div>
                        </div>
                      </label>

                      <label className="quality-option-enhanced">
                        <input
                          type="radio"
                          name="quality"
                          value="high"
                          checked={quality === 'high'}
                          onChange={() => setQuality('high')}
                        />
                        <div className="quality-card">
                          <div className="quality-icon-wrapper high-quality">
                            <span className="quality-icon">⬆</span>
                          </div>
                          <div className="quality-info">
                            <span className="quality-text">Высокое</span>
                            <span className="quality-desc">Лучшее качество</span>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="download-button-enhanced">
                  <div className="button-glow"></div>
                  <span className="button-content">
                    {loading ? (
                      <>
                        <div className="spinner"></div>
                        <span className="button-text">Загрузка...</span>
                      </>
                    ) : (
                      <>
                        <svg className="download-icon-enhanced" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7,10 12,15 17,10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        <span className="button-text">Скачать видео</span>
                        <span className="button-arrow">→</span>
                      </>
                    )}
                  </span>
                  <div className="button-ripple-effect"></div>
                </button>
              </form>
            </div>

            {result && (
              <div className="result-section">
                <div className="result-card">
                  <div className="success-animation">
                    <div className="success-circle">
                      <svg className="success-check" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20,6 9,17 4,12"></polyline>
                      </svg>
                    </div>
                  </div>

                  <h3 className="result-title">Видео успешно загружено!</h3>

                  <div className="video-info">
                    <p><strong>Название:</strong> {result.title}</p>
                    {result.duration && <p><strong>Длительность:</strong> {result.duration}</p>}
                    <p><strong>Размер:</strong> {result.fileSize}</p>
                  </div>

                  <div className="result-actions">
                    <a href={result.downloadUrl} className="action-button primary" download>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7,10 12,15 17,10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Сохранить видео
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setResult(null);
                        setUrl('');
                      }}
                      className="action-button secondary"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23,4 23,10 17,10"></polyline>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                      </svg>
                      Новое видео
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="error-section">
                <div className="error-card">
                  <div className="error-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  </div>

                  <h3 className="error-title">Упс! Что-то пошло не так</h3>

                  <div className="error-message">
                    {error}
                  </div>

                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="retry-button"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23,4 23,10 17,10"></polyline>
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                    Попробовать снова
                  </button>
                </div>
              </div>
            )}
          </div>

          <footer className="footer">
            <div className="footer-content">
              <p className="footer-text">
                Made with <span className="heart">❤️</span> for Pinterest lovers
              </p>
              <div className="footer-links">
                <a href="#" className="footer-link">Privacy</a>
                <span className="separator">•</span>
                <a href="#" className="footer-link">Terms</a>
                <span className="separator">•</span>
                <a href="#" className="footer-link">Contact</a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default App;