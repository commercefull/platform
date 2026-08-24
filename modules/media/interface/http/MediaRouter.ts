/**
 * Media HTTP Router
 * Defines routes for media operations
 */

import { Router } from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { MediaController } from './MediaController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = Router();
const mediaController = new MediaController();

router.use(isOrganizationLoggedIn);

// Upload single image
router.post('/media/upload', mediaController.uploadSingle, asyncHandler(mediaController.uploadImage));

// Upload multiple images
router.post('/media/upload/batch', mediaController.uploadMultiple, asyncHandler(mediaController.uploadImages));

// Download remote image by URL
router.post('/media/download', asyncHandler(mediaController.downloadImage));

export { router as mediaRouter };
