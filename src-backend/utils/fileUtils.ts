// File system utilities

import fs from 'fs-extra';
import path from 'path';
import { FileInfo } from '../types';
import { FileError, ValidationError } from '../types/errors';
import { MAX_FILE_SIZE, VIDEO_EXTENSIONS } from '../config/constants';

export class FileUtils {
  /**
   * Ensure directory exists
   */
  static async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.ensureDir(dirPath);
    } catch (error) {
      throw new FileError(
        `Failed to create directory: ${dirPath}`,
        dirPath,
        'create'
      );
    }
  }

  /**
   * Check if file exists
   */
  static async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file information
   */
  static async getFileInfo(filePath: string): Promise<FileInfo> {
    try {
      const stats = await fs.stat(filePath);
      const parsedPath = path.parse(filePath);

      return {
        path: filePath,
        name: parsedPath.name,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      throw new FileError(
        `Failed to get file info: ${filePath}`,
        filePath,
        'stat'
      );
    }
  }

  /**
   * Get file size
   */
  static async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      throw new FileError(
        `Failed to get file size: ${filePath}`,
        filePath,
        'stat'
      );
    }
  }

  /**
   * Check if file is within size limit
   */
  static async isFileSizeValid(filePath: string): Promise<boolean> {
    try {
      const size = await this.getFileSize(filePath);
      return size <= MAX_FILE_SIZE;
    } catch {
      return false;
    }
  }

  /**
   * Validate file extension
   */
  static isValidVideoFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    return VIDEO_EXTENSIONS.includes(ext);
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/__+/g, '_') // Replace multiple underscores
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .substring(0, 100); // Limit length
  }

  /**
   * Generate unique filename
   */
  static generateUniqueFilename(
    baseName: string,
    extension: string,
    directory: string
  ): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const sanitizedName = this.sanitizeFilename(baseName);
    let counter = 1;

    let filename = `${sanitizedName}_${timestamp}.${extension}`;

    while (fs.existsSync(path.join(directory, filename))) {
      filename = `${sanitizedName}_${timestamp}_${counter}.${extension}`;
      counter++;
    }

    return filename;
  }

  /**
   * Write file with error handling
   */
  static async writeFile(
    filePath: string,
    data: Buffer | ArrayBuffer | Uint8Array,
    options?: fs.WriteOptions
  ): Promise<void> {
    try {
      // Ensure directory exists
      await this.ensureDir(path.dirname(filePath));

      // Check file size before writing
      const dataSize = Buffer.byteLength(data as Buffer);
      if (dataSize > MAX_FILE_SIZE) {
        throw new ValidationError(
          `File size (${dataSize} bytes) exceeds maximum allowed size (${MAX_FILE_SIZE} bytes)`
        );
      }

      await fs.writeFile(filePath, data, options);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new FileError(
        `Failed to write file: ${filePath}`,
        filePath,
        'write'
      );
    }
  }

  /**
   * Copy file with progress tracking
   */
  static async copyFile(
    sourcePath: string,
    destPath: string,
    onProgress?: (progress: { percent: number; copied: number; total: number }) => void
  ): Promise<void> {
    try {
      // Ensure destination directory exists
      await this.ensureDir(path.dirname(destPath));

      // Get source file size
      const stats = await fs.stat(sourcePath);
      const totalSize = stats.size;

      // Create read and write streams
      const readStream = fs.createReadStream(sourcePath);
      const writeStream = fs.createWriteStream(destPath);

      let copiedBytes = 0;

      readStream.on('data', (chunk) => {
        copiedBytes += chunk.length;
        if (onProgress) {
          onProgress({
            percent: Math.round((copiedBytes / totalSize) * 100),
            copied: copiedBytes,
            total: totalSize
          });
        }
      });

      await new Promise((resolve, reject) => {
        readStream.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        readStream.on('error', reject);
      });

    } catch (error) {
      throw new FileError(
        `Failed to copy file from ${sourcePath} to ${destPath}`,
        destPath,
        'copy'
      );
    }
  }

  /**
   * Delete file with error handling
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.remove(filePath);
    } catch (error) {
      throw new FileError(
        `Failed to delete file: ${filePath}`,
        filePath,
        'delete'
      );
    }
  }

  /**
   * Move file with error handling
   */
  static async moveFile(sourcePath: string, destPath: string): Promise<void> {
    try {
      // Ensure destination directory exists
      await this.ensureDir(path.dirname(destPath));
      await fs.move(sourcePath, destPath);
    } catch (error) {
      throw new FileError(
        `Failed to move file from ${sourcePath} to ${destPath}`,
        destPath,
        'move'
      );
    }
  }

  /**
   * Create temporary file
   */
  static async createTempFile(
    prefix: string = 'tmp',
    extension: string = 'tmp'
  ): Promise<string> {
    const tempDir = path.join(process.cwd(), 'tmp');
    await this.ensureDir(tempDir);

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const filename = `${prefix}_${timestamp}_${random}.${extension}`;
    const filePath = path.join(tempDir, filename);

    return filePath;
  }

  /**
   * Clean up temporary files older than specified age
   */
  static async cleanupTempFiles(maxAge: number = 3600000): Promise<number> { // 1 hour default
    try {
      const tempDir = path.join(process.cwd(), 'tmp');
      if (!(await this.exists(tempDir))) {
        return 0;
      }

      const files = await fs.readdir(tempDir);
      const now = Date.now();
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        try {
          const stats = await fs.stat(filePath);
          const fileAge = now - stats.mtime.getTime();

          if (fileAge > maxAge) {
            await this.deleteFile(filePath);
            cleanedCount++;
          }
        } catch {
          // Skip files that can't be accessed
          continue;
        }
      }

      return cleanedCount;
    } catch (error) {
      throw new FileError(
        'Failed to cleanup temporary files',
        undefined,
        'cleanup'
      );
    }
  }

  /**
   * Get directory size
   */
  static async getDirectorySize(dirPath: string): Promise<number> {
    try {
      let totalSize = 0;
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
          totalSize += await this.getDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }

      return totalSize;
    } catch (error) {
      throw new FileError(
        `Failed to get directory size: ${dirPath}`,
        dirPath,
        'size'
      );
    }
  }

  /**
   * Check available disk space
   */
  static async getAvailableSpace(dirPath: string): Promise<number> {
    try {
      const stats = await fs.statvfs(dirPath);
      return stats.bavail * stats.bsize;
    } catch (error) {
      // Fallback: try to create a test file
      const testFile = await this.createTempFile('space_test');
      try {
        await this.deleteFile(testFile);
        return 1024 * 1024 * 1024; // Assume 1GB available
      } catch {
        return 0; // No space available
      }
    }
  }
}

// Convenience functions
export const ensureDir = (dirPath: string) => FileUtils.ensureDir(dirPath);
export const fileExists = (filePath: string) => FileUtils.exists(filePath);
export const getFileInfo = (filePath: string) => FileUtils.getFileInfo(filePath);
export const getFileSize = (filePath: string) => FileUtils.getFileSize(filePath);
export const sanitizeFilename = (filename: string) => FileUtils.sanitizeFilename(filename);
export const generateUniqueFilename = (baseName: string, extension: string, directory: string) =>
  FileUtils.generateUniqueFilename(baseName, extension, directory);
export const writeFile = (filePath: string, data: Buffer | ArrayBuffer | Uint8Array, options?: fs.WriteOptions) =>
  FileUtils.writeFile(filePath, data, options);
export const deleteFile = (filePath: string) => FileUtils.deleteFile(filePath);
export const createTempFile = (prefix?: string, extension?: string) => FileUtils.createTempFile(prefix, extension);
export const cleanupTempFiles = (maxAge?: number) => FileUtils.cleanupTempFiles(maxAge);