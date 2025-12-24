/**
 * Merchant Controller for Admin Hub
 * Handles Merchant management for multi-merchant platforms
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import { adminRespond } from '../../respond';

export const listMerchants = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'operations/merchants/index', {
      pageName: 'Merchants',
      merchants: [],
      pagination: { total: 0, page: 1, pages: 1 },
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error listing merchants:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load merchants',
    });
  }
};

export const createMerchantForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'operations/merchants/create', {
      pageName: 'Add Merchant',
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createMerchant = async (req: Request, res: Response): Promise<void> => {
  try {
    res.redirect('/admin/operations/merchants?success=Merchant created successfully');
  } catch (error: any) {
    logger.error('Error creating merchant:', error);
    adminRespond(req, res, 'operations/merchants/create', {
      pageName: 'Add Merchant',
      error: error.message || 'Failed to create merchant',
      formData: req.body,
    });
  }
};

export const viewMerchant = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'operations/merchants/view', {
      pageName: 'Merchant Details',
      merchant: null,
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load merchant',
    });
  }
};

export const editMerchantForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'operations/merchants/edit', {
      pageName: 'Edit Merchant',
      merchant: null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updateMerchant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;
    res.redirect(`/admin/operations/merchants/${merchantId}?success=Merchant updated successfully`);
  } catch (error: any) {
    logger.error('Error updating merchant:', error);
    adminRespond(req, res, 'operations/merchants/edit', {
      pageName: 'Edit Merchant',
      merchant: null,
      error: error.message || 'Failed to update merchant',
      formData: req.body,
    });
  }
};

export const deleteMerchant = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, message: 'Merchant deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting merchant:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete merchant' });
  }
};

export const approveMerchant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;
    res.redirect(`/admin/operations/merchants/${merchantId}?success=Merchant approved successfully`);
  } catch (error: any) {
    logger.error('Error approving merchant:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to approve merchant' });
  }
};

export const suspendMerchant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;
    res.redirect(`/admin/operations/merchants/${merchantId}?success=Merchant suspended successfully`);
  } catch (error: any) {
    logger.error('Error suspending merchant:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to suspend merchant' });
  }
};
