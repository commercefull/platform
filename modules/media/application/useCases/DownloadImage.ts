/**
 * Download Image Use Case
 * Fetches a remote image by URL, then delegates to ProcessImageUseCase
 * for processing (Sharp, WebP, thumbnails, responsive sizes) and storage.
 */

import { ProcessImageUseCase, ProcessImageResult } from './ProcessImage';
import { ImageProcessingOptions } from '../../domain/valueObjects/ImageProcessingOptions';
import { MediaDownloadError, InvalidImageUrlError } from '../../domain/errors/MediaErrors';
import { logger } from '../../../../libs/logger';

export interface DownloadImageCommand {
  url: string;
  options?: ImageProcessingOptions;
  altText?: string;
  title?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

const MAX_DOWNLOAD_SIZE = 10 * 1024 * 1024; // 10 MB

export class DownloadImageUseCase {
  constructor(private readonly processImageUseCase: ProcessImageUseCase) {}

  async execute(command: DownloadImageCommand): Promise<ProcessImageResult> {
    const { url } = command;

    if (!url || !this.isValidUrl(url)) {
      throw new InvalidImageUrlError(url || 'empty');
    }

    const { buffer, mimetype, originalname, size } = await this.fetchImage(url);

    if (!ALLOWED_MIME_TYPES.has(mimetype)) {
      throw new InvalidImageUrlError(`Unsupported content type: ${mimetype}`);
    }

    if (size > MAX_DOWNLOAD_SIZE) {
      throw new MediaDownloadError(`Image exceeds maximum download size of ${MAX_DOWNLOAD_SIZE} bytes`);
    }

    return this.processImageUseCase.execute({
      file: { buffer, originalname, mimetype, size },
      options: command.options,
      altText: command.altText,
      title: command.title,
      description: command.description,
      tags: command.tags,
      metadata: {
        ...command.metadata,
        sourceUrl: url,
        downloadedAt: new Date().toISOString(),
      },
    });
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private async fetchImage(url: string): Promise<{
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    size: number;
  }> {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: { 'User-Agent': 'CommerceFull-MediaPipeline/1.0' },
      });

      if (!response.ok) {
        throw new MediaDownloadError(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const size = contentLength ? parseInt(contentLength, 10) : 0;

      if (size > MAX_DOWNLOAD_SIZE) {
        throw new MediaDownloadError(`Image exceeds maximum download size of ${MAX_DOWNLOAD_SIZE} bytes`);
      }

      const mimetype = response.headers.get('content-type')?.split(';')[0].trim() || 'application/octet-stream';

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const originalname = this.extractFilename(url);

      return { buffer, mimetype, originalname, size: buffer.length };
    } catch (error) {
      if (error instanceof MediaDownloadError || error instanceof InvalidImageUrlError) {
        throw error;
      }
      logger.warn(`DownloadImageUseCase fetch error: ${(error as Error).message}`);
      throw new MediaDownloadError(`Failed to download image: ${(error as Error).message}`);
    }
  }

  private extractFilename(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      const basename = pathname.split('/').pop() || '';
      return basename || `downloaded_${Date.now()}`;
    } catch {
      return `downloaded_${Date.now()}`;
    }
  }
}
