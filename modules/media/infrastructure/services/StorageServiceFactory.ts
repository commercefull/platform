/**
 * Storage Service Factory
 * Creates appropriate storage service based on environment configuration
 */

import { StorageService } from '../../domain/services/StorageService';
import { LocalStorageService } from './LocalStorageService';
import { S3StorageService } from './S3StorageService';

export class StorageServiceFactory {
  static create(): StorageService {
    const storageType = process.env.STORAGE_TYPE || 'local';
    const isProduction = process.env.NODE_ENV === 'production';

    switch (storageType) {
      case 's3':
        if (!isProduction && !process.env.AWS_S3_BUCKET) {
          console.warn('AWS S3 configuration not found, falling back to local storage');
          return this.createLocalStorage();
        }

        return new S3StorageService(
          process.env.AWS_S3_BUCKET!,
          process.env.AWS_REGION || 'us-east-1',
          process.env.AWS_ACCESS_KEY_ID,
          process.env.AWS_SECRET_ACCESS_KEY
        );

      case 'local':
      default:
        return this.createLocalStorage();
    }
  }

  private static createLocalStorage(): LocalStorageService {
    const baseDir = process.env.STORAGE_LOCAL_DIR || './uploads';
    const baseUrl = process.env.STORAGE_LOCAL_URL || 'http://localhost:3000/uploads';

    return new LocalStorageService(baseDir, baseUrl);
  }
}
