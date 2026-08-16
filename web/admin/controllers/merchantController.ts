/**
 * Merchant Controller for Admin Hub
 * Handles Merchant management for multi-merchant platforms
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { adminRespond } from '../../respond';

export const listMerchants = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'operations/merchants/index', {
      pageName: 'Merchants',
      merchants: [],
      pagination: { total: 0, page: 1, pages: 1 },
      success: req.query.success || null,
    });
  } catch (error: unknown) {
    logger.error('Error listing merchants:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load merchants',
    });
  }
};

export const createMerchantForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'operations/merchants/create', {
      pageName: 'Add Merchant',
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load form',
    });
  }
};

export const createMerchant = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    res.redirect('/admin/operations/merchants?success=Merchant created successfully');
  } catch (error: unknown) {
    logger.error('Error creating merchant:', error);
    adminRespond(req, res, 'operations/merchants/create', {
      pageName: 'Add Merchant',
      error: (error as Error).message || 'Failed to create merchant',
      formData: req.body as RequestBody,
    });
  }
};

export const viewMerchant = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'operations/merchants/view', {
      pageName: 'Merchant Details',
      merchant: null,
      success: req.query.success || null,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load merchant',
    });
  }
};

export const editMerchantForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'operations/merchants/edit', {
      pageName: 'Edit Merchant',
      merchant: null,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load form',
    });
  }
};

export const updateMerchant = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;
    res.redirect(`/admin/operations/merchants/${merchantId}?success=Merchant updated successfully`);
  } catch (error: unknown) {
    logger.error('Error updating merchant:', error);
    adminRespond(req, res, 'operations/merchants/edit', {
      pageName: 'Edit Merchant',
      merchant: null,
      error: (error as Error).message || 'Failed to update merchant',
      formData: req.body as RequestBody,
    });
  }
};

export const deleteMerchant = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    res.json({ success: true, message: 'Merchant deleted successfully' });
  } catch (error: unknown) {
    logger.error('Error deleting merchant:', error);
    res.status(500).json({ success: false, message: (error as Error).message || 'Failed to delete merchant' });
  }
};

export const approveMerchant = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;
    res.redirect(`/admin/operations/merchants/${merchantId}?success=Merchant approved successfully`);
  } catch (error: unknown) {
    logger.error('Error approving merchant:', error);
    res.status(500).json({ success: false, message: (error as Error).message || 'Failed to approve merchant' });
  }
};

export const suspendMerchant = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;
    res.redirect(`/admin/operations/merchants/${merchantId}?success=Merchant suspended successfully`);
  } catch (error: unknown) {
    logger.error('Error suspending merchant:', error);
    res.status(500).json({ success: false, message: (error as Error).message || 'Failed to suspend merchant' });
  }
};

// ============================================================================
// Merchant Contacts
// ============================================================================

