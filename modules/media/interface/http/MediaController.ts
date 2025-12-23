/**
 * Media HTTP Controller
 * Handles media upload and processing requests
 */

import { logger } from '../../../../libs/logger';
import { Request, Response } from 'express';
import multer from 'multer';

// Extend Express Request to include multer file properties
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
      files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
    }
  }
}
import { ProcessImageUseCase } from '../../application/useCases/ProcessImage';
import { PostgreSQLMediaRepository } from '../../infrastructure/repositories/mediaRepo';
import { SharpImageProcessingService } from '../../infrastructure/services/SharpImageProcessingService';
import { StorageServiceFactory } from '../../infrastructure/services/StorageServiceFactory';

// Configure multer for memory storage (required for Sharp processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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

  constructor() {
    const mediaRepository = new PostgreSQLMediaRepository();
    const imageProcessingService = new SharpImageProcessingService();
    const storageService = StorageServiceFactory.create();

    this.processImageUseCase = new ProcessImageUseCase(mediaRepository, imageProcessingService, storageService);
  }

  // Middleware for handling single file upload
  uploadSingle = upload.single('image');

  // Middleware for handling multiple file uploads
  uploadMultiple = upload.array('images', 10);

  /**
   * Upload and process a single image
   */
  uploadImage = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided',
        });
      }

      const result = await this.processImageUseCase.execute({
        file: {
          buffer: req.file.buffer,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
        altText: req.body.altText,
        title: req.body.title,
        description: req.body.description,
        tags: req.body.tags ? JSON.parse(req.body.tags) : undefined,
        metadata: req.body.metadata ? JSON.parse(req.body.metadata) : undefined,
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

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to process image',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  };

  /**
   * Upload and process multiple images
   */
  uploadImages = async (req: Request, res: Response) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({
          success: false,
          message: 'No image files provided',
        });
      }

      const results = await Promise.all(
        req.files.map(async (file: Express.Multer.File) => {
          return this.processImageUseCase.execute({
            file: {
              buffer: file.buffer,
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
            },
            altText: req.body.altText,
            title: req.body.title,
            description: req.body.description,
            tags: req.body.tags ? JSON.parse(req.body.tags) : undefined,
            metadata: req.body.metadata ? JSON.parse(req.body.metadata) : undefined,
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

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        message: 'Failed to process images',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      });
    }
  };
}
