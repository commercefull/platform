/**
 * B2B Purchase Order Controller
 * Handles purchase order listing, creation, and detail views
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { logger } from '../../../libs/logger';
import { b2bRespond } from '../../respond';
import { SubmitB2BPurchaseOrderUseCase } from '../../../modules/b2b/application/useCases/SubmitB2BPurchaseOrder';
import { GetCompanyCreditStatusUseCase } from '../../../modules/b2b/application/useCases/GetCompanyCreditStatus';
import * as b2bPurchaseOrderRepo from '../../../modules/b2b/infrastructure/repositories/b2bPurchaseOrderRepo';
import * as b2bPurchaseOrderItemRepo from '../../../modules/b2b/infrastructure/repositories/b2bPurchaseOrderItemRepo';

interface B2BUser {
  id: string;
  companyId: string;
  email: string;
  name: string;
  role: string;
}

/**
 * GET /b2b/purchase-orders
 * List all purchase orders for the company
 */
export const listPurchaseOrders = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as B2BUser;
    if (!user?.companyId) {
      return res.redirect('/b2b/login');
    }

    const purchaseOrders = await b2bPurchaseOrderRepo.findByCompany(user.companyId);

    b2bRespond(req, res, 'purchase-orders/index', {
      pageName: 'Purchase Orders',
      user,
      purchaseOrders,
    });
  } catch (error) {
    logger.error('Error loading purchase orders:', error);
    b2bRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load purchase orders', user: req.user });
  }
};

/**
 * GET /b2b/purchase-orders/create
 * Show the create purchase order form with credit validation info
 */
export const createPurchaseOrderForm = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as B2BUser;
    if (!user?.companyId) {
      return res.redirect('/b2b/login');
    }

    const creditUseCase = new GetCompanyCreditStatusUseCase();
    const creditResult = await creditUseCase.execute({ b2bCompanyId: user.companyId });

    b2bRespond(req, res, 'purchase-orders/create', {
      pageName: 'Create Purchase Order',
      user,
      creditStatus: creditResult.creditStatus ?? null,
    });
  } catch (error) {
    logger.error('Error loading create purchase order form:', error);
    b2bRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load form', user: req.user });
  }
};

/**
 * POST /b2b/purchase-orders
 * Submit a new purchase order via SubmitB2BPurchaseOrderUseCase
 */
export const createPurchaseOrder = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as B2BUser;
    if (!user?.companyId) {
      return res.redirect('/b2b/login');
    }

    const { notes, currency, items } = req.body;

    // Parse items from form (array of {name, quantity, unitPrice, sku})
    const parsedItems = Array.isArray(items) ? items : items ? [items] : [];
    const mappedItems = parsedItems
      .filter((item: any) => item.name && item.quantity && item.unitPrice)
      .map((item: any) => ({
        name: item.name,
        quantity: parseInt(item.quantity, 10),
        unitPrice: parseFloat(item.unitPrice),
        sku: item.sku || undefined,
        productId: item.productId || undefined,
        notes: item.notes || undefined,
      }));

    if (mappedItems.length === 0) {
      const creditUseCase = new GetCompanyCreditStatusUseCase();
      const creditResult = await creditUseCase.execute({ b2bCompanyId: user.companyId });
      return b2bRespond(req, res, 'purchase-orders/create', {
        pageName: 'Create Purchase Order',
        user,
        creditStatus: creditResult.creditStatus ?? null,
        errorMsg: 'At least one valid item is required',
      });
    }

    const useCase = new SubmitB2BPurchaseOrderUseCase();
    const result = await useCase.execute({
      b2bCompanyId: user.companyId,
      currency: currency || 'USD',
      notes: notes || undefined,
      items: mappedItems,
    });

    if (!result.success) {
      const creditUseCase = new GetCompanyCreditStatusUseCase();
      const creditResult = await creditUseCase.execute({ b2bCompanyId: user.companyId });
      return b2bRespond(req, res, 'purchase-orders/create', {
        pageName: 'Create Purchase Order',
        user,
        creditStatus: creditResult.creditStatus ?? null,
        errorMsg: result.error || 'Failed to create purchase order',
      });
    }

    return res.redirect(`/b2b/purchase-orders/${result.purchaseOrder!.b2bPurchaseOrderId}`);
  } catch (error) {
    logger.error('Error creating purchase order:', error);
    b2bRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to create purchase order', user: req.user });
  }
};

/**
 * GET /b2b/purchase-orders/:purchaseOrderId
 * View a single purchase order with its items
 */
export const viewPurchaseOrder = async (req: TypedRequest, res: Response) => {
  try {
    const user = req.user as B2BUser;
    if (!user?.companyId) {
      return res.redirect('/b2b/login');
    }

    const { purchaseOrderId } = req.params;
    const purchaseOrder = await b2bPurchaseOrderRepo.findById(purchaseOrderId);

    if (!purchaseOrder || purchaseOrder.b2bCompanyId !== user.companyId) {
      return b2bRespond(req, res, 'error', { pageName: 'Not Found', error: 'Purchase order not found', user });
    }

    const items = await b2bPurchaseOrderItemRepo.findByPurchaseOrder(purchaseOrderId);

    b2bRespond(req, res, 'purchase-orders/detail', {
      pageName: `PO #${purchaseOrder.orderNumber || purchaseOrder.b2bPurchaseOrderId.slice(0, 8)}`,
      user,
      purchaseOrder,
      items,
    });
  } catch (error) {
    logger.error('Error loading purchase order:', error);
    b2bRespond(req, res, 'error', { pageName: 'Error', error: 'Failed to load purchase order', user: req.user });
  }
};
