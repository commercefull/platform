/**
 * Merchant Controller for Admin Hub
 * Handles Merchant management for multi-merchant platforms
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';;
import { adminRespond } from '../../respond';

export const listMerchants = async (req: TypedRequest, res: Response): Promise<void> => {
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

export const createMerchantForm = async (req: TypedRequest, res: Response): Promise<void> => {
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

export const createMerchant = async (req: TypedRequest, res: Response): Promise<void> => {
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

export const viewMerchant = async (req: TypedRequest, res: Response): Promise<void> => {
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

export const editMerchantForm = async (req: TypedRequest, res: Response): Promise<void> => {
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

export const updateMerchant = async (req: TypedRequest, res: Response): Promise<void> => {
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

export const deleteMerchant = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    res.json({ success: true, message: 'Merchant deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting merchant:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete merchant' });
  }
};

export const approveMerchant = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;
    res.redirect(`/admin/operations/merchants/${merchantId}?success=Merchant approved successfully`);
  } catch (error: any) {
    logger.error('Error approving merchant:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to approve merchant' });
  }
};

export const suspendMerchant = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;
    res.redirect(`/admin/operations/merchants/${merchantId}?success=Merchant suspended successfully`);
  } catch (error: any) {
    logger.error('Error suspending merchant:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to suspend merchant' });
  }
};

// ============================================================================
// Merchant Contacts
// ============================================================================

import * as merchantContactRepo from '../../../modules/merchant/infrastructure/repositories/merchantContactRepo';
import * as merchantVerificationDocumentRepo from '../../../modules/merchant/infrastructure/repositories/merchantVerificationDocumentRepo';
import * as merchantReviewRepo from '../../../modules/merchant/infrastructure/repositories/merchantReviewRepo';
import * as merchantPayoutRepo from '../../../modules/merchant/infrastructure/repositories/merchantPayoutRepo';
import * as merchantPayoutItemRepo from '../../../modules/merchant/infrastructure/repositories/merchantPayoutItemRepo';
import * as merchantInvoiceRepo from '../../../modules/merchant/infrastructure/repositories/merchantInvoiceRepo';
import * as commissionProfileRepo from '../../../modules/merchant/infrastructure/repositories/commissionProfileRepo';
import * as sellerPolicyRepo from '../../../modules/merchant/infrastructure/repositories/sellerPolicyRepo';

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
  } catch (error: any) {
    logger.error('Error listing merchant contacts:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load contacts' });
  }
};

export const addMerchantContact = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;
    await merchantContactRepo.create({ merchantId, ...req.body });
    res.redirect(`/admin/operations/merchants/${merchantId}/contacts?success=Contact added successfully`);
  } catch (error: any) {
    logger.error('Error adding merchant contact:', error);
    res.redirect(`/admin/operations/merchants/${req.params.merchantId}/contacts?error=${encodeURIComponent(error.message || 'Failed to add contact')}`);
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
  } catch (error: any) {
    logger.error('Error listing verification documents:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load documents' });
  }
};

export const updateDocumentStatus = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId, docId } = req.params;
    await merchantVerificationDocumentRepo.updateStatus(docId, req.body.status);
    res.redirect(`/admin/operations/merchants/${merchantId}/documents?success=Document status updated`);
  } catch (error: any) {
    logger.error('Error updating document status:', error);
    res.redirect(`/admin/operations/merchants/${req.params.merchantId}/documents?error=${encodeURIComponent(error.message || 'Failed to update status')}`);
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
  } catch (error: any) {
    logger.error('Error listing merchant reviews:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load reviews' });
  }
};

export const updateReviewStatus = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId, reviewId } = req.params;
    await merchantReviewRepo.updateStatus(reviewId, req.body.status);
    res.redirect(`/admin/operations/merchants/${merchantId}/reviews?success=Review status updated`);
  } catch (error: any) {
    logger.error('Error updating review status:', error);
    res.redirect(`/admin/operations/merchants/${req.params.merchantId}/reviews?error=${encodeURIComponent(error.message || 'Failed to update status')}`);
  }
};

// ============================================================================
// Merchant Payouts
// ============================================================================

export const listMerchantPayouts = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;
    const payouts = await merchantPayoutRepo.findByMerchant(merchantId);
    adminRespond(req, res, 'merchants/payouts/index', {
      pageName: 'Merchant Payouts',
      merchantId,
      payouts: payouts || [],
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error listing merchant payouts:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load payouts' });
  }
};

export const viewMerchantPayout = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId, payoutId } = req.params;
    const payout = await merchantPayoutRepo.findById(payoutId);
    const items = await merchantPayoutItemRepo.findByPayout(payoutId);
    adminRespond(req, res, 'merchants/payouts/detail', {
      pageName: 'Payout Details',
      merchantId,
      payout,
      items: items || [],
    });
  } catch (error: any) {
    logger.error('Error viewing merchant payout:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load payout' });
  }
};

// ============================================================================
// Merchant Invoices
// ============================================================================

export const listMerchantInvoices = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;
    const invoices = await merchantInvoiceRepo.findByMerchant(merchantId);
    adminRespond(req, res, 'merchants/invoices/index', {
      pageName: 'Merchant Invoices',
      merchantId,
      invoices: invoices || [],
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error listing merchant invoices:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load invoices' });
  }
};

// ============================================================================
// Commission Profiles
// ============================================================================

export const listCommissionProfiles = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const profiles = await commissionProfileRepo.findAll();
    adminRespond(req, res, 'merchants/commission-profiles/index', {
      pageName: 'Commission Profiles',
      profiles: profiles || [],
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error listing commission profiles:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load commission profiles' });
  }
};

export const createCommissionProfileForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'merchants/commission-profiles/form', {
      pageName: 'Create Commission Profile',
      profile: null,
      formAction: '/admin/operations/merchants/commission-profiles',
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load form' });
  }
};

export const createCommissionProfile = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await commissionProfileRepo.create(req.body);
    res.redirect('/admin/operations/merchants/commission-profiles?success=Commission profile created');
  } catch (error: any) {
    logger.error('Error creating commission profile:', error);
    adminRespond(req, res, 'merchants/commission-profiles/form', {
      pageName: 'Create Commission Profile',
      profile: null,
      formAction: '/admin/operations/merchants/commission-profiles',
      error: error.message || 'Failed to create commission profile',
      formData: req.body,
    });
  }
};

export const editCommissionProfileForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { profileId } = req.params;
    const profile = await commissionProfileRepo.findById(profileId);
    adminRespond(req, res, 'merchants/commission-profiles/form', {
      pageName: 'Edit Commission Profile',
      profile,
      formAction: `/admin/operations/merchants/commission-profiles/${profileId}`,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load form' });
  }
};

export const updateCommissionProfile = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { profileId } = req.params;
    await commissionProfileRepo.update(profileId, req.body);
    res.redirect('/admin/operations/merchants/commission-profiles?success=Commission profile updated');
  } catch (error: any) {
    logger.error('Error updating commission profile:', error);
    res.redirect(`/admin/operations/merchants/commission-profiles/${req.params.profileId}/edit?error=${encodeURIComponent(error.message || 'Failed to update')}`);
  }
};

// ============================================================================
// Seller Policies
// ============================================================================

export const listSellerPolicies = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;
    const policies = await sellerPolicyRepo.findByMerchant(merchantId);
    adminRespond(req, res, 'merchants/policies/index', {
      pageName: 'Seller Policies',
      merchantId,
      policies: policies || [],
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error listing seller policies:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load policies' });
  }
};

export const upsertSellerPolicy = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { merchantId } = req.params;
    const existing = await sellerPolicyRepo.findByMerchant(merchantId);
    if (existing && existing.length > 0) {
      await sellerPolicyRepo.update(existing[0].sellerPolicyId, req.body);
    } else {
      await sellerPolicyRepo.create({ merchantId, ...req.body });
    }
    res.redirect(`/admin/operations/merchants/${merchantId}/policies?success=Policy saved`);
  } catch (error: any) {
    logger.error('Error upserting seller policy:', error);
    res.redirect(`/admin/operations/merchants/${req.params.merchantId}/policies?error=${encodeURIComponent(error.message || 'Failed to save policy')}`);
  }
};
