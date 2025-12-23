/**
 * Process Image Use Case
 * Handles image upload, processing, and storage
 */

import { Media } from '../../domain/entities/Media';
import { ImageProcessingOptions, ImageProcessingOptionsBuilder } from '../../domain/valueObjects/ImageProcessingOptions';
import { MediaRepository } from '../../domain/repositories/MediaRepository';
import { ImageProcessingService } from '../../domain/services/ImageProcessingService';
import { StorageService } from '../../domain/services/StorageService';

export interface ProcessImageCommand {
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
  options?: ImageProcessingOptions;
  altText?: string;
  title?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ProcessImageResult {
  media: Media;
  urls: {
    original: string;
    webp?: string;
    thumbnail?: string;
    responsive?: Record<string, string>;
  };
}

export class ProcessImageUseCase {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly imageProcessingService: ImageProcessingService,
    private readonly storageService: StorageService,
  ) {}

  async execute(command: ProcessImageCommand): Promise<ProcessImageResult> {
    const { file, options = ImageProcessingOptionsBuilder.productImage() } = command;

    // Generate unique filename
    const mediaId = this.generateMediaId();
    const baseKey = `media/${mediaId}`;

    // Process the image
    const processingResult = await this.imageProcessingService.processImage(file.buffer, options);

    // Upload original image
    const originalKey = `${baseKey}/original.${this.getExtension(file.mimetype)}`;
    const originalUpload = await this.storageService.upload(processingResult.original.buffer, originalKey, file.mimetype, { public: true });

    // Create media entity
    const media = Media.create({
      mediaId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      originalUrl: originalUpload.url,
      altText: command.altText,
      title: command.title,
      description: command.description,
      tags: command.tags,
      metadata: {
        ...command.metadata,
        processingOptions: options,
        originalSize: processingResult.original.size,
      },
    });

    const urls: ProcessImageResult['urls'] = {
      original: originalUpload.url,
      responsive: {},
    };

    // Upload WebP version if generated
    if (processingResult.webp) {
      const webpKey = `${baseKey}/image.webp`;
      const webpUpload = await this.storageService.upload(processingResult.webp.buffer, webpKey, 'image/webp', { public: true });

      media.addProcessedFile({
        url: webpUpload.url,
        format: 'webp',
        width: processingResult.webp.width,
        height: processingResult.webp.height,
        size: processingResult.webp.size,
        quality: options.compression?.quality,
      });

      urls.webp = webpUpload.url;
    }

    // Upload thumbnail if generated
    if (processingResult.thumbnail && options.generateThumbnail) {
      const thumbnailKey = `${baseKey}/thumbnail.webp`;
      const thumbnailUpload = await this.storageService.upload(processingResult.thumbnail.buffer, thumbnailKey, 'image/webp', {
        public: true,
      });

      media.setThumbnail(thumbnailUpload.url);
      urls.thumbnail = thumbnailUpload.url;
    }

    // Upload responsive sizes
    if (processingResult.responsiveSizes && options.responsiveSizes) {
      for (const responsiveSize of processingResult.responsiveSizes) {
        const responsiveOption = options.responsiveSizes.find(opt => opt.width === responsiveSize.width);

        if (responsiveOption) {
          const responsiveKey = `${baseKey}/image${responsiveOption.suffix}.webp`;
          const responsiveUpload = await this.storageService.upload(responsiveSize.buffer, responsiveKey, 'image/webp', { public: true });

          media.addProcessedFile({
            url: responsiveUpload.url,
            format: 'webp',
            width: responsiveSize.width,
            height: responsiveSize.height,
            size: responsiveSize.size,
            quality: options.compression?.quality,
          });

          urls.responsive![responsiveOption.suffix] = responsiveUpload.url;
        }
      }
    }

    // Save media entity
    await this.mediaRepository.save(media);

    return {
      media,
      urls,
    };
  }

  private generateMediaId(): string {
    // Use UUID v7 for better database performance
    return `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/avif': 'avif',
    };
    return extensions[mimeType] || 'bin';
  }
}
