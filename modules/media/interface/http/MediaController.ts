import { jsonResponse } from 'libs/apiResponse';
/**
 * Media HTTP Controller
 * Handles media upload and processing requests
 */

import { AppError, logCaughtError } from '../../../../libs/errors';
import type { HttpRequest, HttpResponse } from 'libs/http';
import multer from 'multer';
import { processImageUseCase, downloadImageUseCase } from '../../application/wired';

interface MediaUploadBody {
  altText?: string;
  title?: string;
  description?: string;
  tags?: string;
  metadata?: string;
}

const CLIENT_ERROR_CODES = new Set(['LIMIT_FILE_SIZE', 'LIMIT_UNEXPECTED_FILE']);

/** True when the failure was caused by the uploaded payload rather than the server. */
function isClientUploadError(error: unknown): boolean {
  // Domain/AppError subclasses declare their own statusCode — 4xx means client error
  if (error instanceof AppError) return error.isExpected;
  // Malformed JSON in multipart fields (tags/metadata)
  if (error instanceof SyntaxError) return true;
  // Multer upload-limit failures carry a stable code
  return CLIENT_ERROR_CODES.has((error as { code?: string }).code ?? '');
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
  private processImageUseCase = processImageUseCase;
  private downloadImageUseCase = downloadImageUseCase;

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
        return jsonResponse(res, 400, {
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

      jsonResponse(res, 200, {
        success: true,
        data: {
          media: result.media.toJSON(),
          urls: result.urls,
        },
      });
    } catch (error) {
      logCaughtError('Error:', error);

      const errorMessage = error instanceof Error ? (error as Error).message : 'Unknown error';
      const status = isClientUploadError(error) ? 400 : 500;
      jsonResponse(res, status, {
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
    if (!req.files || !Array.isArray(req.files)) {
      return jsonResponse(res, 400, {
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

    jsonResponse(res, 200, {
      success: true,
      data: results.map(result => ({
        media: result.media.toJSON(),
        urls: result.urls,
      })),
    });
  };

  /**
   * Download a remote image by URL, process it, and store it
   */
  downloadImage = async (req: HttpRequest<Record<string, string>, unknown, MediaDownloadBody>, res: HttpResponse) => {
    const body = req.body;

    if (!body.url) {
      return jsonResponse(res, 400, {
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

    jsonResponse(res, 200, {
      success: true,
      data: {
        media: result.media.toJSON(),
        urls: result.urls,
      },
    });
  };
}
