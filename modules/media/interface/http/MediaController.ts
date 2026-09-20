/**
 * Media HTTP Controller
 * Handles media upload and processing requests
 */

import { logger } from '../../../../libs/logger';
import type { HttpRequest, HttpResponse } from 'libs/http';
import multer from 'multer';
import { ProcessImageUseCase } from '../../application/useCases/ProcessImage';
import { DownloadImageUseCase } from '../../application/useCases/DownloadImage';
import { PostgreSQLMediaRepository, SharpImageProcessingService, StorageServiceFactory } from '../../application/wired';

interface MediaUploadBody {
  altText?: string;
  title?: string;
  description?: string;
  tags?: string;
  metadata?: string;
}

interface MediaDownloadBody {
  url: string;
  altText?: string;
  title?: string;
  description?: string;
  tags?: string;
  metadata?: string;
}

// Configure multer for memory storage (required for Sharp processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: HttpRequest, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export class MediaController {
  private processImageUseCase: ProcessImageUseCase;
  private downloadImageUseCase: DownloadImageUseCase;

  constructor() {
    const mediaRepository = new PostgreSQLMediaRepository();
    const imageProcessingService = new SharpImageProcessingService();
    const storageService = StorageServiceFactory.create();

    this.processImageUseCase = new ProcessImageUseCase(mediaRepository, imageProcessingService, storageService);
    this.downloadImageUseCase = new DownloadImageUseCase(this.processImageUseCase);
  }

  // Middleware for handling single file upload
  uploadSingle = upload.single('image');

  // Middleware for handling multiple file uploads
  uploadMultiple = upload.array('images', 10);

  /**
   * Upload and process a single image
   */
  uploadImage = async (req: HttpRequest<Record<string, string>, unknown, MediaUploadBody>, res: HttpResponse) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided',
        });
      }

      const body = req.body;
      const result = await this.processImageUseCase.execute({
        file: {
          buffer: req.file.buffer,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
        altText: body.altText,
        title: body.title,
        description: body.description,
        tags: body.tags ? JSON.parse(body.tags) : undefined,
        metadata: body.metadata ? JSON.parse(body.metadata) : undefined,
      });

      res.json({
        success: true,
        data: {
          media: result.media.toJSON(),
          urls: result.urls,
        },
      });
    } catch (error) {
      logger.error('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
      // Map client-side errors to 400
      const isClientError =
        errorMessage.includes('invalid') ||
        errorMessage.includes('Invalid') ||
        errorMessage.includes('Unexpected end') ||
        errorMessage.includes('unsupported') ||
        errorMessage.includes('Unsupported') ||
        errorMessage.includes('JSON') ||
        (error as { code?: string }).code === 'LIMIT_FILE_SIZE' ||
        (error as { code?: string }).code === 'LIMIT_UNEXPECTED_FILE';
      const status = isClientError ? 400 : 500;
      res.status(status).json({
        success: false,
        message: status === 400 ? errorMessage : 'Failed to process image',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  };

  /**
   * Upload and process multiple images
   */
  uploadImages = async (req: HttpRequest<Record<string, string>, unknown, MediaUploadBody>, res: HttpResponse) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({
          success: false,
          message: 'No image files provided',
        });
      }

      const body = req.body;
      const results = await Promise.all(
        req.files.map(async (file: Express.Multer.File) => {
          return this.processImageUseCase.execute({
            file: {
              buffer: file.buffer,
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
            },
            altText: body.altText,
            title: body.title,
            description: body.description,
            tags: body.tags ? JSON.parse(body.tags) : undefined,
            metadata: body.metadata ? JSON.parse(body.metadata) : undefined,
          });
        }),
      );

      res.json({
        success: true,
        data: results.map(result => ({
          media: result.media.toJSON(),
          urls: result.urls,
        })),
      });
    } catch (error) {
      logger.error('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to process images',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  };

  /**
   * Download a remote image by URL, process it, and store it
   */
  downloadImage = async (req: HttpRequest<Record<string, string>, unknown, MediaDownloadBody>, res: HttpResponse) => {
    try {
      const body = req.body;

      if (!body.url) {
        return res.status(400).json({
          success: false,
          message: 'No URL provided',
        });
      }

      const result = await this.downloadImageUseCase.execute({
        url: body.url,
        altText: body.altText,
        title: body.title,
        description: body.description,
        tags: body.tags ? JSON.parse(body.tags) : undefined,
        metadata: body.metadata ? JSON.parse(body.metadata) : undefined,
      });

      res.json({
        success: true,
        data: {
          media: result.media.toJSON(),
          urls: result.urls,
        },
      });
    } catch (error) {
      logger.error('Error:', error);

      const statusCode = (error as { statusCode?: number }).statusCode || 500;
      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
      res.status(statusCode).json({
        success: false,
        message: 'Failed to download image',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  };
}
