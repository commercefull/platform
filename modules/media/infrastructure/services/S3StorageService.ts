/**
 * AWS S3 Storage Service
 * Implementation using AWS SDK for S3 operations
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageService, UploadResult } from '../../domain/services/StorageService';

export class S3StorageService implements StorageService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(
    bucketName: string,
    region: string = 'us-east-1',
    accessKeyId?: string,
    secretAccessKey?: string
  ) {
    this.bucketName = bucketName;
    this.s3Client = new S3Client({
      region,
      credentials: accessKeyId && secretAccessKey ? {
        accessKeyId,
        secretAccessKey
      } : undefined
    });
  }

  async upload(
    buffer: Buffer,
    key: string,
    mimeType: string,
    options: {
      public?: boolean;
      metadata?: Record<string, string>;
    } = {}
  ): Promise<UploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: options.public ? 'public-read' : undefined,
      Metadata: options.metadata,
      CacheControl: 'max-age=31536000' // 1 year for public files
    });

    await this.s3Client.send(command);

    const url = options.public
      ? `https://${this.bucketName}.s3.amazonaws.com/${key}`
      : await this.getSignedUrl(key);

    return {
      url,
      key,
      bucket: this.bucketName,
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
    const fs = require('fs').promises;
    const buffer = await fs.readFile(filePath);
    const mimeType = this.getMimeType(filePath);

    return this.upload(buffer, key, mimeType, options);
  }

  async download(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    const response = await this.s3Client.send(command);
    if (!response.Body) {
      throw new Error(`File not found: ${key}`);
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const reader = response.Body.transformToByteArray();
    const buffer = await reader;
    return Buffer.from(buffer);
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    await this.s3Client.send(command);
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  async getMetadata(key: string): Promise<Record<string, any>> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    const response = await this.s3Client.send(command);

    return {
      size: response.ContentLength,
      mimeType: response.ContentType,
      lastModified: response.LastModified,
      etag: response.ETag,
      metadata: response.Metadata || {}
    };
  }

  private getMimeType(filePath: string): string {
    const path = require('path');
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
