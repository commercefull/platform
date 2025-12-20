/**
 * Media HTTP Router
 * Defines routes for media operations
 */

import { Router } from 'express';
import { MediaController } from './MediaController';

const router = Router();
const mediaController = new MediaController();

// Upload single image
router.post('/upload', mediaController.uploadSingle, mediaController.uploadImage);

// Upload multiple images
router.post('/upload/batch', mediaController.uploadMultiple, mediaController.uploadImages);

export { router as mediaRouter };
