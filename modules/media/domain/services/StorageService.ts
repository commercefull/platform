/**
 * Storage Service Interface
 * Defines contract for file storage operations
 */

export interface UploadResult {
  url: string;
  key: string;
  bucket?: string;
  size: number;
  mimeType: string;
}

export interface StorageService {
  upload(
    buffer: Buffer,
    key: string,
    mimeType: string,
    options?: {
      public?: boolean;
      metadata?: Record<string, string>;
    }
  ): Promise<UploadResult>;

  uploadFile(
    filePath: string,
    key: string,
    options?: {
      public?: boolean;
      metadata?: Record<string, string>;
    }
  ): Promise<UploadResult>;

  download(key: string): Promise<Buffer>;

  delete(key: string): Promise<void>;

  getSignedUrl(key: string, expiresIn?: number): Promise<string>;

  exists(key: string): Promise<boolean>;

  getMetadata(key: string): Promise<Record<string, any>>;
}
