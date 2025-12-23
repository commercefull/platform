/**
 * B2B Business Controller
 * Handles admin/merchant B2B operations
 */

import { logger } from '../../../libs/logger';
import { Request, Response, NextFunction } from 'express';
import * as companyRepo from '../repos/companyRepo';
import * as quoteRepo from '../repos/quoteRepo';
import * as approvalRepo from '../repos/approvalRepo';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// ============================================================================
// Companies
// ============================================================================

export const getCompanies: AsyncHandler = async (req, res, next) => {
  try {
    const { status, tier, search, limit, offset } = req.query;
    const result = await companyRepo.getCompanies(
      { status: status as any, tier: tier as any, search: search as string },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCompany: AsyncHandler = async (req, res, next) => {
  try {
    const company = await companyRepo.getCompany(req.params.id);
    if (!company) {
      res.status(404).json({ success: false, message: 'Company not found' });
      return;
    }

    const users = await companyRepo.getCompanyUsers(req.params.id);
    const addresses = await companyRepo.getCompanyAddresses(req.params.id);

    res.json({ success: true, data: { ...company, users, addresses } });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCompany: AsyncHandler = async (req, res, next) => {
  try {
    const company = await companyRepo.saveCompany(req.body);
    res.status(201).json({ success: true, data: company });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCompany: AsyncHandler = async (req, res, next) => {
  try {
    const company = await companyRepo.saveCompany({
      b2bCompanyId: req.params.id,
      ...req.body,
    });
    res.json({ success: true, data: company });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const approveCompany: AsyncHandler = async (req, res, next) => {
  try {
    const adminId = (req as any).adminId || (req as any).userId;
    await companyRepo.approveCompany(req.params.id, adminId);
    // Return the updated company data
    const company = await companyRepo.getCompany(req.params.id);
    res.json({ success: true, data: company, message: 'Company approved' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const suspendCompany: AsyncHandler = async (req, res, next) => {
  try {
    await companyRepo.suspendCompany(req.params.id);
    // Return the updated company data
    const company = await companyRepo.getCompany(req.params.id);
    res.json({ success: true, data: company, message: 'Company suspended' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCompany: AsyncHandler = async (req, res, next) => {
  try {
    await companyRepo.deleteCompany(req.params.id);
    res.json({ success: true, message: 'Company deleted' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Company Users
// ============================================================================

export const getCompanyUsers: AsyncHandler = async (req, res, next) => {
  try {
    const users = await companyRepo.getCompanyUsers(req.params.companyId, true);
    res.json({ success: true, data: users });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCompanyUser: AsyncHandler = async (req, res, next) => {
  try {
    const user = await companyRepo.saveCompanyUser({
      b2bCompanyId: req.params.companyId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCompanyUser: AsyncHandler = async (req, res, next) => {
  try {
    const user = await companyRepo.saveCompanyUser({
      b2bCompanyUserId: req.params.userId,
      b2bCompanyId: req.params.companyId,
      ...req.body,
    });
    res.json({ success: true, data: user });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCompanyUser: AsyncHandler = async (req, res, next) => {
  try {
    await companyRepo.deleteCompanyUser(req.params.userId);
    res.json({ success: true, message: 'User deleted' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Company Addresses
// ============================================================================

export const getCompanyAddresses: AsyncHandler = async (req, res, next) => {
  try {
    const addresses = await companyRepo.getCompanyAddresses(req.params.companyId);
    res.json({ success: true, data: addresses });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCompanyAddress: AsyncHandler = async (req, res, next) => {
  try {
    const address = await companyRepo.saveCompanyAddress({
      b2bCompanyId: req.params.companyId,
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
    const address = await companyRepo.saveCompanyAddress({
      b2bCompanyAddressId: req.params.addressId,
      b2bCompanyId: req.params.companyId,
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
// Quotes
// ============================================================================

export const getQuotes: AsyncHandler = async (req, res, next) => {
  try {
    const { companyId, customerId, salesRepId, status, limit, offset } = req.query;
    const result = await quoteRepo.getQuotes(
      {
        companyId: companyId as string,
        customerId: customerId as string,
        salesRepId: salesRepId as string,
        status: status as any,
      },
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

    const items = await quoteRepo.getQuoteItems(req.params.id);
    res.json({ success: true, data: { ...quote, items } });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const createQuote: AsyncHandler = async (req, res, next) => {
  try {
    // Validate required fields
    if (!req.body.b2bCompanyId && !req.body.companyId) {
      res.status(400).json({ success: false, message: 'companyId is required' });
      return;
    }

    const salesRepId = (req as any).userId || (req as any).merchantId;
    const quote = await quoteRepo.saveQuote({
      salesRepId,
      b2bCompanyId: req.body.b2bCompanyId || req.body.companyId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: quote });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateQuote: AsyncHandler = async (req, res, next) => {
  try {
    const quote = await quoteRepo.saveQuote({
      b2bQuoteId: req.params.id,
      ...req.body,
    });
    res.json({ success: true, data: quote });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const sendQuote: AsyncHandler = async (req, res, next) => {
  try {
    await quoteRepo.sendQuote(req.params.id);
    // Return the updated quote data
    const quote = await quoteRepo.getQuote(req.params.id);
    res.json({ success: true, data: quote, message: 'Quote sent' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteQuote: AsyncHandler = async (req, res, next) => {
  try {
    await quoteRepo.deleteQuote(req.params.id);
    res.json({ success: true, message: 'Quote deleted' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Quote Items
// ============================================================================

export const addQuoteItem: AsyncHandler = async (req, res, next) => {
  try {
    const item = await quoteRepo.saveQuoteItem({
      b2bQuoteId: req.params.id,
      ...req.body,
    });
    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateQuoteItem: AsyncHandler = async (req, res, next) => {
  try {
    const item = await quoteRepo.saveQuoteItem({
      b2bQuoteItemId: req.params.itemId,
      b2bQuoteId: req.params.id,
      ...req.body,
    });
    res.json({ success: true, data: item });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteQuoteItem: AsyncHandler = async (req, res, next) => {
  try {
    await quoteRepo.deleteQuoteItem(req.params.itemId);
    res.json({ success: true, message: 'Item deleted' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Approval Workflows
// ============================================================================

export const getWorkflows: AsyncHandler = async (req, res, next) => {
  try {
    const { companyId, workflowType } = req.query;
    const workflows = await approvalRepo.getWorkflows(companyId as string, workflowType as any);
    res.json({ success: true, data: workflows });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWorkflow: AsyncHandler = async (req, res, next) => {
  try {
    const workflow = await approvalRepo.getWorkflow(req.params.id);
    if (!workflow) {
      res.status(404).json({ success: false, message: 'Workflow not found' });
      return;
    }

    const steps = await approvalRepo.getWorkflowSteps(req.params.id);
    res.json({ success: true, data: { ...workflow, steps } });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const createWorkflow: AsyncHandler = async (req, res, next) => {
  try {
    const workflow = await approvalRepo.saveWorkflow(req.body);
    res.status(201).json({ success: true, data: workflow });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateWorkflow: AsyncHandler = async (req, res, next) => {
  try {
    const workflow = await approvalRepo.saveWorkflow({
      b2bApprovalWorkflowId: req.params.id,
      ...req.body,
    });
    res.json({ success: true, data: workflow });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteWorkflow: AsyncHandler = async (req, res, next) => {
  try {
    await approvalRepo.deleteWorkflow(req.params.id);
    res.json({ success: true, message: 'Workflow deleted' });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Approval Requests
// ============================================================================

export const getApprovalRequests: AsyncHandler = async (req, res, next) => {
  try {
    const { companyId, requesterId, status, requestType, limit, offset } = req.query;
    const result = await approvalRepo.getApprovalRequests(
      {
        companyId: companyId as string,
        requesterId: requesterId as string,
        status: status as any,
        requestType: requestType as any,
      },
      { limit: parseInt(limit as string) || 20, offset: parseInt(offset as string) || 0 },
    );
    res.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const getApprovalRequest: AsyncHandler = async (req, res, next) => {
  try {
    const request = await approvalRepo.getApprovalRequest(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, message: 'Approval request not found' });
      return;
    }

    const actions = await approvalRepo.getApprovalActions(req.params.id);
    res.json({ success: true, data: { ...request, actions } });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message });
  }
};

export const processApprovalAction: AsyncHandler = async (req, res, next) => {
  try {
    const approverId = (req as any).userId || (req as any).merchantId;
    const request = await approvalRepo.processApprovalAction(req.params.id, {
      approverId,
      approverType: 'merchant',
      ...req.body,
    });
    res.json({ success: true, data: request });
  } catch (error: any) {
    logger.error('Error:', error);

    res.status(400).json({ success: false, message: error.message });
  }
};
