/**
 * Image Processing Service Interface
 * Defines contract for image processing operations
 */

import { ImageProcessingOptions } from '../valueObjects/ImageProcessingOptions';

export interface ProcessedImage {
  buffer: Buffer;
  format: string;
  width?: number;
  height?: number;
  size: number;
}

export interface ImageProcessingResult {
  original: ProcessedImage;
  webp?: ProcessedImage;
  thumbnail?: ProcessedImage;
  responsiveSizes?: Array<{
    buffer: Buffer;
    width: number;
    height?: number;
    suffix: string;
    size: number;
  }>;
}

export interface ImageProcessingService {
  processImage(
    imageBuffer: Buffer,
    options?: ImageProcessingOptions
  ): Promise<ImageProcessingResult>;

  resizeImage(
    imageBuffer: Buffer,
    width: number,
    height?: number,
    options?: {
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
    }
  ): Promise<ProcessedImage>;

  convertToWebP(
    imageBuffer: Buffer,
    quality?: number
  ): Promise<ProcessedImage>;

  generateThumbnail(
    imageBuffer: Buffer,
    width: number,
    height: number
  ): Promise<ProcessedImage>;
}
