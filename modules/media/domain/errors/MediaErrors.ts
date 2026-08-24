import { AppError } from '../../../../libs/errors';

export class MediaAssetNotFoundError extends AppError {
  constructor(assetId: string) {
    super(`Media asset not found: ${assetId}`, 404, { code: 'media.asset_not_found' });
  }
}

export class MediaFolderNotFoundError extends AppError {
  constructor(folderId: string) {
    super(`Media folder not found: ${folderId}`, 404, { code: 'media.folder_not_found' });
  }
}

export class MediaUploadFailedError extends AppError {
  constructor(reason: string) {
    super(`Media upload failed: ${reason}`, 500, { code: 'media.upload_failed' });
  }
}

export class InvalidMediaTypeError extends AppError {
  constructor(type: string) {
    super(`Invalid media type: ${type}`, 400, { code: 'media.invalid_type' });
  }
}

export class MediaFileTooLargeError extends AppError {
  constructor(maxSize: string) {
    super(`File exceeds maximum size of ${maxSize}`, 400, { code: 'media.file_too_large' });
  }
}

export class DuplicateMediaNameError extends AppError {
  constructor(name: string) {
    super(`Media with name ${name} already exists in this folder`, 409, { code: 'media.duplicate_name' });
  }
}

export class MediaValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'media.validation_error' });
  }
}

export class MediaFileNotFoundError extends AppError {
  constructor(key: string) {
    super(`File not found: ${key}`, 404, { code: 'media.file_not_found' });
  }
}

export class MediaDownloadError extends AppError {
  constructor(reason: string) {
    super(`Media download failed: ${reason}`, 502, { code: 'media.download_failed' });
  }
}

export class InvalidImageUrlError extends AppError {
  constructor(url: string) {
    super(`Invalid image URL: ${url}`, 400, { code: 'media.invalid_url' });
  }
}
