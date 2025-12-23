/**
 * B2B Customer Controller
 * Handles customer-facing B2B operations
 */

import { logger } from '../../../libs/logger';
import { Request, Response, NextFunction } from 'express';
import * as companyRepo from '../repos/companyRepo';
import * as quoteRepo from '../repos/quoteRepo';
import * as approvalRepo from '../repos/approvalRepo';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// ============================================================================
// Company Registration
// ============================================================================

export const registerCompany: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;

    const company = await companyRepo.saveCompany({
      name: req.body.name,
      legalName: req.body.legalName,
      registrationNumber: req.body.registrationNumber,
      vatNumber: req.body.vatNumber,
      taxId: req.body.taxId,
      companyType: req.body.companyType,
      industry: req.body.industry,
      employeeCount: req.body.employeeCount,
      website: req.body.website,
      phone: req.body.phone,
      email: req.body.email,
      description: req.body.description,
    });

    // Create the registering user as admin
    await companyRepo.saveCompanyUser({
      b2bCompanyId: company.b2bCompanyId,
      customerId,
      email: req.body.contactEmail || req.body.email,
      firstName: req.body.contactFirstName,
      lastName: req.body.contactLastName,
      phone: req.body.contactPhone,
      jobTitle: req.body.contactJobTitle,
      role: 'admin',
      isPrimaryContact: true,
      canPlaceOrders: true,
      canViewPrices: true,
      canApproveOrders: true,
      canManageUsers: true,
      canManageCompany: true,
    });

    res.status(201).json({
      success: true,
      message: 'Company registration submitted. Pending approval.',
      data: { b2bCompanyId: company.b2bCompanyId, status: company.status },
    });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyCompany: AsyncHandler = async (req, res, next) => {
  try {
    const companyId = (req as any).companyId;
    if (!companyId) {
      res.status(404).json({ success: false, message: 'No company associated with this account' });
      return;
    }

    const company = await companyRepo.getCompany(companyId);
    if (!company) {
      res.status(404).json({ success: false, message: 'Company not found' });
      return;
    }

    res.json({ success: true, data: company });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMyCompany: AsyncHandler = async (req, res, next) => {
  try {
    const companyId = (req as any).companyId;
    const companyUser = (req as any).companyUser;

    if (!companyUser?.canManageCompany) {
      res.status(403).json({ success: false, message: 'Not authorized to manage company' });
      return;
    }

    const company = await companyRepo.saveCompany({
      companyId,
      ...req.body,
    });
    res.json({ success: true, data: company });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Company Users (Self-service)
// ============================================================================

export const getMyCompanyUsers: AsyncHandler = async (req, res, next) => {
  try {
    const companyId = (req as any).companyId;
    const users = await companyRepo.getCompanyUsers(companyId);
    res.json({ success: true, data: users });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const inviteCompanyUser: AsyncHandler = async (req, res, next) => {
  try {
    const companyId = (req as any).companyId;
    const companyUser = (req as any).companyUser;

    if (!companyUser?.canManageUsers) {
      res.status(403).json({ success: false, message: 'Not authorized to manage users' });
      return;
    }

    // Check if user already exists
    const existing = await companyRepo.getCompanyUserByEmail(companyId, req.body.email);
    if (existing) {
      res.status(409).json({ success: false, message: 'User with this email already exists' });
      return;
    }

    const user = await companyRepo.saveCompanyUser({
      b2bCompanyId: companyId,
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      jobTitle: req.body.jobTitle,
      department: req.body.department,
      role: req.body.role || 'buyer',
      canPlaceOrders: req.body.canPlaceOrders,
      canViewPrices: req.body.canViewPrices,
      canApproveOrders: req.body.canApproveOrders,
      orderLimit: req.body.orderLimit,
      monthlyLimit: req.body.monthlyLimit,
      requiresApproval: req.body.requiresApproval,
      approverId: req.body.approverId,
    });

    // TODO: Send invitation email with inviteToken

    res.status(201).json({
      success: true,
      message: 'Invitation sent',
      data: { b2bCompanyUserId: user.b2bCompanyUserId, inviteToken: user.inviteToken },
    });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const acceptInvite: AsyncHandler = async (req, res, next) => {
  try {
    const customerId = (req as any).customerId;
    const { inviteToken } = req.body;

    const user = await companyRepo.acceptInvite(inviteToken, customerId);
    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid or expired invitation' });
      return;
    }

    res.json({ success: true, message: 'Invitation accepted', data: user });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCompanyUser: AsyncHandler = async (req, res, next) => {
  try {
    const companyId = (req as any).companyId;
    const companyUser = (req as any).companyUser;

    if (!companyUser?.canManageUsers) {
      res.status(403).json({ success: false, message: 'Not authorized to manage users' });
      return;
    }

    const user = await companyRepo.saveCompanyUser({
      b2bCompanyUserId: req.params.userId,
      companyId,
      ...req.body,
    });
    res.json({ success: true, data: user });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const removeCompanyUser: AsyncHandler = async (req, res, next) => {
  try {
    const companyUser = (req as any).companyUser;

    if (!companyUser?.canManageUsers) {
      res.status(403).json({ success: false, message: 'Not authorized to manage users' });
      return;
    }

    await companyRepo.deleteCompanyUser(req.params.userId);
    res.json({ success: true, message: 'User removed' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Company Addresses (Self-service)
// ============================================================================

export const getMyCompanyAddresses: AsyncHandler = async (req, res, next) => {
  try {
    const companyId = (req as any).companyId;
    const { type } = req.query;
    const addresses = await companyRepo.getCompanyAddresses(companyId, type as any);
    res.json({ success: true, data: addresses });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const addCompanyAddress: AsyncHandler = async (req, res, next) => {
  try {
    const companyId = (req as any).companyId;
    const address = await companyRepo.saveCompanyAddress({
      companyId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: address });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCompanyAddress: AsyncHandler = async (req, res, next) => {
  try {
    const companyId = (req as any).companyId;
    const address = await companyRepo.saveCompanyAddress({
      companyAddressId: req.params.addressId,
      companyId,
      ...req.body,
    });
    res.json({ success: true, data: address });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCompanyAddress: AsyncHandler = async (req, res, next) => {
  try {
    await companyRepo.deleteCompanyAddress(req.params.addressId);
    res.json({ success: true, message: 'Address deleted' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Quotes (Customer View)
// ============================================================================

export const getMyQuotes: AsyncHandler = async (req, res, next) => {
  try {
    const companyId = (req as any).companyId;
    const customerId = (req as any).customerId;
    const { status, limit, offset } = req.query;

    const result = await quoteRepo.getQuotes(
      { companyId, customerId, status: status as any },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const getQuote: AsyncHandler = async (req, res, next) => {
  try {
    const quote = await quoteRepo.getQuote(req.params.id);
    if (!quote) {
      res.status(404).json({ success: false, message: 'Quote not found' });
      return;
    }

    // Mark as viewed
    if (quote.status === 'sent') {
      await quoteRepo.markQuoteViewed(req.params.id);
    }

    const items = await quoteRepo.getQuoteItems(req.params.id);
    res.json({ success: true, data: { ...quote, items } });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const requestQuote: AsyncHandler = async (req, res, next) => {
  try {
    const companyId = (req as any).companyId;
    const customerId = (req as any).customerId;
    const b2bCompanyUserId = (req as any).b2bCompanyUserId;

    const quote = await quoteRepo.saveQuote({
      b2bCompanyId: companyId,
      customerId,
      b2bCompanyUserId,
      customerNotes: req.body.notes,
      shippingAddressId: req.body.shippingAddressId,
      billingAddressId: req.body.billingAddressId,
    });

    // Add items
    if (req.body.items?.length) {
      for (const item of req.body.items) {
        await quoteRepo.saveQuoteItem({
          b2bQuoteId: quote.b2bQuoteId,
          ...item,
        });
      }
    }

    res.status(201).json({ success: true, data: quote });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const acceptQuote: AsyncHandler = async (req, res, next) => {
  try {
    const quote = await quoteRepo.getQuote(req.params.id);
    if (!quote) {
      res.status(404).json({ success: false, message: 'Quote not found' });
      return;
    }

    if (quote.status !== 'sent' && quote.status !== 'viewed') {
      res.status(400).json({ success: false, message: 'Quote cannot be accepted in current status' });
      return;
    }

    // Check if approval is required
    const companyId = (req as any).companyId;
    const companyUser = (req as any).companyUser;

    if (companyUser?.requiresApproval || (companyUser?.orderLimit && quote.grandTotal > companyUser.orderLimit)) {
      // Create approval request
      const workflow = await approvalRepo.findMatchingWorkflow(companyId, 'quote', quote.grandTotal);
      if (workflow) {
        await approvalRepo.createApprovalRequest({
          approvalWorkflowId: workflow.b2bApprovalWorkflowId,
          companyId,
          requestType: 'quote',
          entityId: quote.b2bQuoteId,
          entityType: 'quote',
          requesterId: companyUser.b2bCompanyUserId,
          requesterType: 'companyUser',
          amount: quote.grandTotal,
          currency: quote.currency,
        });

        res.json({ success: true, message: 'Quote acceptance submitted for approval' });
        return;
      }
    }

    await quoteRepo.acceptQuote(req.params.id);
    res.json({ success: true, message: 'Quote accepted' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const rejectQuote: AsyncHandler = async (req, res, next) => {
  try {
    await quoteRepo.rejectQuote(req.params.id, req.body.reason);
    res.json({ success: true, message: 'Quote rejected' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Approval Requests (Customer View)
// ============================================================================

export const getMyApprovalRequests: AsyncHandler = async (req, res, next) => {
  try {
    const companyId = (req as any).companyId;
    const b2bCompanyUserId = (req as any).b2bCompanyUserId;
    const { status, limit, offset } = req.query;

    const result = await approvalRepo.getApprovalRequests(
      { companyId, requesterId: b2bCompanyUserId, status: status as any },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingApprovals: AsyncHandler = async (req, res, next) => {
  try {
    const companyUser = (req as any).companyUser;

    if (!companyUser?.canApproveOrders) {
      res.status(403).json({ success: false, message: 'Not authorized to approve requests' });
      return;
    }

    const companyId = (req as any).companyId;
    const result = await approvalRepo.getApprovalRequests({ companyId, status: 'pending' }, { limit: 50, offset: 0 });
    res.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const processApproval: AsyncHandler = async (req, res, next) => {
  try {
    const companyUser = (req as any).companyUser;

    if (!companyUser?.canApproveOrders) {
      res.status(403).json({ success: false, message: 'Not authorized to approve requests' });
      return;
    }

    const request = await approvalRepo.processApprovalAction(req.params.id, {
      approverId: companyUser.b2bCompanyUserId,
      approverType: 'companyUser',
      action: req.body.action,
      comment: req.body.comment,
    });

    // If approved and it's a quote, accept the quote
    if (request.status === 'approved' && request.entityType === 'quote') {
      await quoteRepo.acceptQuote(request.entityId);
    }

    res.json({ success: true, data: request });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};
