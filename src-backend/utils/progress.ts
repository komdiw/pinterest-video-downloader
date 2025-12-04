// Progress tracking utilities

import { ProgressInfo, CliProgressOptions } from '../types';

export interface ProgressCallback {
  (progress: ProgressInfo): void;
}

export class ProgressTracker {
  private callbacks: ProgressCallback[] = [];
  private startTime: Date = new Date();
  private lastUpdate: Date = new Date();
  private currentTransferred: number = 0;
  private total: number = 0;
  private lastTransferred: number = 0;
  private speeds: number[] = [];
  private maxSpeedSamples: number = 10;

  constructor(total: number = 0) {
    this.total = total;
  }

  /**
   * Add a progress callback
   */
  addCallback(callback: ProgressCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Remove a progress callback
   */
  removeCallback(callback: ProgressCallback): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  /**
   * Update progress with new transfer data
   */
  update(transferred: number, total?: number): void {
    if (total !== undefined) {
      this.total = total;
    }

    this.currentTransferred = transferred;
    const now = new Date();

    // Calculate speed
    const timeDiff = (now.getTime() - this.lastUpdate.getTime()) / 1000; // seconds
    const transferredDiff = transferred - this.lastTransferred;

    if (timeDiff > 0) {
      const speed = transferredDiff / timeDiff;
      this.speeds.push(speed);

      // Keep only recent speed samples
      if (this.speeds.length > this.maxSpeedSamples) {
        this.speeds.shift();
      }
    }

    this.lastUpdate = now;
    this.lastTransferred = transferred;

    // Calculate progress info
    const progressInfo = this.calculateProgressInfo();

    // Notify callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(progressInfo);
      } catch (error) {
        console.error('Progress callback error:', error);
      }
    });
  }

  /**
   * Get current progress information
   */
  getCurrentProgress(): ProgressInfo {
    return this.calculateProgressInfo();
  }

  /**
   * Reset the progress tracker
   */
  reset(total?: number): void {
    this.startTime = new Date();
    this.lastUpdate = new Date();
    this.currentTransferred = 0;
    this.lastTransferred = 0;
    this.speeds = [];
    if (total !== undefined) {
      this.total = total;
    }
  }

  /**
   * Mark progress as complete
   */
  complete(): void {
    this.update(this.total);
  }

  private calculateProgressInfo(): ProgressInfo {
    const percent = this.total > 0 ? Math.min(100, Math.round((this.currentTransferred / this.total) * 100)) : 0;

    // Calculate average speed
    const avgSpeed = this.speeds.length > 0
      ? this.speeds.reduce((sum, speed) => sum + speed, 0) / this.speeds.length
      : 0;

    // Calculate ETA
    const eta = avgSpeed > 0 && this.currentTransferred < this.total
      ? Math.round((this.total - this.currentTransferred) / avgSpeed)
      : 0;

    return {
      percent,
      transferred: this.currentTransferred,
      total: this.total,
      speed: avgSpeed,
      eta
    };
  }
}

// CLI Progress Bar
export class CliProgressBar {
  private tracker: ProgressTracker;
  private options: CliProgressOptions;
  private lastOutput: string = '';

  constructor(total: number = 0, options: CliProgressOptions = {}) {
    this.options = {
      format: ':percent [:bar] :transferred/:total :speed eta: :eta',
      width: 40,
      complete: '=',
      incomplete: ' ',
      ...options
    };

    this.tracker = new ProgressTracker(total);
    this.tracker.addCallback(this.render.bind(this));
  }

  /**
   * Update the progress bar
   */
  update(transferred: number, total?: number): void {
    this.tracker.update(transferred, total);
  }

  /**
   * Complete the progress bar
   */
  complete(): void {
    this.tracker.complete();
    console.log(); // New line after completion
  }

  /**
   * Reset the progress bar
   */
  reset(total?: number): void {
    this.tracker.reset(total);
    this.lastOutput = '';
  }

  private render(progress: ProgressInfo): void {
    const output = this.formatProgress(progress);

    // Clear previous line and render new one
    if (output !== this.lastOutput) {
      process.stdout.write('\r' + ' '.repeat(this.lastOutput.length) + '\r' + output);
      this.lastOutput = output;
    }
  }

  private formatProgress(progress: ProgressInfo): string {
    const { format, width, complete, incomplete } = this.options;

    const percent = progress.percent.toString().padStart(3, ' ');
    const transferred = this.formatBytes(progress.transferred);
    const total = this.formatBytes(progress.total);
    const speed = progress.speed ? `${this.formatBytes(progress.speed)}/s` : 'N/A';
    const eta = progress.eta ? this.formatTime(progress.eta) : 'N/A';

    // Create bar
    const completeLength = Math.round((progress.percent / 100) * width);
    const bar = complete.repeat(completeLength) + incomplete.repeat(width - completeLength);

    let output = format
      .replace(':percent', `${percent}%`)
      .replace(':bar', bar)
      .replace(':transferred', transferred)
      .replace(':total', total)
      .replace(':speed', speed)
      .replace(':eta', eta);

    return output;
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  private formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)}m`;
    } else {
      return `${Math.round(seconds / 3600)}h`;
    }
  }
}

// Factory functions
export function createProgressTracker(total?: number): ProgressTracker {
  return new ProgressTracker(total);
}

export function createCliProgressBar(total?: number, options?: CliProgressOptions): CliProgressBar {
  return new CliProgressBar(total, options);
}

// Progress utilities
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export function calculateTransferRate(transferred: number, startTime: Date): number {
  const now = new Date();
  const durationMs = now.getTime() - startTime.getTime();
  const durationSec = durationMs / 1000;

  return durationSec > 0 ? transferred / durationSec : 0;
}