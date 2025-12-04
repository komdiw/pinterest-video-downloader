// Pinterest Video Downloader - Interactive Frontend
document.addEventListener('DOMContentLoaded', function() {

    // Initialize Liquid Ether Background
    let liquidEther = null;
    const liquidEtherContainer = document.getElementById('liquidEther');

    if (liquidEtherContainer && window.LiquidEther) {
        liquidEther = new window.LiquidEther(liquidEtherContainer, {
            colors: ['#5227FF', '#FF9FFC', '#B19EEF', '#E60023', '#00D082'],
            mouseForce: 25,
            cursorSize: 120,
            isViscous: false,
            viscous: 20,
            iterationsViscous: 16,
            iterationsPoisson: 16,
            resolution: 0.6,
            isBounce: false,
            autoDemo: true,
            autoSpeed: 0.3,
            autoIntensity: 1.8,
            takeoverDuration: 0.3,
            autoResumeDelay: 2000,
            autoRampDuration: 0.8
        });
    }
    // DOM Elements
    const elements = {
        downloadForm: document.getElementById('downloadForm'),
        urlInput: document.getElementById('urlInput'),
        pasteBtn: document.getElementById('pasteBtn'),
        downloadBtn: document.querySelector('.download-button-enhanced'),
        progressSection: document.getElementById('progressSection'),
        resultSection: document.getElementById('resultSection'),
        errorSection: document.getElementById('errorSection'),
        progressFill: document.getElementById('progressFill'),
        progressText: document.getElementById('progressText'),
        statusText: document.getElementById('statusText'),
        downloadLink: document.getElementById('downloadLink'),
        newDownloadBtn: document.getElementById('newDownloadBtn'),
        retryBtn: document.getElementById('retryBtn'),
        errorMessage: document.getElementById('errorMessage'),
        videoInfo: document.getElementById('videoInfo'),
        extractStep: document.getElementById('extractStep'),
        downloadStep: document.getElementById('downloadStep'),
        completeStep: document.getElementById('completeStep')
    };

    // Animation Classes
    const animations = {
        shake: 'shake',
        pulse: 'pulse'
    };

    // Shake animation for invalid input
    const shakeAnimation = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }
        .shake {
            animation: shake 0.5s ease-in-out;
        }
    `;

    // Add shake animation to head
    if (!document.querySelector('#shake-styles')) {
        const style = document.createElement('style');
        style.id = 'shake-styles';
        style.textContent = shakeAnimation;
        document.head.appendChild(style);
    }

    // URL Validation (temporarily disabled for testing)
    function isValidPinterestURL(url) {
        // Always return true for now to test the core functionality
        return true;
    }

    // Show error with animation
    function showError(message) {
        const errorText = elements.errorMessage;
        errorText.innerHTML = `<p><strong>Ошибка:</strong> ${message}</p>
                               <p>Пожалуйста, проверьте URL и попробуйте снова.</p>`;

        elements.errorSection.style.display = 'block';
        elements.progressSection.style.display = 'none';
        elements.resultSection.style.display = 'none';

        // Add shake animation to error section
        elements.errorSection.classList.add(animations.shake);
        setTimeout(() => {
            elements.errorSection.classList.remove(animations.shake);
        }, 500);

        // Scroll to error
        elements.errorSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Show result with success animation
    function showResult(videoData) {
        elements.resultSection.style.display = 'block';
        elements.progressSection.style.display = 'none';
        elements.errorSection.style.display = 'none';

        // Update video info
        updateVideoInfo(videoData);

        // Set download link
        elements.downloadLink.href = videoData.downloadUrl;
        elements.downloadLink.download = videoData.filename || 'pinterest-video.mp4';

        // Scroll to result
        elements.resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Update video information display
    function updateVideoInfo(videoData) {
        const infoHTML = `
            <div class="video-details">
                <h4>📹 Информация о видео</h4>
                <div class="meta-grid">
                    <div class="meta-item">
                        <span class="meta-label">Качество:</span>
                        <span class="meta-value">${videoData.quality || 'HD'}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Размер:</span>
                        <span class="meta-value">${videoData.size || 'Неизвестно'}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Формат:</span>
                        <span class="meta-value">${videoData.format || 'MP4'}</span>
                    </div>
                </div>
                ${videoData.description ? `
                    <div class="video-description">
                        <h4>📝 Название</h4>
                        <p>${videoData.description}</p>
                    </div>
                ` : ''}
            </div>
        `;
        elements.videoInfo.innerHTML = infoHTML;
    }

    // Show progress section
    function showProgress() {
        elements.progressSection.style.display = 'block';
        elements.resultSection.style.display = 'none';
        elements.errorSection.style.display = 'none';

        // Reset progress
        elements.progressFill.style.width = '0%';
        elements.progressText.textContent = '0%';
        elements.statusText.textContent = 'Поиск видео...';

        // Reset steps
        resetSteps();

        // Scroll to progress
        elements.progressSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Reset progress steps
    function resetSteps() {
        const steps = document.querySelectorAll('.step');
        steps.forEach(step => step.classList.remove('completed'));
    }

    // Update progress
    function updateProgress(percentage, status, completedStep = null) {
        elements.progressFill.style.width = percentage + '%';
        elements.progressText.textContent = percentage + '%';
        elements.statusText.textContent = status;

        if (completedStep) {
            const stepElement = elements[completedStep + 'Step'];
            if (stepElement) {
                stepElement.classList.add('completed');
            }
        }
    }

    // Real download process with backend API
    async function downloadVideoFromAPI(url) {
        const quality = elements.downloadForm.querySelector('input[name="quality"]:checked').value;

        try {
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, quality })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка загрузки видео');
            }

            return {
                downloadUrl: data.downloadUrl,
                filename: data.fileName,
                quality: data.quality,
                size: data.fileSize,
                format: 'MP4',
                description: data.title || 'Отличное видео с Pinterest!'
            };

        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Simulate progress during real download
    async function simulateProgressDuringDownload() {
        const progressSteps = [
            { progress: 20, status: 'Поиск видео на Pinterest...', step: 'search' },
            { progress: 40, status: 'Извлечение видео URL...', step: 'extract' },
            { progress: 70, status: 'Загрузка видео...', step: 'download' },
            { progress: 90, status: 'Обработка файла...', step: 'process' },
            { progress: 95, status: 'Финализация...', step: 'complete' }
        ];

        for (const [index, step] of progressSteps.entries()) {
            updateProgress(step.progress, step.status, step.step);
            // Увеличиваем задержку для более реалистичного прогресса
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        }
    }

    // Handle paste button
    async function handlePaste() {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                elements.urlInput.value = text.trim();
                elements.urlInput.classList.add('valid');

                // Add success feedback with enhanced animation
                elements.pasteBtn.style.transform = 'translateY(-50%) scale(1.1) rotate(360deg)';
                elements.pasteBtn.style.background = 'linear-gradient(135deg, var(--accent-color), #00B875)';

                setTimeout(() => {
                    elements.pasteBtn.style.transform = 'translateY(-50%) scale(1)';
                    elements.pasteBtn.style.background = '';
                }, 600);

                // Show success toast
                showToast('URL вставлен из буфера обмена!', 'success');
            }
        } catch (err) {
            console.error('Failed to read clipboard:', err);
            showToast('Не удалось получить доступ к буферу обмена', 'error');
            // Fallback for browsers that don't support clipboard API
            elements.urlInput.focus();
            elements.urlInput.select();
        }
    }

    // Handle form submission
    async function handleFormSubmit(e) {
        e.preventDefault();

        const url = elements.urlInput.value.trim();

        // Validate URL
        if (!url) {
            showError('Пожалуйста, вставьте URL видео из Pinterest.');
            elements.urlInput.focus();
            elements.urlInput.classList.add('invalid');
            return;
        }

        if (!isValidPinterestURL(url)) {
            showError('Неверный формат URL. Пожалуйста, вставьте правильную ссылку на видео из Pinterest.');
            elements.urlInput.focus();
            elements.urlInput.classList.add('invalid');
            return;
        }

        // Clear any previous validation states
        elements.urlInput.classList.remove('invalid');

        // Disable button during download
        elements.downloadBtn.disabled = true;
        elements.downloadBtn.innerHTML = `
            <span class="button-content">
                <div class="loading-spinner"></div>
                <span class="button-text">Обработка...</span>
            </span>
        `;

        try {
            showProgress();

            // Start progress simulation
            const progressPromise = simulateProgressDuringDownload();

            // Start actual download
            const downloadPromise = downloadVideoFromAPI(url);

            // Wait for both to complete
            const [videoData] = await Promise.all([
                downloadPromise,
                progressPromise
            ]);

            // Final progress update
            updateProgress(100, 'Видео успешно загружено!', 'complete');

            // Small delay before showing result
            await new Promise(resolve => setTimeout(resolve, 500));

            showResult(videoData);

        } catch (error) {
            console.error('Download error:', error);
            showError(error.message || 'Не удалось скачать видео. Попробуйте другой URL.');
        } finally {
            // Re-enable button
            elements.downloadBtn.disabled = false;
            elements.downloadBtn.innerHTML = `
                <span class="button-content">
                    <svg class="download-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7,10 12,15 17,10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span class="button-text">Скачать видео</span>
                </span>
            `;
        }
    }

    // Handle new download button
    function handleNewDownload() {
        elements.urlInput.value = '';
        elements.urlInput.focus();
        elements.resultSection.style.display = 'none';
        elements.progressSection.style.display = 'none';
        elements.errorSection.style.display = 'none';

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Handle retry button
    function handleRetry() {
        elements.errorSection.style.display = 'none';
        handleFormSubmit(new Event('submit'));
    }

    // Input validation on change
    function handleInputChange() {
        const url = elements.urlInput.value.trim();

        if (!url) {
            elements.urlInput.classList.remove('valid', 'invalid');
            return;
        }

        if (isValidPinterestURL(url)) {
            elements.urlInput.classList.remove('invalid');
            elements.urlInput.classList.add('valid');
        } else {
            elements.urlInput.classList.remove('valid');
            elements.urlInput.classList.add('invalid');
        }
    }

    // Add CSS styles for validation states
    const validationStyles = `
        .url-field.valid {
            border-color: var(--accent-color);
        }
        .url-field.invalid {
            border-color: var(--error-color);
        }
        .loading-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        .video-details h4,
        .video-description h4 {
            color: var(--gray-700);
            margin-bottom: var(--space-2);
            font-size: 1rem;
        }
        .meta-grid {
            display: grid;
            gap: var(--space-3);
            margin-top: var(--space-2);
        }
        .meta-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .meta-label {
            color: var(--gray-500);
            font-weight: 500;
        }
        .meta-value {
            color: var(--gray-700);
            font-weight: 600;
        }
        .video-description {
            margin-top: var(--space-4);
            border-top: 1px solid var(--gray-200);
            padding-top: var(--space-4);
        }
        .video-description p {
            color: var(--gray-600);
            line-height: 1.6;
        }
    `;

    if (!document.querySelector('#validation-styles')) {
        const style = document.createElement('style');
        style.id = 'validation-styles';
        style.textContent = validationStyles;
        document.head.appendChild(style);
    }

    // Add custom styles for quality selector
    const qualityStyles = `
        .quality-option input[type="radio"]:checked + .quality-label {
            border-color: var(--pinterest-red);
            background: rgba(230, 0, 35, 0.05);
            color: var(--pinterest-red);
            font-weight: 600;
        }
    `;

    if (!document.querySelector('#quality-styles')) {
        const style = document.createElement('style');
        style.id = 'quality-styles';
        style.textContent = qualityStyles;
        document.head.appendChild(style);
    }

    // Event Listeners
    elements.downloadForm.addEventListener('submit', handleFormSubmit);
    elements.pasteBtn.addEventListener('click', handlePaste);
    elements.newDownloadBtn.addEventListener('click', handleNewDownload);
    elements.retryBtn.addEventListener('click', handleRetry);
    elements.urlInput.addEventListener('input', handleInputChange);

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + V when URL input is focused
        if ((e.ctrlKey || e.metaKey) && e.key === 'v' && document.activeElement === elements.urlInput) {
            setTimeout(handlePaste, 100);
        }

        // Escape to clear form
        if (e.key === 'Escape') {
            if (elements.resultSection.style.display !== 'none' ||
                elements.errorSection.style.display !== 'none') {
                handleNewDownload();
            }
        }
    });

    // Initialize with focus on URL input
    elements.urlInput.focus();

    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    // Log initialization
    console.log('🎯 Pinterest Video Downloader initialized');
    console.log('📍 Features: Real API integration, progress tracking, error handling');
});

// Error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});

// Service Worker registration for offline support (optional)
// Disabled for now - not implemented
if ('serviceWorker' in navigator) {
    console.log('Service Worker API detected but not implemented');
}