/**
 * Media Controller for Admin Hub
 * Handles Media Library management
 */

import { logger } from '../../../../libs/logger';
import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { adminRespond } from '../../../../libs/adminRespond';

export const listMedia = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'content/media/index', {
    pageName: 'Media Library',
    media: [],
    folders: [],
    pagination: { total: 0, page: 1, pages: 1 },
    success: req.query.success || null,
  });
};

export const uploadMediaForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'content/media/upload', {
    pageName: 'Upload Media',
    folders: [],
  });
};

export const uploadMedia = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    res.redirect('/admin/content/media?success=Media uploaded successfully');
  } catch (error: unknown) {
    logger.warn('Error uploading media:', error);
    adminRespond(req, res, 'content/media/upload', {
      pageName: 'Upload Media',
      folders: [],
      error: (error as Error).message || 'Failed to upload media',
    });
  }
};

export const viewMedia = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'content/media/view', {
    pageName: 'Media Details',
    media: null,
    success: req.query.success || null,
  });
};

export const editMediaForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'content/media/edit', {
    pageName: 'Edit Media',
    media: null,
  });
};

export const updateMedia = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { mediaId } = req.params;
    res.redirect(`/admin/content/media/${mediaId}?success=Media updated successfully`);
  } catch (error: unknown) {
    logger.warn('Error updating media:', error);
    adminRespond(req, res, 'content/media/edit', {
      pageName: 'Edit Media',
      media: null,
      error: (error as Error).message || 'Failed to update media',
      formData: req.body as HttpRequestBody,
    });
  }
};

export const deleteMedia = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  res.json({ success: true, message: 'Media deleted successfully' });
};

export const bulkDeleteMedia = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  res.json({ success: true, message: 'Media items deleted successfully' });
};

export const createFolder = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  res.json({ success: true, message: 'Folder created successfully' });
};
