// Configured HTTP client with browser simulation

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { NetworkError } from '../types/errors';

export interface HttpClientConfig {
  timeout?: number;
  maxRedirects?: number;
  userAgent?: string;
  additionalHeaders?: Record<string, string>;
}

export class HttpClient {
  private client: AxiosInstance;

  constructor(config: HttpClientConfig = {}) {
    const defaultHeaders = {
      'User-Agent': config.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
      'sec-ch-ua-platform': '"macOS"',
      ...config.additionalHeaders
    };

    this.client = axios.create({
      timeout: config.timeout || 15000,
      maxRedirects: config.maxRedirects || 5,
      headers: defaultHeaders,
      // Important for Pinterest to not block requests
      validateStatus: (status) => status < 500, // Don't throw for 4xx errors
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add request timestamp
        (config as any).metadata = { startTime: new Date() };
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Calculate request duration
        const endTime = new Date();
        const duration = endTime.getTime() - (response.config as any).metadata?.startTime?.getTime();

        // Log request info (could be enhanced with proper logging)
        if (process.env.NODE_ENV === 'development') {
          console.log(`HTTP ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);
        }

        return response;
      },
      (error) => {
        // Handle network errors
        if (error.code === 'ECONNABORTED') {
          throw new NetworkError(`Request timeout: ${error.message}`, 'TIMEOUT', {
            url: error.config?.url,
            timeout: error.config?.timeout
          });
        }

        if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          const message = error.response.data?.message || `HTTP ${status} error`;

          throw new NetworkError(message, `HTTP_${status}`, {
            url: error.config?.url,
            status,
            response: error.response.data
          });
        }

        if (error.request) {
          // Network error (no response)
          throw new NetworkError(`Network error: ${error.message}`, 'NETWORK_ERROR', {
            url: error.config?.url,
            code: error.code
          });
        }

        // Other errors
        throw new NetworkError(`Request failed: ${error.message}`, 'REQUEST_ERROR', {
          url: error.config?.url,
          originalError: error
        });
      }
    );
  }

  async get(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.client.get(url, config);
  }

  async post(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.client.post(url, data, config);
  }

  async put(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.client.put(url, data, config);
  }

  async delete(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.client.delete(url, config);
  }

  async head(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.client.head(url, config);
  }

  // Method for downloading files with progress tracking
  async downloadFile(
    url: string,
    onProgress?: (progress: { percent: number; transferred: number; total: number }) => void
  ): Promise<ArrayBuffer> {
    const response = await this.client.get(url, {
      responseType: 'arraybuffer',
      onDownloadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({
            percent,
            transferred: progressEvent.loaded,
            total: progressEvent.total
          });
        }
      }
    });

    return response.data;
  }

  // Get the underlying axios instance for advanced usage
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

// Create default instances
export const defaultHttpClient = new HttpClient();

export const pinterestHttpClient = new HttpClient({
  timeout: 15000,
  maxRedirects: 5,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  additionalHeaders: {
    'Referer': 'https://www.pinterest.com/',
    'Origin': 'https://www.pinterest.com',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty'
  }
});

// Download-specific client with different timeout settings
export const downloadHttpClient = new HttpClient({
  timeout: 0, // No timeout for downloads
  maxRedirects: 10
});