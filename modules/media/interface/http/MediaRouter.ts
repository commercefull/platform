/**
 * Media HTTP Router
 * Defines routes for media operations
 */

import { Router } from 'express';
import { MediaController } from './MediaController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = Router();
const mediaController = new MediaController();

router.use(isOrganizationLoggedIn);

// Upload single image
router.post('/media/upload', mediaController.uploadSingle, mediaController.uploadImage);

// Upload multiple images
router.post('/media/upload/batch', mediaController.uploadMultiple, mediaController.uploadImages);

export { router as mediaRouter };
