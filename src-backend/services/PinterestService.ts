// Pinterest video extraction service

import { load as loadCheerio } from 'cheerio';
import { pinterestHttpClient } from '../utils/axios';
import {
  VideoInfo,
  ParsedVideoData,
  ExtractionResult,
  ExtractionStrategy,
  QualityOption,
  ValidationError,
  ParseError,
  NetworkError
} from '../types';
import { parseUrl, validateUrl } from '../utils/urlValidator';

export class PinterestService {
  private readonly videoDomains = [
    'v.pinimg.com',
    'v1.pinimg.com',
    'v2.pinimg.com',
    'v3.pinimg.com',
    'i.pinimg.com',
    'media.tumblr.com',
    'pinimg.com'
  ];

  private readonly titleSelectors = [
    'meta[property="og:title"]',
    'meta[name="description"]',
    'title',
    'h1',
    '[data-test-id="pinTitle"]'
  ];

  /**
   * Extract video information from Pinterest URL
   */
  async extractVideoInfo(url: string, preferredQuality: QualityOption = 'high'): Promise<VideoInfo> {
    validateUrl(url);

    const strategies: ExtractionStrategy[] = [
      'initial_state',
      'pws_data',
      'script_tags',
      'html_video',
      'pattern_matching',
      'fallback'
    ];

    let lastError: Error | null = null;

    for (const strategy of strategies) {
      try {
        console.log(`🔍 Trying extraction strategy: ${strategy}`);

        const result = await this.tryExtractionStrategy(url, strategy);

        if (result.success && result.data) {
          const videoInfo = this.buildVideoInfo(result.data, url, preferredQuality);
          console.log(`✅ Video extracted successfully using ${strategy} strategy`);
          return videoInfo;
        }

        if (result.error) {
          lastError = new ParseError(result.error);
        }

      } catch (error) {
        console.log(`⚠️ Strategy ${strategy} failed:`, (error as Error).message);
        lastError = error as Error;
      }
    }

    // If all strategies failed
    const errorMessage = lastError?.message || 'No video found in the provided URL';
    throw new ParseError(`Failed to extract video information: ${errorMessage}`, 'EXTRACTION_FAILED');
  }

  /**
   * Try a specific extraction strategy
   */
  private async tryExtractionStrategy(url: string, strategy: ExtractionStrategy): Promise<ExtractionResult> {
    try {
      switch (strategy) {
        case 'initial_state':
          return await this.extractFromInitialState(url);

        case 'pws_data':
          return await this.extractFromPwsData(url);

        case 'script_tags':
          return await this.extractFromScriptTags(url);

        case 'html_video':
          return await this.extractFromHtmlVideo(url);

        case 'pattern_matching':
          return await this.extractByPatternMatching(url);

        case 'fallback':
          return await this.fallbackExtraction(url);

        default:
          return {
            strategy,
            success: false,
            error: `Unknown extraction strategy: ${strategy}`
          };
      }

    } catch (error) {
      return {
        strategy,
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Extract video data from window.__INITIAL_STATE__
   */
  private async extractFromInitialState(url: string): Promise<ExtractionResult> {
    const response = await this.fetchPage(url);
    const $ = loadCheerio(response.data);

    const scriptText = $('script:contains("__INITIAL_STATE__")').html();
    if (!scriptText) {
      return { strategy: 'initial_state', success: false, error: '__INITIAL_STATE__ not found' };
    }

    const match = scriptText.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/s);
    if (!match) {
      return { strategy: 'initial_state', success: false, error: 'Invalid __INITIAL_STATE__ format' };
    }

    try {
      const data = JSON.parse(match[1]);
      const videoData = this.parseVideoDataFromState(data);

      if (videoData.videoUrls.length > 0) {
        return {
          strategy: 'initial_state',
          success: true,
          data: {
            videoUrls: videoData.videoUrls,
            title: this.extractTitleFromPage($),
            description: videoData.description,
            duration: videoData.duration,
            thumbnail: videoData.thumbnail
          }
        };
      }

    } catch (error) {
      return {
        strategy: 'initial_state',
        success: false,
        error: `Failed to parse __INITIAL_STATE__: ${(error as Error).message}`
      };
    }

    return { strategy: 'initial_state', success: false, error: 'No video data found' };
  }

  /**
   * Extract video data from window.__PWS_DATA__
   */
  private async extractFromPwsData(url: string): Promise<ExtractionResult> {
    const response = await this.fetchPage(url);
    const $ = loadCheerio(response.data);

    const scriptText = $('script:contains("__PWS_DATA__")').html();
    if (!scriptText) {
      return { strategy: 'pws_data', success: false, error: '__PWS_DATA__ not found' };
    }

    const match = scriptText.match(/window\.__PWS_DATA__\s*=\s*({.+?});/s);
    if (!match) {
      return { strategy: 'pws_data', success: false, error: 'Invalid __PWS_DATA__ format' };
    }

    try {
      const data = JSON.parse(match[1]);
      const videoData = this.parseVideoDataFromPws(data);

      if (videoData.videoUrls.length > 0) {
        return {
          strategy: 'pws_data',
          success: true,
          data: {
            videoUrls: videoData.videoUrls,
            title: this.extractTitleFromPage($),
            description: videoData.description,
            duration: videoData.duration,
            thumbnail: videoData.thumbnail
          }
        };
      }

    } catch (error) {
      return {
        strategy: 'pws_data',
        success: false,
        error: `Failed to parse __PWS_DATA__: ${(error as Error).message}`
      };
    }

    return { strategy: 'pws_data', success: false, error: 'No video data found' };
  }

  /**
   * Extract video URLs from script tags using regex
   */
  private async extractFromScriptTags(url: string): Promise<ExtractionResult> {
    const response = await this.fetchPage(url);
    const $ = loadCheerio(response.data);
    const html = response.data;

    const videoPatterns = [
      /https:\/\/v\d+\.pinimg\.com\/videos\/[^"']+\.(?:mp4|mov|webm)[^"']*/gi,
      /"video_url":\s*"([^"]+\.mp4[^"]*)"/gi,
      /"url":\s*"([^"]+\.mp4[^"]*)"/gi,
      /https:\/\/[^\s"']+\.mp4[^"']*/gi,
      /src:\s*["']([^"']+\.mp4[^"']*)["']/gi
    ];

    const videoUrls: string[] = [];

    for (const pattern of videoPatterns) {
      const matches = html.match(pattern);
      if (matches) {
        for (const match of matches) {
          const urlMatch = match.match(/"([^"]+)"/);
          let videoUrl = urlMatch ? urlMatch[1] : match;
          videoUrl = videoUrl.replace(/['"]/g, '').trim();

          if (videoUrl.startsWith('//')) {
            videoUrl = 'https:' + videoUrl;
          } else if (!videoUrl.startsWith('http')) {
            videoUrl = 'https://' + videoUrl;
          }

          if (this.isValidVideoUrl(videoUrl) && !videoUrls.includes(videoUrl)) {
            videoUrls.push(videoUrl);
          }
        }
      }
    }

    if (videoUrls.length > 0) {
      return {
        strategy: 'script_tags',
        success: true,
        data: {
          videoUrls,
          title: this.extractTitleFromPage($),
          thumbnail: this.extractThumbnailFromPage($)
        }
      };
    }

    return { strategy: 'script_tags', success: false, error: 'No video URLs found in script tags' };
  }

  /**
   * Extract video URLs from HTML video elements
   */
  private async extractFromHtmlVideo(url: string): Promise<ExtractionResult> {
    const response = await this.fetchPage(url);
    const $ = loadCheerio(response.data);

    const videoElements = $('video');
    const videoUrls: string[] = [];

    videoElements.each((_, elem) => {
      const src = $(elem).attr('src');
      if (src && this.isValidVideoUrl(src)) {
        videoUrls.push(src);
      }

      $(elem).find('source').each((_, source) => {
        const sourceSrc = $(source).attr('src');
        if (sourceSrc && this.isValidVideoUrl(sourceSrc)) {
          videoUrls.push(sourceSrc);
        }
      });
    });

    if (videoUrls.length > 0) {
      return {
        strategy: 'html_video',
        success: true,
        data: {
          videoUrls,
          title: this.extractTitleFromPage($),
          thumbnail: this.extractThumbnailFromPage($)
        }
      };
    }

    return { strategy: 'html_video', success: false, error: 'No video elements found' };
  }

  /**
   * Extract videos by pattern matching in HTML content
   */
  private async extractByPatternMatching(url: string): Promise<ExtractionResult> {
    const response = await this.fetchPage(url);
    const $ = loadCheerio(response.data);
    const html = response.data;

    // More comprehensive patterns
    const patterns = [
      /https:\/\/[a-zA-Z0-9.-]*pinimg\.com\/videos\/[^"'\s<>]+\.(?:mp4|mov|webm|avi|m4v)/gi,
      /https:\/\/v[0-9]\.pinimg\.com\/[^"'\s<>]+\.(?:mp4|mov|webm|avi|m4v)/gi,
      /"videoUrl":\s*"([^"]+\.(?:mp4|mov|webm|avi|m4v)[^"]*)"/gi,
      /'videoUrl':\s*'([^']+\.(?:mp4|mov|webm|avi|m4v)[^']*)'/gi,
      /url:\s*["']([^"']+\.(?:mp4|mov|webm|avi|m4v)[^"']*)["']/gi
    ];

    const videoUrls = new Set<string>();

    for (const pattern of patterns) {
      const matches = html.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const urlMatch = match.match(/["']([^"']+)["']/);
          let videoUrl = urlMatch ? urlMatch[1] : match;
          videoUrl = videoUrl.replace(/['"]/g, '').trim();

          if (videoUrl.startsWith('//')) {
            videoUrl = 'https:' + videoUrl;
          } else if (!videoUrl.startsWith('http')) {
            videoUrl = 'https://' + videoUrl;
          }

          if (this.isValidVideoUrl(videoUrl)) {
            videoUrls.add(videoUrl);
          }
        });
      }
    }

    if (videoUrls.size > 0) {
      return {
        strategy: 'pattern_matching',
        success: true,
        data: {
          videoUrls: Array.from(videoUrls),
          title: this.extractTitleFromPage($),
          thumbnail: this.extractThumbnailFromPage($)
        }
      };
    }

    return { strategy: 'pattern_matching', success: false, error: 'No video URLs found with pattern matching' };
  }

  /**
   * Fallback extraction method
   */
  private async fallbackExtraction(url: string): Promise<ExtractionResult> {
    const parsedUrl = parseUrl(url);

    if (!parsedUrl.pinId) {
      return {
        strategy: 'fallback',
        success: false,
        error: 'Cannot extract pin ID from URL'
      };
    }

    // For now, just return basic info
    // In a real implementation, this could use Pinterest API
    return {
      strategy: 'fallback',
      success: false,
      error: 'Fallback extraction not implemented yet'
    };
  }

  /**
   * Fetch page content with proper headers
   */
  private async fetchPage(url: string) {
    return await pinterestHttpClient.get(url);
  }

  /**
   * Parse video data from __INITIAL_STATE__
   */
  private parseVideoDataFromState(data: any): ParsedVideoData {
    try {
      const pins = data?.resources?.PinResource;
      if (!pins) return { videoUrls: [] };

      const pinData = Object.values(pins)[0] as any;
      if (!pinData?.data) return { videoUrls: [] };

      const videos = pinData.data.videos || {};
      const videoList = videos.video_list || {};

      const videoUrls = Object.values(videoList)
        .filter((video: any) => video?.url)
        .map((video: any) => (video as any).url);

      return {
        videoUrls,
        title: pinData.data.title || pinData.data.description,
        description: pinData.data.description,
        thumbnail: pinData.data.images?.orig?.url,
        duration: pinData.data.duration ?
          `${Math.floor(pinData.data.duration / 60)}:${(pinData.data.duration % 60).toString().padStart(2, '0')}` :
          undefined,
        author: pinData.data.board?.name
      };

    } catch (error) {
      return { videoUrls: [] };
    }
  }

  /**
   * Parse video data from __PWS_DATA__
   */
  private parseVideoDataFromPws(data: any): ParsedVideoData {
    try {
      // Similar parsing logic for PWS_DATA structure
      const pins = data?.resources?.PinResource;
      if (!pins) return { videoUrls: [] };

      // Extract video URLs from PWS data structure
      const videoUrls: string[] = [];

      // Implementation would depend on actual PWS_DATA structure
      // This is a placeholder for the actual parsing logic

      return {
        videoUrls,
        title: 'Pinterest Video',
        description: 'Video from Pinterest'
      };

    } catch (error) {
      return { videoUrls: [] };
    }
  }

  /**
   * Extract title from page meta tags
   */
  private extractTitleFromPage($: any): string {
    for (const selector of this.titleSelectors) {
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

  /**
   * Extract thumbnail from page
   */
  private extractThumbnailFromPage($: any): string | undefined {
    const thumbnailSelectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      '[data-test-id="pinImage"] img',
      'img[src*="pinimg.com"]'
    ];

    for (const selector of thumbnailSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const src = element.attr('content') || element.attr('src');
        if (src && src.trim().length > 0) {
          return src.trim();
        }
      }
    }

    return undefined;
  }

  /**
   * Validate if URL is a valid video URL
   */
  private isValidVideoUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);

      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }

      const isValidDomain = this.videoDomains.some(domain =>
        urlObj.hostname.includes(domain)
      ) || urlObj.hostname.includes('pinimg');

      if (!isValidDomain) {
        return false;
      }

      const validExtensions = ['.mp4', '.mov', '.webm', '.avi', '.m4v'];
      const hasValidExtension = validExtensions.some(ext =>
        url.toLowerCase().includes(ext)
      );

      const hasVideoParams = url.toLowerCase().includes('mp4') ||
                            url.toLowerCase().includes('video') ||
                            url.includes('hls') ||
                            url.includes('dash');

      return hasValidExtension || hasVideoParams;

    } catch {
      return false;
    }
  }

  /**
   * Build VideoInfo from extracted data
   */
  private buildVideoInfo(data: ParsedVideoData, originalUrl: string, preferredQuality: QualityOption): VideoInfo {
    if (data.videoUrls.length === 0) {
      throw new ParseError('No video URLs found', 'NO_VIDEO_URLS');
    }

    // Map URLs to quality options
    const qualityUrls: Record<QualityOption, string> = {
      high: data.videoUrls[0], // Use first URL as high quality
      medium: data.videoUrls[Math.floor(data.videoUrls.length / 2)] || data.videoUrls[0],
      low: data.videoUrls[data.videoUrls.length - 1] || data.videoUrls[0]
    };

    return {
      title: data.title || 'Pinterest Video',
      videoUrl: qualityUrls[preferredQuality] || data.videoUrls[0],
      thumbnailUrl: data.thumbnail,
      duration: data.duration,
      description: data.description,
      author: data.author,
      quality: qualityUrls
    };
  }
}