// Main application configuration

import { AppConfig, QualityOption } from '../types';

// Environment variables
const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  HOST: process.env.HOST || 'localhost',
  DEFAULT_OUTPUT_DIR: process.env.DEFAULT_OUTPUT_DIR || './downloads',
  DEFAULT_QUALITY: (process.env.DEFAULT_QUALITY as QualityOption) || 'high',
  REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT || '15000', 10),
  MAX_REDIRECTS: parseInt(process.env.MAX_REDIRECTS || '5', 10),
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3002',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

// Development vs Production settings
const isDevelopment = env.NODE_ENV === 'development';
const isProduction = env.NODE_ENV === 'production';
const isTest = env.NODE_ENV === 'test';

export const config: AppConfig = {
  server: {
    port: env.PORT,
    host: env.HOST,
    cors: {
      origin: isDevelopment
        ? [env.CORS_ORIGIN, 'http://localhost:3000', 'http://localhost:5173']
        : [env.CORS_ORIGIN],
      credentials: true
    }
  },

  download: {
    timeout: 0, // No timeout for downloads
    maxRetries: env.MAX_RETRIES,
    defaultQuality: env.DEFAULT_QUALITY,
    defaultOutputDir: env.DEFAULT_OUTPUT_DIR
  },

  pinterest: {
    timeout: env.REQUEST_TIMEOUT,
    maxRedirects: env.MAX_REDIRECTS,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    headers: {
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
      ...(isDevelopment && {
        'Referer': 'https://www.pinterest.com/',
        'Origin': 'https://www.pinterest.com'
      })
    }
  }
};

// Additional configuration exports
export const environment = {
  isDevelopment,
  isProduction,
  isTest,
  nodeVersion: process.version,
  platform: process.platform
};

export const paths = {
  outputDir: env.DEFAULT_OUTPUT_DIR,
  logDir: './logs',
  tempDir: './tmp',
  publicDir: './public',
  srcDir: './src-backend'
};

export const limits = {
  maxFileSize: 1024 * 1024 * 1024, // 1GB
  maxConcurrentDownloads: 5,
  requestTimeout: env.REQUEST_TIMEOUT,
  downloadTimeout: 0 // No timeout for downloads
};

export const logging = {
  level: env.LOG_LEVEL,
  format: isDevelopment ? 'dev' : 'combined',
  file: {
    enabled: isProduction,
    filename: 'app.log',
    maxSize: '10m',
    maxFiles: 5
  }
};

// Validation helpers
export function validateConfig(): void {
  const requiredEnvVars = [
    'PORT',
    'DEFAULT_OUTPUT_DIR'
  ];

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (config.server.port < 1 || config.server.port > 65535) {
    throw new Error(`Invalid PORT: ${config.server.port}. Must be between 1 and 65535.`);
  }

  if (!['high', 'medium', 'low'].includes(config.download.defaultQuality)) {
    throw new Error(`Invalid DEFAULT_QUALITY: ${config.download.defaultQuality}`);
  }
}

// Export config helpers
export function getConfig(): AppConfig {
  return config;
}

export function getEnv(): typeof env {
  return env;
}

export function isDev(): boolean {
  return isDevelopment;
}

export function isProd(): boolean {
  return isProduction;
}

export function isTestEnv(): boolean {
  return isTest;
}