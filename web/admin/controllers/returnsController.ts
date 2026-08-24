/**
 * Returns Controller
 * Handles returns, exchanges & store credit management for the Admin Hub
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { adminRespond } from '../../respond';
import {
  createReturnRequestUseCase,
  approveReturnRequestUseCase,
  denyReturnRequestUseCase,
  markReturnInTransitUseCase,
  markReturnReceivedUseCase,
  completeReturnInspectionUseCase,
  completeReturnRequestUseCase,
  cancelReturnRequestUseCase,
  getReturnRequestUseCase,
  listReturnRequestsUseCase,
  getStoreCreditBalanceUseCase,
  getStoreCreditLedgerUseCase,
} from '../../../modules/returns/application/useCases/wired';

// ============================================================================
// List Returns
// ============================================================================

export const listReturns = async (req: TypedRequest, res: Response): Promise<void> => {
  const status = req.query.status as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
  const returns = await listReturnRequestsUseCase.execute(status, limit, offset);

  adminRespond(req, res, 'operations/returns/index', {
    pageName: 'Returns',
    returns: returns.map(r => r.toJSON()),
    filters: { status, limit, offset },
    success: req.query.success || null,
  });
};

// ============================================================================
// View Return
// ============================================================================

export const viewReturn = async (req: TypedRequest, res: Response): Promise<void> => {
  const { returnId } = req.params;
  const returnRequest = await getReturnRequestUseCase.execute(returnId);

  if (!returnRequest) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Return request not found',
    });
    return;
  }

  adminRespond(req, res, 'operations/returns/view', {
    pageName: `Return: ${returnRequest.returnNumber}`,
    returnRequest: returnRequest.toJSON(),
    success: req.query.success || null,
    error: req.query.error || null,
  });
};

// ============================================================================
// Create Return
// ============================================================================

export const createReturnForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'operations/returns/create', {
    pageName: 'Create Return Request',
  });
};

export const createReturn = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { orderId, customerId, returnType, returnReason, customerNotes, returnCarrier, returnShippingPaid, requiresInspection, items } = body;

    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

    const result = await createReturnRequestUseCase.execute({
      orderId,
      customerId: customerId || undefined,
      returnType,
      returnReason: returnReason || undefined,
      customerNotes: customerNotes || undefined,
      returnCarrier: returnCarrier || undefined,
      returnShippingPaid: returnShippingPaid === 'true',
      requiresInspection: requiresInspection !== 'false',
      items: parsedItems,
    });

    res.redirect(`/admin/returns/${result.orderReturnId}?success=Return request created successfully`);
  } catch (error: unknown) {
    logger.warn('Error creating return request:', error);
    adminRespond(req, res, 'operations/returns/create', {
      pageName: 'Create Return Request',
      error: (error as Error).message || 'Failed to create return request',
      formData: req.body as RequestBody,
    });
  }
};

// ============================================================================
// Return Workflow Actions
// ============================================================================

export const approveReturn = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { returnId } = req.params;
    const body = req.body as RequestBody;
    await approveReturnRequestUseCase.execute(returnId, body?.rmaNumber);
    res.redirect(`/admin/returns/${returnId}?success=Return approved successfully`);
  } catch (error: unknown) {
    logger.warn('Error approving return:', error);
    res.redirect(`/admin/returns/${req.params.returnId}?error=Failed to approve return`);
  }
};

export const denyReturn = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { returnId } = req.params;
    const body = req.body as RequestBody;
    await denyReturnRequestUseCase.execute(returnId, body?.reason);
    res.redirect(`/admin/returns/${returnId}?success=Return denied`);
  } catch (error: unknown) {
    logger.warn('Error denying return:', error);
    res.redirect(`/admin/returns/${req.params.returnId}?error=Failed to deny return`);
  }
};

export const markInTransit = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { returnId } = req.params;
    const body = req.body as RequestBody;
    await markReturnInTransitUseCase.execute(returnId, body?.trackingNumber, body?.trackingUrl);
    res.redirect(`/admin/returns/${returnId}?success=Return marked as in transit`);
  } catch (error: unknown) {
    logger.warn('Error marking return in transit:', error);
    res.redirect(`/admin/returns/${req.params.returnId}?error=Failed to update return`);
  }
};

export const markReceived = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { returnId } = req.params;
    await markReturnReceivedUseCase.execute(returnId);
    res.redirect(`/admin/returns/${returnId}?success=Return marked as received`);
  } catch (error: unknown) {
    logger.warn('Error marking return received:', error);
    res.redirect(`/admin/returns/${req.params.returnId}?error=Failed to update return`);
  }
};

export const completeInspection = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { returnId } = req.params;
    const body = req.body as RequestBody;
    const passedItems = body?.passedItems ? (typeof body.passedItems === 'string' ? JSON.parse(body.passedItems) : body.passedItems) : undefined;
    const failedItems = body?.failedItems ? (typeof body.failedItems === 'string' ? JSON.parse(body.failedItems) : body.failedItems) : undefined;
    await completeReturnInspectionUseCase.execute(returnId, passedItems, failedItems);
    res.redirect(`/admin/returns/${returnId}?success=Inspection completed`);
  } catch (error: unknown) {
    logger.warn('Error completing inspection:', error);
    res.redirect(`/admin/returns/${req.params.returnId}?error=Failed to complete inspection`);
  }
};

export const completeReturn = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { returnId } = req.params;
    await completeReturnRequestUseCase.execute(returnId);
    res.redirect(`/admin/returns/${returnId}?success=Return completed successfully`);
  } catch (error: unknown) {
    logger.warn('Error completing return:', error);
    res.redirect(`/admin/returns/${req.params.returnId}?error=Failed to complete return`);
  }
};

export const cancelReturn = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { returnId } = req.params;
    const body = req.body as RequestBody;
    await cancelReturnRequestUseCase.execute(returnId, body?.reason);
    res.redirect(`/admin/returns/${returnId}?success=Return cancelled`);
  } catch (error: unknown) {
    logger.warn('Error cancelling return:', error);
    res.redirect(`/admin/returns/${req.params.returnId}?error=Failed to cancel return`);
  }
};

// ============================================================================
// Store Credit
// ============================================================================

export const viewStoreCredit = async (req: TypedRequest, res: Response): Promise<void> => {
  const customerId = req.query.customerId as string;

  if (customerId) {
    const [balance, ledger] = await Promise.all([
      getStoreCreditBalanceUseCase.execute(customerId),
      getStoreCreditLedgerUseCase.execute(customerId),
    ]);

    adminRespond(req, res, 'operations/returns/store-credit', {
      pageName: 'Store Credit',
      customerId,
      balance,
      ledger: ledger.map(e => e.toJSON()),
      success: req.query.success || null,
    });
  } else {
    adminRespond(req, res, 'operations/returns/store-credit', {
      pageName: 'Store Credit',
      customerId: null,
      balance: null,
      ledger: [],
      success: req.query.success || null,
    });
  }
};
