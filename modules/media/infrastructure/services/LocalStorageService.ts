/**
 * Local File System Storage Service
 * For development and testing - stores files locally
 */

import { promises as fs } from 'fs';
import path from 'path';
import { StorageService, UploadResult } from '../../domain/services/StorageService';

export class LocalStorageService implements StorageService {
  constructor(
    private readonly baseDir: string = './uploads',
    private readonly baseUrl: string = 'http://localhost:3000/uploads'
  ) {}

  async upload(
    buffer: Buffer,
    key: string,
    mimeType: string,
    options: {
      public?: boolean;
      metadata?: Record<string, string>;
    } = {}
  ): Promise<UploadResult> {
    const filePath = path.join(this.baseDir, key);
    const dir = path.dirname(filePath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, buffer);

    const url = `${this.baseUrl}/${key}`;

    return {
      url,
      key,
      size: buffer.length,
      mimeType
    };
  }

  async uploadFile(
    filePath: string,
    key: string,
    options: {
      public?: boolean;
      metadata?: Record<string, string>;
    } = {}
  ): Promise<UploadResult> {
    const buffer = await fs.readFile(filePath);
    return this.upload(buffer, key, this.getMimeType(filePath), options);
  }

  async download(key: string): Promise<Buffer> {
    const filePath = path.join(this.baseDir, key);
    return fs.readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.baseDir, key);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // For local storage, just return the regular URL
    return `${this.baseUrl}/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    const filePath = path.join(this.baseDir, key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(key: string): Promise<Record<string, any>> {
    const filePath = path.join(this.baseDir, key);
    const stats = await fs.stat(filePath);

    return {
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      isFile: stats.isFile(),
      mimeType: this.getMimeType(key)
    };
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.avif': 'image/avif',
      '.svg': 'image/svg+xml'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}
