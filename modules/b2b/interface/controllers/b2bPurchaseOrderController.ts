/**
 * B2B Purchase Order Controller
 * Handlers for B2B purchase order operations
 */

import { Request, Response } from 'express';
import { logger } from '../../../../libs/logger';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import { SubmitB2BPurchaseOrderUseCase } from '../../application/useCases/SubmitB2BPurchaseOrder';
import * as b2bPurchaseOrderRepo from '../../infrastructure/repositories/b2bPurchaseOrderRepo';

// ============================================================================
// List Purchase Orders
// ============================================================================

export const listPurchaseOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req.user as any)?.companyId || req.params.companyId;
    if (!companyId) {
      errorResponse(res, 'Company ID is required', 400);
      return;
    }
    const purchaseOrders = await b2bPurchaseOrderRepo.findByCompany(companyId);
    successResponse(res, { purchaseOrders });
  } catch (error: any) {
    logger.error('listPurchaseOrders error:', error);
    errorResponse(res, error.message || 'Failed to list purchase orders');
  }
};

// ============================================================================
// Get Purchase Order
// ============================================================================

export const getPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { purchaseOrderId } = req.params;
    const purchaseOrder = await b2bPurchaseOrderRepo.findById(purchaseOrderId);
    if (!purchaseOrder) {
      errorResponse(res, 'Purchase order not found', 404);
      return;
    }
    successResponse(res, { purchaseOrder });
  } catch (error: any) {
    logger.error('getPurchaseOrder error:', error);
    errorResponse(res, error.message || 'Failed to get purchase order');
  }
};

// ============================================================================
// Create Purchase Order
// ============================================================================

export const createPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req.user as any)?.companyId;
    if (!companyId) {
      errorResponse(res, 'Company ID is required', 400);
      return;
    }
    const { currency, notes, items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      errorResponse(res, 'At least one item is required', 400);
      return;
    }
    const useCase = new SubmitB2BPurchaseOrderUseCase();
    const result = await useCase.execute({ b2bCompanyId: companyId, currency, notes, items });
    if (!result.success) {
      errorResponse(res, result.error || 'Failed to create purchase order', 400);
      return;
    }
    successResponse(res, result.purchaseOrder, 201);
  } catch (error: any) {
    logger.error('createPurchaseOrder error:', error);
    errorResponse(res, error.message || 'Failed to create purchase order');
  }
};
