// URL validation utilities for Pinterest URLs

import { ValidationError } from '../types/errors.js';

export interface ParsedPinterestUrl {
  originalUrl: string;
  normalizedUrl: string;
  type: 'pin' | 'board' | 'user' | 'unknown';
  pinId?: string;
  boardId?: string;
  username?: string;
  domain: string;
}

export class UrlValidator {
  // Pinterest URL patterns
  private static readonly PATTERNS = {
    // Pin URLs
    PIN: [
      /^https?:\/\/(?:www\.)?pinterest\.[a-z]{2,}\/pin\/(\d+)/i,
      /^https?:\/\/(?:www\.)?pinterest\.[a-z]{2,}\/pin\/([^\/\s]+)\/?$/i,
      /^https?:\/\/pin\.it\/([^\/\s]+)\/?$/i,
      /^https?:\/\/(?:www\.)?pinterest\.co\.uk\/pin\/(\d+)/i,
      /^https?:\/\/(?:www\.)?pinterest\.it\/pin\/(\d+)/i,
      /^https?:\/\/(?:www\.)?pinterest\.fr\/pin\/(\d+)/i,
      /^https?:\/\/(?:www\.)?pinterest\.de\/pin\/(\d+)/i,
      /^https?:\/\/(?:www\.)?pinterest\.es\/pin\/(\d+)/i,
      /^https?:\/\/(?:www\.)?pinterest\.com\.mx\/pin\/(\d+)/i,
      /^https?:\/\/(?:www\.)?pinterest\.ca\/pin\/(\d+)/i,
      /^https?:\/\/(?:www\.)?pinterest\.com\.au\/pin\/(\d+)/i,
    ],

    // Board URLs
    BOARD: [
      /^https?:\/\/(?:www\.)?pinterest\.[a-z]{2,}\/([^\/\s]+)\/([^\/\s]+)\/?$/i,
    ],

    // User profile URLs
    USER: [
      /^https?:\/\/(?:www\.)?pinterest\.[a-z]{2,}\/([^\/\s]+)\/?$/i,
    ]
  };

  // Valid Pinterest domains
  private static readonly VALID_DOMAINS = [
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

  /**
   * Validates if a URL is a valid Pinterest URL
   */
  static validatePinterestUrl(url: string): void {
    if (!url || typeof url !== 'string') {
      throw new ValidationError('URL is required and must be a string', 'url', url);
    }

    try {
      const parsedUrl = new URL(url.trim());

      // Check domain
      const hostname = parsedUrl.hostname.toLowerCase();
      const isValidDomain = this.VALID_DOMAINS.some(domain =>
        hostname === domain || hostname.endsWith(`.${domain}`)
      );

      if (!isValidDomain) {
        throw new ValidationError(
          `Invalid Pinterest domain: ${hostname}. Valid domains are: ${this.VALID_DOMAINS.join(', ')}`,
          'url',
          url
        );
      }

      // Check if it's a valid Pinterest URL structure
      const isValidPinterestUrl = this.isValidPinterestStructure(parsedUrl);
      if (!isValidPinterestUrl) {
        throw new ValidationError(
          'Invalid Pinterest URL structure. Expected formats: https://pinterest.com/pin/[PIN_ID] or https://pin.it/[SHORT_CODE]',
          'url',
          url
        );
      }

    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Invalid URL format', 'url', url);
    }
  }

  /**
   * Parses a Pinterest URL and extracts information
   */
  static parsePinterestUrl(url: string): ParsedPinterestUrl {
    this.validatePinterestUrl(url);

    const trimmedUrl = url.trim();
    const parsedUrl = new URL(trimmedUrl);

    // Normalize URL (remove www, ensure https)
    const normalizedUrl = this.normalizeUrl(trimmedUrl);

    let type: ParsedPinterestUrl['type'] = 'unknown';
    let pinId: string | undefined;
    let boardId: string | undefined;
    let username: string | undefined;

    const pathname = parsedUrl.pathname;

    // Check for pin URLs
    for (const pattern of this.PATTERNS.PIN) {
      const match = pathname.match(pattern);
      if (match) {
        type = 'pin';
        pinId = match[1];
        break;
      }
    }

    // Check for board URLs if not a pin
    if (!pinId) {
      const boardMatch = pathname.match(/^\/([^\/\s]+)\/([^\/\s]+)\/?$/i);
      if (boardMatch && !this.isReservedPath(boardMatch[2])) {
        type = 'board';
        username = boardMatch[1];
        boardId = boardMatch[2];
      }
    }

    // Check for user URLs if not pin or board
    if (!pinId && !boardId) {
      const userMatch = pathname.match(/^\/([^\/\s]+)\/?$/i);
      if (userMatch && !this.isReservedPath(userMatch[1])) {
        type = 'user';
        username = userMatch[1];
      }
    }

    return {
      originalUrl: trimmedUrl,
      normalizedUrl,
      type,
      pinId,
      boardId,
      username,
      domain: parsedUrl.hostname
    };
  }

  /**
   * Checks if URL points to a video content
   */
  static isVideoUrl(url: string): boolean {
    const parsed = this.parsePinterestUrl(url);
    // For now, assume all pins might have video content
    // In a real implementation, we might need to fetch the page to determine this
    return parsed.type === 'pin';
  }

  /**
   * Extracts video extension from URL if present
   */
  static extractVideoExtension(url: string): string | null {
    const videoExtensions = ['mp4', 'mov', 'webm', 'avi', 'm4v', 'mkv'];
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();

    for (const ext of videoExtensions) {
      if (pathname.endsWith(`.${ext}`)) {
        return ext;
      }
    }

    return null;
  }

  /**
   * Generates a download filename from URL and metadata
   */
  static generateDownloadFilename(url: string, title?: string, extension: string = 'mp4'): string {
    const parsed = this.parsePinterestUrl(url);

    // Use title or pin ID as base name
    let baseName = title || parsed.pinId || 'pinterest_video';

    // Clean the filename
    baseName = this.sanitizeFilename(baseName);

    // Add timestamp to avoid conflicts
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');

    return `${baseName}_${timestamp}.${extension}`;
  }

  private static isValidPinterestStructure(parsedUrl: URL): boolean {
    const pathname = parsedUrl.pathname;

    // Check if it matches any of our known patterns
    const allPatterns = [
      ...this.PATTERNS.PIN,
      ...this.PATTERNS.BOARD,
      ...this.PATTERNS.USER
    ];

    return allPatterns.some(pattern => {
      const regex = new RegExp(pattern.source.replace(/^\\^/, '^'));
      return regex.test(pathname);
    });
  }

  private static isReservedPath(segment: string): boolean {
    const reservedPaths = [
      'pin', 'board', 'search', 'ideas', 'login', 'register', 'settings',
      'about', 'business', 'developers', 'help', 'terms', 'privacy',
      'api', 'oauth', 'widgets', 'resources', 'trending', 'today'
    ];

    return reservedPaths.includes(segment.toLowerCase());
  }

  private static normalizeUrl(url: string): string {
    const parsed = new URL(url);

    // Ensure https
    if (parsed.protocol !== 'https:') {
      parsed.protocol = 'https:';
    }

    // Remove www
    if (parsed.hostname.startsWith('www.')) {
      parsed.hostname = parsed.hostname.substring(4);
    }

    // Remove trailing slash
    let pathname = parsed.pathname;
    if (pathname.endsWith('/') && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }

    parsed.pathname = pathname;

    return parsed.toString();
  }

  private static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/__+/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .substring(0, 100); // Limit length
  }
}

// Convenience functions
export const validateUrl = (url: string): void => UrlValidator.validatePinterestUrl(url);
export const parseUrl = (url: string): ParsedPinterestUrl => UrlValidator.parsePinterestUrl(url);
export const isVideoUrl = (url: string): boolean => UrlValidator.isVideoUrl(url);
export const generateFilename = (url: string, title?: string, extension?: string): string =>
  UrlValidator.generateDownloadFilename(url, title, extension);