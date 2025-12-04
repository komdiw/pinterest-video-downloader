// Core types for Pinterest Video Downloader

export interface VideoInfo {
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: string;
  description?: string;
  author?: string;
  boardName?: string;
  quality?: VideoQuality;
  size?: number;
  format?: string;
}

export interface VideoQuality {
  high?: string;
  medium?: string;
  low?: string;
}

export type QualityOption = 'high' | 'medium' | 'low';

export interface DownloadOptions {
  url: string;
  outputDir?: string;
  quality?: QualityOption;
  onProgress?: (progress: ProgressInfo) => void;
}

export interface ProgressInfo {
  percent: number;
  transferred: number;
  total: number;
  speed?: number;
  eta?: number;
}

export interface DownloadResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
  duration?: number;
}

export interface ParsedVideoData {
  videoUrls: string[];
  title?: string;
  description?: string;
  thumbnail?: string;
  duration?: string;
  author?: string;
  boardName?: string;
}

// Pinterest extraction strategies
export type ExtractionStrategy =
  | 'initial_state'
  | 'pws_data'
  | 'script_tags'
  | 'html_video'
  | 'pattern_matching'
  | 'fallback';

export interface ExtractionResult {
  strategy: ExtractionStrategy;
  success: boolean;
  data?: ParsedVideoData;
  error?: string;
}

// API Request/Response types
export interface DownloadRequest {
  url: string;
  quality?: QualityOption;
}

export interface VideoInfoResponse {
  success: boolean;
  data?: VideoInfo;
  error?: string;
}

export interface DownloadResponse {
  success: boolean;
  data?: {
    downloadUrl: string;
    fileName: string;
    fileSize: number;
    duration: number;
  };
  error?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
}

export interface StatsResponse {
  totalDownloads: number;
  totalSize: number;
  averageSize: number;
  recentDownloads: number;
}

// Error types
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DOWNLOAD_ERROR = 'DOWNLOAD_ERROR',
  FILE_ERROR = 'FILE_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// Re-export error classes for convenience
export { ValidationError, ParseError, NetworkError, DownloadError, FileError, RateLimitError, UnknownError } from './errors';

// Configuration types
export interface AppConfig {
  server: {
    port: number;
    host: string;
    cors: {
      origin: string[];
      credentials: boolean;
    };
  };
  download: {
    timeout: number;
    maxRetries: number;
    defaultQuality: QualityOption;
    defaultOutputDir: string;
  };
  pinterest: {
    timeout: number;
    maxRedirects: number;
    userAgent: string;
    headers: Record<string, string>;
  };
}

// File system types
export interface FileInfo {
  path: string;
  name: string;
  size: number;
  created: Date;
  modified: Date;
}

// CLI types
export interface CliCommand {
  name: string;
  description: string;
  handler: (args: any) => Promise<void>;
}

export interface CliProgressOptions {
  format?: string;
  width?: number;
  complete?: string;
  incomplete?: string;
}