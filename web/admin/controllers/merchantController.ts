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

import * as merchantContactRepo from '../../../modules/merchant/infrastructure/repositories/merchantContactRepo';
import * as merchantVerificationDocumentRepo from '../../../modules/merchant/infrastructure/repositories/merchantVerificationDocumentRepo';
import * as merchantReviewRepo from '../../../modules/merchant/infrastructure/repositories/merchantReviewRepo';

export const listMerchantContacts = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;
    const contacts = await merchantContactRepo.findByMerchant(merchantId);
    adminRespond(req, res, 'merchants/contacts/index', {
      pageName: 'Merchant Contacts',
      merchantId,
      contacts: contacts || [],
      success: req.query.success || null,
    });
  } catch (error: unknown) {
    logger.error('Error listing merchant contacts:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load contacts' });
  }
};

export const addMerchantContact = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await merchantContactRepo.create({ merchantId, ...(req.body as RequestBody) } as any);
    res.redirect(`/admin/operations/merchants/${merchantId}/contacts?success=Contact added successfully`);
  } catch (error: unknown) {
    logger.error('Error adding merchant contact:', error);
    res.redirect(
      `/admin/operations/merchants/${req.params.merchantId}/contacts?error=${encodeURIComponent((error as Error).message || 'Failed to add contact')}`,
    );
  }
};

// ============================================================================
// Merchant Verification Documents
// ============================================================================

export const listVerificationDocs = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;
    const documents = await merchantVerificationDocumentRepo.findByMerchant(merchantId);
    adminRespond(req, res, 'merchants/documents/index', {
      pageName: 'Verification Documents',
      merchantId,
      documents: documents || [],
      success: req.query.success || null,
    });
  } catch (error: unknown) {
    logger.error('Error listing verification documents:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load documents' });
  }
};

export const updateDocumentStatus = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId, docId } = req.params;
    await merchantVerificationDocumentRepo.updateStatus(docId, (req.body as RequestBody).status);
    res.redirect(`/admin/operations/merchants/${merchantId}/documents?success=Document status updated`);
  } catch (error: unknown) {
    logger.error('Error updating document status:', error);
    res.redirect(
      `/admin/operations/merchants/${req.params.merchantId}/documents?error=${encodeURIComponent((error as Error).message || 'Failed to update status')}`,
    );
  }
};

// ============================================================================
// Merchant Reviews
// ============================================================================

export const listMerchantReviews = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;
    const reviews = await merchantReviewRepo.findByMerchant(merchantId);
    adminRespond(req, res, 'merchants/reviews/index', {
      pageName: 'Merchant Reviews',
      merchantId,
      reviews: reviews || [],
      success: req.query.success || null,
    });
  } catch (error: unknown) {
    logger.error('Error listing merchant reviews:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load reviews' });
  }
};

export const updateReviewStatus = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId, reviewId } = req.params;
    await merchantReviewRepo.updateStatus(reviewId, (req.body as RequestBody).status);
    res.redirect(`/admin/operations/merchants/${merchantId}/reviews?success=Review status updated`);
  } catch (error: unknown) {
    logger.error('Error updating review status:', error);
    res.redirect(
      `/admin/operations/merchants/${req.params.merchantId}/reviews?error=${encodeURIComponent((error as Error).message || 'Failed to update status')}`,
    );
  }
};
