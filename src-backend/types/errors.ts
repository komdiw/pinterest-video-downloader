// Custom error classes for Pinterest Video Downloader

import { ErrorType, AppError } from './index';

export class BaseAppError extends Error {
  public readonly type: ErrorType;
  public readonly code?: string;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(type: ErrorType, message: string, code?: string, details?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.type = type;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): AppError {
    return {
      type: this.type,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

export class NetworkError extends BaseAppError {
  constructor(message: string, code?: string, details?: Record<string, any>) {
    super(ErrorType.NETWORK_ERROR, message, code, details);
  }
}

export class ParseError extends BaseAppError {
  constructor(message: string, code?: string, details?: Record<string, any>) {
    super(ErrorType.PARSE_ERROR, message, code, details);
  }
}

export class ValidationError extends BaseAppError {
  constructor(message: string, field?: string, value?: any) {
    const details = field ? { field, value } : undefined;
    super(ErrorType.VALIDATION_ERROR, message, 'VALIDATION_FAILED', details);
  }
}

export class DownloadError extends BaseAppError {
  constructor(message: string, code?: string, details?: Record<string, any>) {
    super(ErrorType.DOWNLOAD_ERROR, message, code, details);
  }
}

export class FileError extends BaseAppError {
  constructor(message: string, filePath?: string, operation?: string) {
    const details = { filePath, operation };
    super(ErrorType.FILE_ERROR, message, 'FILE_OPERATION_FAILED', details);
  }
}

export class RateLimitError extends BaseAppError {
  constructor(message: string, retryAfter?: number, details?: Record<string, any>) {
    const errorDetails = { retryAfter, ...details };
    super(ErrorType.RATE_LIMIT_ERROR, message, 'RATE_LIMIT_EXCEEDED', errorDetails);
  }
}

export class UnknownError extends BaseAppError {
  constructor(originalError: Error, context?: Record<string, any>) {
    const message = originalError.message || 'Unknown error occurred';
    const details = { originalError: originalError.stack, ...context };
    super(ErrorType.UNKNOWN_ERROR, message, 'UNKNOWN_ERROR', details);
  }
}

// Error factory function
export function createError(error: Error | string, context?: Record<string, any>): BaseAppError {
  if (error instanceof BaseAppError) {
    return error;
  }

  if (error instanceof Error) {
    // Try to categorize the error based on message or name
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('timeout') || message.includes('fetch')) {
      return new NetworkError(error.message, 'NETWORK_ERROR', { ...context, originalError: error.stack });
    }

    if (message.includes('parse') || message.includes('json') || message.includes('syntax')) {
      return new ParseError(error.message, 'PARSE_ERROR', { ...context, originalError: error.stack });
    }

    if (message.includes('file') || message.includes('directory') || message.includes('permission')) {
      return new FileError(error.message, context?.filePath, context?.operation);
    }

    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return new ValidationError(error.message, context?.field, context?.value);
    }

    return new UnknownError(error, context);
  }

  // String error
  return new UnknownError(new Error(error), context);
}

// Error handler utilities
export function isAppError(error: any): error is BaseAppError {
  return error instanceof BaseAppError;
}

export function getErrorType(error: any): ErrorType {
  if (isAppError(error)) {
    return error.type;
  }

  const message = error?.message?.toLowerCase() || '';

  if (message.includes('network') || message.includes('timeout')) return ErrorType.NETWORK_ERROR;
  if (message.includes('parse') || message.includes('json')) return ErrorType.PARSE_ERROR;
  if (message.includes('validation') || message.includes('invalid')) return ErrorType.VALIDATION_ERROR;
  if (message.includes('download') || message.includes('fetch')) return ErrorType.DOWNLOAD_ERROR;
  if (message.includes('file') || message.includes('directory')) return ErrorType.FILE_ERROR;
  if (message.includes('rate') || message.includes('limit')) return ErrorType.RATE_LIMIT_ERROR;

  return ErrorType.UNKNOWN_ERROR;
}

export function sanitizeErrorForLogging(error: BaseAppError): Omit<AppError, 'details'> {
  return {
    type: error.type,
    message: error.message,
    code: error.code,
    timestamp: error.timestamp
  };
}