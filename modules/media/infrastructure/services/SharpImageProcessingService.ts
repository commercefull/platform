/**
 * Sharp Image Processing Service
 * Implementation using Sharp library for image processing
 */

import sharp from 'sharp';
import {
  ImageProcessingService,
  ProcessedImage,
  ImageProcessingResult
} from '../../domain/services/ImageProcessingService';
import { ImageProcessingOptions, ImageProcessingOptionsBuilder } from '../../domain/valueObjects/ImageProcessingOptions';

export class SharpImageProcessingService implements ImageProcessingService {
  async processImage(
    imageBuffer: Buffer,
    options: ImageProcessingOptions = ImageProcessingOptionsBuilder.productImage()
  ): Promise<ImageProcessingResult> {
    const result: ImageProcessingResult = {
      original: await this.resizeImage(imageBuffer, undefined, undefined, {
        quality: 90,
        format: 'jpeg'
      })
    };

    // Generate WebP version
    if (options.format === 'webp') {
      result.webp = await this.convertToWebP(imageBuffer, options.compression?.quality);
    }

    // Generate thumbnail
    if (options.generateThumbnail && options.thumbnailSize) {
      result.thumbnail = await this.generateThumbnail(
        imageBuffer,
        options.thumbnailSize.width,
        options.thumbnailSize.height
      );
    }

    // Generate responsive sizes
    if (options.responsiveSizes && options.responsiveSizes.length > 0) {
      result.responsiveSizes = await Promise.all(
        options.responsiveSizes.map(async (size) => {
          const resized = await this.resizeImage(imageBuffer, size.width, size.height, {
            fit: options.resize?.fit || 'cover',
            quality: options.compression?.quality,
            format: options.format || 'webp'
          });

          return {
            buffer: resized.buffer,
            width: size.width,
            height: size.height,
            suffix: size.suffix,
            size: resized.size
          };
        })
      );
    }

    return result;
  }

  async resizeImage(
    imageBuffer: Buffer,
    width: number | undefined,
    height?: number,
    options: {
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png' | 'avif';
    } = {}
  ): Promise<ProcessedImage> {
    const {
      fit = 'cover',
      quality = 80,
      format = 'webp'
    } = options;

    let sharpInstance = sharp(imageBuffer);

    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit,
        withoutEnlargement: true
      });
    }

    // Apply format-specific options
    switch (format) {
      case 'webp':
        sharpInstance = sharpInstance.webp({
          quality,
          effort: 4
        });
        break;
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({
          quality,
          progressive: true
        });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({
          quality,
          compressionLevel: 6
        });
        break;
      case 'avif':
        sharpInstance = sharpInstance.avif({
          quality,
          effort: 4
        });
        break;
    }

    const buffer = await sharpInstance.toBuffer();
    const metadata = await sharpInstance.metadata();

    return {
      buffer,
      format,
      width: metadata.width,
      height: metadata.height,
      size: buffer.length
    };
  }

  async convertToWebP(
    imageBuffer: Buffer,
    quality: number = 80
  ): Promise<ProcessedImage> {
    const buffer = await sharp(imageBuffer)
      .webp({
        quality,
        effort: 4
      })
      .toBuffer();

    const metadata = await sharp(imageBuffer).metadata();

    return {
      buffer,
      format: 'webp',
      width: metadata.width,
      height: metadata.height,
      size: buffer.length
    };
  }

  async generateThumbnail(
    imageBuffer: Buffer,
    width: number,
    height: number
  ): Promise<ProcessedImage> {
    const buffer = await sharp(imageBuffer)
      .resize(width, height, {
        fit: 'cover',
        withoutEnlargement: true
      })
      .webp({
        quality: 80,
        effort: 4
      })
      .toBuffer();

    return {
      buffer,
      format: 'webp',
      width,
      height,
      size: buffer.length
    };
  }
}
