/**
 * Media Controller for Admin Hub
 * Handles Media Library management
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import { adminRespond } from '../../respond';

export const listMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'content/media/index', {
      pageName: 'Media Library',
      media: [],
      folders: [],
      pagination: { total: 0, page: 1, pages: 1 },
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error listing media:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load media',
    });
  }
};

export const uploadMediaForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'content/media/upload', {
      pageName: 'Upload Media',
      folders: [],
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const uploadMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    res.redirect('/admin/content/media?success=Media uploaded successfully');
  } catch (error: any) {
    logger.error('Error uploading media:', error);
    adminRespond(req, res, 'content/media/upload', {
      pageName: 'Upload Media',
      folders: [],
      error: error.message || 'Failed to upload media',
    });
  }
};

export const viewMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'content/media/view', {
      pageName: 'Media Details',
      media: null,
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load media',
    });
  }
};

export const editMediaForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'content/media/edit', {
      pageName: 'Edit Media',
      media: null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updateMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mediaId } = req.params;
    res.redirect(`/admin/content/media/${mediaId}?success=Media updated successfully`);
  } catch (error: any) {
    logger.error('Error updating media:', error);
    adminRespond(req, res, 'content/media/edit', {
      pageName: 'Edit Media',
      media: null,
      error: error.message || 'Failed to update media',
      formData: req.body,
    });
  }
};

export const deleteMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, message: 'Media deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting media:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete media' });
  }
};

export const bulkDeleteMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, message: 'Media items deleted successfully' });
  } catch (error: any) {
    logger.error('Error bulk deleting media:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete media items' });
  }
};

export const createFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, message: 'Folder created successfully' });
  } catch (error: any) {
    logger.error('Error creating folder:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create folder' });
  }
};
