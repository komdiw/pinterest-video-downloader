// API-specific type definitions

import { Request, Response } from 'express';
import { DownloadRequest, VideoInfoResponse, DownloadResponse, HealthResponse, StatsResponse, VideoInfo } from './index';

// Express request extensions
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    ip: string;
  };
}

// API route handlers
export type ApiHandler<T = any> = (req: AuthenticatedRequest, res: Response<T>) => Promise<void>;

// Middleware types
export type MiddlewareFunction = (req: AuthenticatedRequest, res: Response, next: (err?: Error) => void) => void;

// API endpoints
export interface ApiEndpoints {
  'GET /api/health': ApiHandler<HealthResponse>;
  'GET /api/stats': ApiHandler;
  'POST /api/info': ApiHandler<VideoInfoResponse>;
  'POST /api/download': ApiHandler<DownloadResponse>;
  'GET /downloads/:filename': ApiHandler;
}

// Validation schemas
export interface ValidationSchema {
  body?: Record<string, any>;
  query?: Record<string, any>;
  params?: Record<string, any>;
}

// API error responses
export interface ApiErrorResponse {
  success: false;
  error: {
    type: string;
    message: string;
    code?: string;
    details?: Record<string, any>;
    timestamp: string;
  };
}

// Rate limiting
export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

// Request metadata
export interface RequestMetadata {
  ip: string;
  userAgent: string;
  timestamp: Date;
  method: string;
  url: string;
  headers: Record<string, string>;
}

// File upload types (for future features)
export interface FileUploadRequest {
  file: {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
  };
}

// WebSocket types (for future real-time progress)
export interface WebSocketMessage {
  type: 'progress' | 'complete' | 'error' | 'info';
  id: string;
  data: any;
  timestamp: Date;
}

export interface ProgressUpdate {
  downloadId: string;
  percent: number;
  transferred: number;
  total: number;
  speed?: number;
  eta?: number;
}

// Search and filtering types
export interface SearchQuery {
  q?: string;
  quality?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'size' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  items: VideoInfo[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}