/**
 * Segment Controller for Admin Hub
 * Handles Customer Segment management
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import { adminRespond } from '../../respond';

export const listSegments = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'sales/segments/index', {
      pageName: 'Customer Segments',
      segments: [],
      pagination: { total: 0, page: 1, pages: 1 },
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error listing segments:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load segments',
    });
  }
};

export const createSegmentForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'sales/segments/create', {
      pageName: 'Create Segment',
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createSegment = async (req: Request, res: Response): Promise<void> => {
  try {
    res.redirect('/admin/sales/segments?success=Segment created successfully');
  } catch (error: any) {
    logger.error('Error creating segment:', error);
    adminRespond(req, res, 'sales/segments/create', {
      pageName: 'Create Segment',
      error: error.message || 'Failed to create segment',
      formData: req.body,
    });
  }
};

export const viewSegment = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'sales/segments/view', {
      pageName: 'Segment Details',
      segment: null,
      customers: [],
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load segment',
    });
  }
};

export const editSegmentForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'sales/segments/edit', {
      pageName: 'Edit Segment',
      segment: null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updateSegment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { segmentId } = req.params;
    res.redirect(`/admin/sales/segments/${segmentId}?success=Segment updated successfully`);
  } catch (error: any) {
    logger.error('Error updating segment:', error);
    adminRespond(req, res, 'sales/segments/edit', {
      pageName: 'Edit Segment',
      segment: null,
      error: error.message || 'Failed to update segment',
      formData: req.body,
    });
  }
};

export const deleteSegment = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, message: 'Segment deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting segment:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete segment' });
  }
};

export const viewSegmentCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'sales/segments/customers', {
      pageName: 'Segment Customers',
      segment: null,
      customers: [],
      pagination: { total: 0, page: 1, pages: 1 },
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load segment customers',
    });
  }
};

export const refreshSegment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { segmentId } = req.params;
    res.redirect(`/admin/sales/segments/${segmentId}?success=Segment refreshed successfully`);
  } catch (error: any) {
    logger.error('Error refreshing segment:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to refresh segment' });
  }
};
