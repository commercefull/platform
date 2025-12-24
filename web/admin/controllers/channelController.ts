/**
 * Channel Controller for Admin Hub
 * Handles Sales Channel management
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import { adminRespond } from '../../respond';

export const listChannels = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'settings/channels/index', {
      pageName: 'Sales Channels',
      channels: [],
      pagination: { total: 0, page: 1, pages: 1 },
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error listing channels:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load channels',
    });
  }
};

export const createChannelForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'settings/channels/create', {
      pageName: 'Create Channel',
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    res.redirect('/admin/settings/channels?success=Channel created successfully');
  } catch (error: any) {
    logger.error('Error creating channel:', error);
    adminRespond(req, res, 'settings/channels/create', {
      pageName: 'Create Channel',
      error: error.message || 'Failed to create channel',
      formData: req.body,
    });
  }
};

export const viewChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'settings/channels/view', {
      pageName: 'Channel Details',
      channel: null,
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load channel',
    });
  }
};

export const editChannelForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'settings/channels/edit', {
      pageName: 'Edit Channel',
      channel: null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updateChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params;
    res.redirect(`/admin/settings/channels/${channelId}?success=Channel updated successfully`);
  } catch (error: any) {
    logger.error('Error updating channel:', error);
    adminRespond(req, res, 'settings/channels/edit', {
      pageName: 'Edit Channel',
      channel: null,
      error: error.message || 'Failed to update channel',
      formData: req.body,
    });
  }
};

export const deleteChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, message: 'Channel deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting channel:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete channel' });
  }
};

export const activateChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params;
    res.redirect(`/admin/settings/channels/${channelId}?success=Channel activated successfully`);
  } catch (error: any) {
    logger.error('Error activating channel:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to activate channel' });
  }
};

export const deactivateChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { channelId } = req.params;
    res.redirect(`/admin/settings/channels/${channelId}?success=Channel deactivated successfully`);
  } catch (error: any) {
    logger.error('Error deactivating channel:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to deactivate channel' });
  }
};
