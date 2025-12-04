import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs-extra';
import path from 'path';
import ProgressBar from 'progress';

class PinterestDownloader {
  constructor(outputDir = './downloads') {
    this.outputDir = outputDir;
    this.ensureOutputDir();
  }

  async ensureOutputDir() {
    await fs.ensureDir(this.outputDir);
  }

  async download(url, quality = 'high') {
    try {
      console.log('🔍 Поиск видео...');

      // Извлекаем информацию о видео
      const videoInfo = await this.extractVideoInfo(url);

      if (!videoInfo || !videoInfo.videoUrl) {
        throw new Error('Не удалось найти видео URL');
      }

      console.log(`✅ Видео найдено: ${videoInfo.title || 'Без названия'}`);
      console.log(`🎥 Длительность: ${videoInfo.duration || 'Неизвестно'}`);

      // Выбираем лучшее качество
      const videoUrl = this.selectBestQuality(videoInfo, quality);

      // Генерируем имя файла
      const fileName = this.generateFileName(videoInfo.title, videoUrl);
      const filePath = path.join(this.outputDir, fileName);

      console.log(`💾 Сохранение в: ${fileName}`);

      // Загружаем видео
      await this.downloadVideo(videoUrl, filePath);

      console.log('🎉 Готово! Видео успешно загружено!');

    } catch (error) {
      throw new Error(`Ошибка загрузки: ${error.message}`);
    }
  }

  async extractVideoInfo(url) {
    try {
      console.log(`🔍 Анализ страницы: ${url}`);

      // Улучшенные заголовки для полной имитации браузера
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"'
      };

      const response = await axios.get(url, {
        headers,
        timeout: 15000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      console.log(`📄 Страница загружена, размер: ${response.data.length} символов`);

      // Расширенный поиск видео данных
      const searchPatterns = [
        // Ищем window.__INITIAL_STATE__
        () => {
          const scriptText = $('script:contains("__INITIAL_STATE__")').html();
          if (scriptText) {
            const match = scriptText.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/s);
            if (match) {
              try {
                const data = JSON.parse(match[1]);
                console.log(`📊 Найден __INITIAL_STATE__`);
                return this.parseVideoData(data);
              } catch (e) {
                console.log(`⚠️ Ошибка парсинга __INITIAL_STATE__: ${e.message}`);
              }
            }
          }
          return null;
        },

        // Ищем window.__PWS_DATA__
        () => {
          const scriptText = $('script:contains("__PWS_DATA__")').html();
          if (scriptText) {
            const match = scriptText.match(/window\.__PWS_DATA__\s*=\s*({.+?});/s);
            if (match) {
              try {
                const data = JSON.parse(match[1]);
                console.log(`📊 Найден __PWS_DATA__`);
                return this.parseVideoData(data);
              } catch (e) {
                console.log(`⚠️ Ошибка парсинга __PWS_DATA__: ${e.message}`);
              }
            }
          }
          return null;
        },

        // Ищем видео URL напрямую в HTML
        () => {
          const html = response.data;
          const videoPatterns = [
            /https:\/\/v\d+\.pinimg\.com\/videos\/[^"']+\.(?:mp4|mov|webm)/gi,
            /"video_url":\s*"([^"]+\.mp4[^"]*)"/gi,
            /https:\/\/[^\s"']+\.mp4[^"']*/gi,
            /src:\s*["']([^"']+\.mp4[^"']*)["']/gi
          ];

          for (const pattern of videoPatterns) {
            const matches = html.match(pattern);
            if (matches) {
              console.log(`🎥 Найдены видео URL: ${matches.length} шт.`);

              // Очищаем и валидируем URL
              const rawUrls = matches.map(m => {
                const urlMatch = m.match(/"([^"]+)"/);
                return urlMatch ? urlMatch[1] : m;
              });

              const validVideoUrls = [];

              for (const rawUrl of rawUrls) {
                // Очищаем URL от лишних символов
                let cleanedUrl = rawUrl.replace(/['"]/g, '').trim();

                // Добавляем протокол если отсутствует
                if (cleanedUrl.startsWith('//')) {
                  cleanedUrl = 'https:' + cleanedUrl;
                } else if (!cleanedUrl.startsWith('http')) {
                  cleanedUrl = 'https://' + cleanedUrl;
                }

                // Проверяем валидность URL
                if (this.isValidVideoUrl(cleanedUrl)) {
                  validVideoUrls.push(cleanedUrl);
                } else {
                  console.log(`⚠️ Неверный URL: ${cleanedUrl}`);
                }
              }

              if (validVideoUrls.length > 0) {
                console.log(`✅ Валидных видео URL: ${validVideoUrls.length} шт.`);
                console.log(`🎥 Первый URL: ${validVideoUrls[0]}`);

                return {
                  videoUrl: validVideoUrls[0],
                  title: this.extractTitleFromPage($),
                  duration: null,
                  formats: validVideoUrls.map((url, i) => ({
                    url: url,
                    quality: i === 0 ? 'high' : 'medium'
                  }))
                };
              }
            }
          }
          return null;
        },

        // Ищем теги video
        () => {
          const videoElements = $('video');
          if (videoElements.length > 0) {
            console.log(`🎬 Найдены video элементы: ${videoElements.length} шт.`);
            const videoUrls = [];

            videoElements.each((i, elem) => {
              const src = $(elem).attr('src');
              if (src && src.includes('mp4')) {
                videoUrls.push(src);
              }

              $(elem).find('source').each((j, source) => {
                const sourceSrc = $(source).attr('src');
                if (sourceSrc && sourceSrc.includes('mp4')) {
                  videoUrls.push(sourceSrc);
                }
              });
            });

            if (videoUrls.length > 0) {
              return {
                videoUrl: videoUrls[0],
                title: this.extractTitleFromPage($),
                duration: null,
                formats: videoUrls.map((url, i) => ({
                  url: url,
                  quality: i === 0 ? 'high' : 'medium'
                }))
              };
            }
          }
          return null;
        }
      ];

      // Пробуем все паттерны поиска
      for (const [index, pattern] of searchPatterns.entries()) {
        try {
          console.log(`🔍 Проба паттерна ${index + 1} из ${searchPatterns.length}...`);
          const result = pattern();
          if (result && result.videoUrl) {
            console.log(`✅ Видео найдено через паттерн ${index + 1}`);
            return result;
          }
        } catch (error) {
          console.log(`⚠️ Паттерн ${index + 1} не сработал: ${error.message}`);
        }
      }

      // Если ничего не нашли
      console.log(`❌ Видео не найдено ни одним из методов`);
      return await this.fallbackVideoExtraction(url);

    } catch (error) {
      console.error(`❌ Ошибка извлечения видео: ${error.message}`);
      throw new Error(`Не удалось извлечь информацию о видео: ${error.message}`);
    }
  }

  extractTitleFromPage($) {
    // Пытаемся извлечь заголовок из разных мест
    const titleSelectors = [
      'meta[property="og:title"]',
      'meta[name="description"]',
      'title',
      'h1',
      '[data-test-id="pinTitle"]'
    ];

    for (const selector of titleSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const title = element.attr('content') || element.text();
        if (title && title.trim().length > 0) {
          return title.trim().substring(0, 100);
        }
      }
    }

    return 'Pinterest Video';
  }

  isValidVideoUrl(url) {
    try {
      // Базовая проверка URL
      const urlObj = new URL(url);

      // Проверяем протокол
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }

      // Проверяем домен Pinterest
      const validDomains = [
        'v.pinimg.com',
        'v1.pinimg.com',
        'v2.pinimg.com',
        'v3.pinimg.com',
        'i.pinimg.com',
        'media.tumblr.com',
        'pinimg.com'
      ];

      const isValidDomain = validDomains.some(domain =>
        urlObj.hostname.includes(domain)
      ) || urlObj.hostname.includes('pinimg');

      if (!isValidDomain) {
        return false;
      }

      // Проверяем расширение файла
      const validExtensions = ['.mp4', '.mov', '.webm', '.avi', '.m4v'];
      const hasValidExtension = validExtensions.some(ext =>
        url.toLowerCase().includes(ext)
      );

      // Также проверяем, что URL содержит параметры видео
      const hasVideoParams = url.toLowerCase().includes('mp4') ||
                            url.toLowerCase().includes('video') ||
                            url.includes('hls') ||
                            url.includes('dash');

      return hasValidExtension || hasVideoParams;

    } catch (error) {
      console.log(`❌ Ошибка валидации URL ${url}: ${error.message}`);
      return false;
    }
  }

  async fallbackVideoExtraction(url) {
    try {
      // Попытка найти видео через Pinterest API
      const pinId = this.extractPinId(url);
      if (!pinId) {
        throw new Error('Не удалось извлечь ID пина из URL');
      }

      // Здесь можно добавить логику для работы с Pinterest API
      // Пока вернем базовую информацию
      return {
        videoUrl: null,
        title: `Pinterest Video ${pinId}`,
        duration: null,
        formats: [],
        needsApi: true
      };

    } catch (error) {
      throw new Error(`Резервный метод не сработал: ${error.message}`);
    }
  }

  extractPinId(url) {
    const match = url.match(/pinterest\.com\/pin\/(\d+)/);
    return match ? match[1] : null;
  }

  parseVideoData(data) {
    // Парсинг данных из __INITIAL_STATE__
    try {
      const pins = data?.resources?.PinResource;
      if (!pins) return null;

      const pinData = Object.values(pins)[0]?.data;
      if (!pinData) return null;

      const videos = pinData.videos || {};
      const videoList = videos.video_list || {};

      const formats = Object.values(videoList).map(video => ({
        url: video.url,
        quality: video.quality || 'unknown',
        width: video.width,
        height: video.height
      }));

      return {
        videoUrl: formats[0]?.url,
        title: pinData.title || pinData.description || 'Pinterest Video',
        duration: pinData.duration ? `${Math.floor(pinData.duration / 60)}:${(pinData.duration % 60).toString().padStart(2, '0')}` : null,
        formats: formats
      };

    } catch (error) {
      return null;
    }
  }

  selectBestQuality(videoInfo, preferredQuality) {
    if (!videoInfo.formats || videoInfo.formats.length === 0) {
      return videoInfo.videoUrl;
    }

    // Сортируем по качеству
    const qualityOrder = {
      'high': 3,
      'medium': 2,
      'low': 1,
      'unknown': 0
    };

    const sortedFormats = videoInfo.formats.sort((a, b) => {
      return (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0);
    });

    // Ищем предпочтительное качество
    const preferredFormat = sortedFormats.find(f => f.quality === preferredQuality);
    return preferredFormat ? preferredFormat.url : sortedFormats[0].url;
  }

  generateFileName(title, videoUrl) {
    // Очищаем название от недопустимых символов
    const cleanTitle = (title || 'pinterest_video')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    // Определяем расширение
    const extension = this.getFileExtension(videoUrl) || 'mp4';

    return `${cleanTitle}_${Date.now()}.${extension}`;
  }

  getFileExtension(url) {
    const urlParts = url.split('?')[0];
    const extension = path.extname(urlParts);
    return extension ? extension.substring(1) : null;
  }

  async downloadVideo(url, filePath) {
    try {
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.pinterest.com/'
        }
      });

      const totalLength = parseInt(response.headers['content-length'], 10);

      if (!totalLength) {
        console.log('📥 Загрузка...');
      } else {
        const progressBar = new ProgressBar('📥 Загрузка [:bar] :percent :etas', {
          complete: '=',
          incomplete: ' ',
          width: 40,
          total: totalLength
        });

        response.data.on('data', (chunk) => {
          progressBar.tick(chunk.length);
        });
      }

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

    } catch (error) {
      // Удаляем частично загруженный файл
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
      }
      throw error;
    }
  }
}

export default PinterestDownloader;