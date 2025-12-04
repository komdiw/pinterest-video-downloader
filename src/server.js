import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs-extra';
import PinterestDownloader from './downloader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const DOWNLOADS_DIR = process.env.DOWNLOADS_DIR || '/tmp/downloads';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Статические файлы
app.use(express.static(path.join(__dirname, '../public')));
app.use('/downloads', express.static(DOWNLOADS_DIR));

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API эндпоинт для загрузки видео
app.post('/api/download', async (req, res) => {
    try {
        const { url, quality = 'high' } = req.body;

        if (!url) {
            return res.status(400).json({
                error: 'URL видео обязателен'
            });
        }

        // Валидация URL (временно отключена для тестирования)
        // const pinterestRegex = /^https?:\/\/(www\.|ru\.|it\.|fr\.|de\.|es\.|pt\.|jp\.|kr\.|au\.|ca\.|nz\.|ie\.|in\.|ph\.|sg\.|my\.|th\.|id\.|vn\.|mx\.|br\.|ar\.|cl\.|co\.|pe\.)?(pinterest\.com|pinterest\.(it|fr|de|co\.uk|ru|es|pt|jp|kr|au|ca|nz|ie|in|ph|sg|my|th|id|vn|mx|br|ar|cl|co|pe)|pin\.it)\/pin\//i;
        // if (!pinterestRegex.test(url)) {
        //     return res.status(400).json({
        //         error: 'Некорректный URL Pinterest. Пожалуйста, используйте URL вида: https://pinterest.com/pin/1234567890'
        //     });
        // }
        console.log(`🔗 URL принят: ${url}`);

        console.log(`🎬 Загрузка видео: ${url}, качество: ${quality}`);

        const downloader = new PinterestDownloader(DOWNLOADS_DIR);
        const videoInfo = await downloader.extractVideoInfo(url);

        if (!videoInfo || !videoInfo.videoUrl) {
            return res.status(404).json({
                error: 'Видео не найдено. Убедитесь, что это URL видео из Pinterest.'
            });
        }

        // Выбираем лучшее качество
        const finalVideoUrl = downloader.selectBestQuality(videoInfo, quality);

        // Генерируем имя файла
        const fileName = downloader.generateFileName(videoInfo.title, finalVideoUrl);
        const filePath = path.join(DOWNLOADS_DIR, fileName);

        // Проверяем, существует ли уже файл
        if (await fs.pathExists(filePath)) {
            console.log(`✅ Видео уже существует: ${fileName}`);

            const stats = await fs.stat(filePath);
            const fileSize = (stats.size / (1024 * 1024)).toFixed(2);

            return res.json({
                success: true,
                title: videoInfo.title,
                duration: videoInfo.duration,
                quality: quality,
                fileName: fileName,
                fileSize: `${fileSize} MB`,
                downloadUrl: `/downloads/${fileName}`,
                cached: true
            });
        }

        // Загружаем видео
        await downloader.downloadVideo(finalVideoUrl, filePath);

        // Получаем информацию о файле
        const stats = await fs.stat(filePath);
        const fileSize = (stats.size / (1024 * 1024)).toFixed(2);

        console.log(`✅ Видео успешно загружено: ${fileName} (${fileSize} MB)`);

        res.json({
            success: true,
            title: videoInfo.title,
            duration: videoInfo.duration,
            quality: quality,
            fileName: fileName,
            fileSize: `${fileSize} MB`,
            downloadUrl: `/downloads/${fileName}`,
            cached: false
        });

    } catch (error) {
        console.error('❌ Ошибка загрузки видео:', error);

        // Определяем тип ошибки
        let statusCode = 500;
        let errorMessage = 'Внутренняя ошибка сервера';

        if (error.message.includes('Не удалось извлечь')) {
            statusCode = 404;
            errorMessage = 'Видео не найдено. Убедитесь, что это правильный URL видео из Pinterest.';
        } else if (error.message.includes('timeout')) {
            statusCode = 408;
            errorMessage = 'Превышено время ожидания. Попробуйте еще раз.';
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
            statusCode = 503;
            errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
        } else if (error.message.includes('EACCES') || error.message.includes('EPERM')) {
            statusCode = 500;
            errorMessage = 'Ошибка доступа к файлам. Проверьте права доступа.';
        }

        res.status(statusCode).json({
            error: errorMessage,
            details: error.message
        });
    }
});

// API для получения информации о видео без загрузки
app.post('/api/info', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                error: 'URL видео обязателен'
            });
        }

        const downloader = new PinterestDownloader();
        const videoInfo = await downloader.extractVideoInfo(url);

        if (!videoInfo) {
            return res.status(404).json({
                error: 'Видео не найдено'
            });
        }

        res.json({
            success: true,
            title: videoInfo.title,
            duration: videoInfo.duration,
            formats: videoInfo.formats || []
        });

    } catch (error) {
        console.error('❌ Ошибка получения информации о видео:', error);
        res.status(500).json({
            error: 'Не удалось получить информацию о видео'
        });
    }
});

// API для проверки здоровья сервера
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
    });
});

// API для получения статистики
app.get('/api/stats', async (req, res) => {
    try {
        if (!(await fs.pathExists(DOWNLOADS_DIR))) {
            return res.json({
                totalFiles: 0,
                totalSize: '0 MB'
            });
        }

        const files = await fs.readdir(DOWNLOADS_DIR);
        const videoFiles = files.filter(file =>
            /\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i.test(file)
        );

        let totalSize = 0;
        for (const file of videoFiles) {
            const filePath = path.join(DOWNLOADS_DIR, file);
            const stats = await fs.stat(filePath);
            totalSize += stats.size;
        }

        res.json({
            totalFiles: videoFiles.length,
            totalSize: `${(totalSize / (1024 * 1024)).toFixed(2)} MB`,
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Ошибка получения статистики:', error);
        res.status(500).json({
            error: 'Не удалось получить статистику'
        });
    }
});

// Обработка 404
app.use((req, res) => {
    res.status(404).json({
        error: 'Эндпоинт не найден'
    });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
    console.error('❌ Глобальная ошибка:', err);
    res.status(500).json({
        error: 'Внутренняя ошибка сервера'
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log('🚀 Pinterest Video Downloader Server');
    console.log('=====================================');
    console.log(`🌐 Сервер запущен: http://localhost:${PORT}`);
    console.log(`📁 Папка для загрузок: ${DOWNLOADS_DIR}`);
    console.log(`⏰ Запущено: ${new Date().toLocaleString()}`);
    console.log('');
    console.log('Доступные эндпоинты:');
    console.log(`  GET  /                 - Главная страница`);
    console.log(`  POST /api/download     - Загрузка видео`);
    console.log(`  POST /api/info         - Информация о видео`);
    console.log(`  GET  /api/health       - Проверка здоровья`);
    console.log(`  GET  /api/stats        - Статистика загрузок`);
    console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM получен, завершение работы...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT получен, завершение работы...');
    process.exit(0);
});

export default app;