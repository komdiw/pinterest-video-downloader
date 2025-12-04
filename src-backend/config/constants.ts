// Application constants

export const APP_NAME = 'Pinterest Video Downloader';
export const APP_VERSION = '2.0.0';
export const APP_DESCRIPTION = 'TypeScript-based Pinterest video downloader with CLI and web interface';

// URL patterns and regex
export const URL_PATTERNS = {
  PINTEREST_PIN: /(?:https?:\/\/)?(?:www\.)?pinterest\.[a-z]{2,}\/pin\/(\d+)/i,
  PINTEREST_PIN_ID: /(?:https?:\/\/)?(?:www\.)?pinterest\.[a-z]{2,}\/pin\/([^\/\s]+)/i,
  PIN_IT_SHORT: /(?:https?:\/\/)?pin\.it\/([^\/\s]+)/i,
  PINTEREST_BOARD: /(?:https?:\/\/)?(?:www\.)?pinterest\.[a-z]{2,}\/([^\/\s]+)\/([^\/\s]+)/i,
  PINTEREST_USER: /(?:https?:\/\/)?(?:www\.)?pinterest\.[a-z]{2,}\/([^\/\s]+)\/?$/i
};

export const VALID_DOMAINS = [
  'pinterest.com',
  'pinterest.co.uk',
  'pinterest.it',
  'pinterest.fr',
  'pinterest.de',
  'pinterest.es',
  'pinterest.com.mx',
  'pinterest.ca',
  'pinterest.com.au',
  'pin.it'
];

// File constants
export const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm', 'avi', 'm4v', 'mkv'];
export const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
export const DEFAULT_VIDEO_EXTENSION = 'mp4';

// HTTP constants
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

// Request timeout constants
export const TIMEOUTS = {
  PINTEREST_SCRAPING: 15000, // 15 seconds
  VIDEO_INFO: 10000, // 10 seconds
  DOWNLOAD_START: 30000, // 30 seconds
  DOWNLOAD_CHUNK: 60000, // 60 seconds
  API_REQUEST: 30000 // 30 seconds
};

// Retry constants
export const RETRY = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 10000, // 10 seconds
  BACKOFF_FACTOR: 2
};

// Progress tracking
export const PROGRESS = {
  UPDATE_INTERVAL: 1000, // 1 second
  SPEED_SAMPLES: 10,
  MIN_PROGRESS_UPDATE: 1 // Minimum percent change to trigger update
};

// File naming patterns
export const FILE_NAMING = {
  MAX_TITLE_LENGTH: 100,
  TIMESTAMP_FORMAT: 'YYYY-MM-DD_HH-mm-ss',
  SAFE_FILENAME_REGEX: /[<>:"/\\|?*]/g,
  WHITESPACE_REGEX: /\s+/g
};

// API endpoints
export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  INFO: '/api/info',
  DOWNLOAD: '/api/download',
  STATS: '/api/stats',
  SEARCH: '/api/search'
};

// CLI command constants
export const CLI_COMMANDS = {
  DOWNLOAD: 'download',
  INFO: 'info',
  HELP: 'help',
  VERSION: 'version'
};

// Error messages
export const ERROR_MESSAGES = {
  INVALID_URL: 'Invalid Pinterest URL provided',
  NO_VIDEO_FOUND: 'No video found in the provided URL',
  DOWNLOAD_FAILED: 'Failed to download video',
  FILE_TOO_LARGE: 'File size exceeds maximum allowed limit',
  NETWORK_ERROR: 'Network error occurred',
  RATE_LIMITED: 'Rate limit exceeded. Please try again later',
  INVALID_QUALITY: 'Invalid video quality specified',
  PERMISSION_DENIED: 'Permission denied when accessing file system',
  DISK_FULL: 'Insufficient disk space',
  TIMEOUT: 'Request timeout exceeded',
  UNKNOWN_ERROR: 'An unknown error occurred'
};

// Success messages
export const SUCCESS_MESSAGES = {
  VIDEO_FOUND: 'Video found successfully',
  DOWNLOAD_STARTED: 'Download started',
  DOWNLOAD_COMPLETED: 'Download completed successfully',
  FILE_SAVED: 'File saved to',
  SERVER_STARTED: 'Server started on',
  SERVER_STOPPED: 'Server stopped'
};

// Reserved paths and keywords
export const RESERVED_PATHS = [
  'pin', 'board', 'search', 'ideas', 'login', 'register', 'settings',
  'about', 'business', 'developers', 'help', 'terms', 'privacy',
  'api', 'oauth', 'widgets', 'resources', 'trending', 'today'
];

export const RESERVED_KEYWORDS = [
  'pinterest', 'pin', 'board', 'video', 'download', 'save', 'share'
];

// Quality mappings
export const QUALITY_MAPPING = {
  high: 'highest',
  medium: 'medium',
  low: 'lowest'
};

// Content types
export const CONTENT_TYPES = {
  JSON: 'application/json',
  HTML: 'text/html',
  TEXT: 'text/plain',
  VIDEO_MP4: 'video/mp4',
  VIDEO_WEBM: 'video/webm',
  VIDEO_MOV: 'video/quicktime',
  OCTET_STREAM: 'application/octet-stream'
};

// Cache settings
export const CACHE = {
  VIDEO_INFO_TTL: 300000, // 5 minutes
  DOWNLOAD_LINK_TTL: 60000, // 1 minute
  MAX_CACHE_SIZE: 100 // Maximum number of cached items
};

// Rate limiting
export const RATE_LIMITS = {
  WINDOW_MS: 900000, // 15 minutes
  MAX_REQUESTS: 100, // Maximum requests per window
  API_MAX_REQUESTS: 50, // API specific limit
  DOWNLOAD_MAX_REQUESTS: 20 // Download specific limit
};

// Logging levels
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Metadata constants
export const METADATA = {
  AUTHOR: 'Pinterest Video Downloader Team',
  LICENSE: 'MIT',
  REPOSITORY: 'https://github.com/example/pinterest-video-downloader',
  DOCUMENTATION: 'https://docs.pinterest-video-downloader.com'
};