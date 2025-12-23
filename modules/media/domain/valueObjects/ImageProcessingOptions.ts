/**
 * Image Processing Options Value Object
 * Defines options for image processing operations
 */

export interface ResizeOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  withoutEnlargement?: boolean;
}

export interface CompressionOptions {
  quality?: number; // 1-100
  progressive?: boolean;
  effort?: number; // 0-6 for WebP, 0-9 for others
}

export interface ImageProcessingOptions {
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  resize?: ResizeOptions;
  compression?: CompressionOptions;
  generateThumbnail?: boolean;
  thumbnailSize?: {
    width: number;
    height: number;
  };
  responsiveSizes?: Array<{
    width: number;
    height?: number;
    suffix: string;
  }>;
}

export class ImageProcessingOptionsBuilder {
  private options: ImageProcessingOptions;

  private constructor(options: ImageProcessingOptions) {
    this.options = options;
  }

  static create(options: Partial<ImageProcessingOptions> = {}): ImageProcessingOptionsBuilder {
    const defaults: ImageProcessingOptions = {
      format: 'webp',
      compression: {
        quality: 80,
        progressive: true,
      },
      generateThumbnail: true,
      thumbnailSize: {
        width: 300,
        height: 300,
      },
      responsiveSizes: [
        { width: 320, suffix: '_sm' },
        { width: 640, suffix: '_md' },
        { width: 1024, suffix: '_lg' },
        { width: 1920, suffix: '_xl' },
      ],
    };

    return new ImageProcessingOptionsBuilder({
      ...defaults,
      ...options,
      resize: options.resize ? { ...defaults.resize, ...options.resize } : defaults.resize,
      compression: options.compression ? { ...defaults.compression, ...options.compression } : defaults.compression,
      thumbnailSize: options.thumbnailSize || defaults.thumbnailSize,
      responsiveSizes: options.responsiveSizes || defaults.responsiveSizes,
    });
  }

  build(): ImageProcessingOptions {
    return this.options;
  }

  // Convenience methods for common presets
  static productImage(): ImageProcessingOptions {
    return ImageProcessingOptionsBuilder.create({
      format: 'webp',
      compression: {
        quality: 85,
        progressive: true,
        effort: 4,
      },
      generateThumbnail: true,
      thumbnailSize: { width: 300, height: 300 },
      responsiveSizes: [
        { width: 320, suffix: '_sm' },
        { width: 640, suffix: '_md' },
        { width: 1024, suffix: '_lg' },
        { width: 1600, suffix: '_xl' },
      ],
    }).build();
  }

  static profileImage(): ImageProcessingOptions {
    return ImageProcessingOptionsBuilder.create({
      format: 'webp',
      compression: {
        quality: 90,
        progressive: true,
      },
      generateThumbnail: true,
      thumbnailSize: { width: 150, height: 150 },
      responsiveSizes: [
        { width: 150, suffix: '_sm' },
        { width: 300, suffix: '_md' },
        { width: 600, suffix: '_lg' },
      ],
    }).build();
  }

  static bannerImage(): ImageProcessingOptions {
    return ImageProcessingOptionsBuilder.create({
      format: 'webp',
      compression: {
        quality: 85,
        progressive: true,
      },
      resize: {
        width: 1920,
        height: 600,
        fit: 'cover',
      },
      generateThumbnail: false,
      responsiveSizes: [
        { width: 800, height: 250, suffix: '_sm' },
        { width: 1200, height: 375, suffix: '_md' },
        { width: 1920, height: 600, suffix: '_lg' },
      ],
    }).build();
  }
}
