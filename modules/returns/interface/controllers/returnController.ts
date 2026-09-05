import { Response } from 'express';
import { TypedRequest } from '../../../../libs/types/express';
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
  debitStoreCreditUseCase,
} from '../../application/useCases/wired';
import { ReturnNotFoundError, InvalidReturnRequestError, InsufficientStoreCreditError } from '../../domain/errors/ReturnErrors';

class ReturnController {
  async listReturns(req: TypedRequest, res: Response): Promise<void> {
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const returns = await listReturnRequestsUseCase.execute(status, limit, offset);
    res.json({ success: true, data: returns.map(r => r.toJSON()) });
  }

  async getReturn(req: TypedRequest<{ returnId: string }>, res: Response): Promise<void> {
    try {
      const returnRequest = await getReturnRequestUseCase.execute(req.params.returnId);
      res.json({ success: true, data: returnRequest.toJSON() });
    } catch (error) {
      if (error instanceof ReturnNotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal error' });
      }
    }
  }

  async createReturn(req: TypedRequest<Record<string, never>, Record<string, never>, {
    orderId: string;
    customerId?: string;
    returnType: string;
    returnReason?: string;
    customerNotes?: string;
    returnCarrier?: string;
    returnShippingPaid?: boolean;
    requiresInspection?: boolean;
    items: Array<{
      orderItemId: string;
      quantity: number;
      returnReason: string;
      returnReasonDetail?: string;
      condition: string;
      restockItem?: boolean;
      refundAmount?: number;
      exchangeProductId?: string;
      exchangeVariantId?: string;
      notes?: string;
      warrantyStatus?: string;
    }>;
  }>, res: Response): Promise<void> {
    try {
      const result = await createReturnRequestUseCase.execute(req.body as Parameters<typeof createReturnRequestUseCase.execute>[0]);
      res.status(201).json({ success: true, data: result.toJSON() });
    } catch (error) {
      if (error instanceof InvalidReturnRequestError) {
        res.status(400).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal error' });
      }
    }
  }

  async approveReturn(req: TypedRequest<{ returnId: string }, Record<string, never>, { rmaNumber?: string }>, res: Response): Promise<void> {
    try {
      const result = await approveReturnRequestUseCase.execute(req.params.returnId, req.body?.rmaNumber);
      res.json({ success: true, data: result.toJSON() });
    } catch (error) {
      if (error instanceof ReturnNotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal error' });
      }
    }
  }

  async denyReturn(req: TypedRequest<{ returnId: string }, Record<string, never>, { reason?: string }>, res: Response): Promise<void> {
    try {
      const result = await denyReturnRequestUseCase.execute(req.params.returnId, req.body?.reason);
      res.json({ success: true, data: result.toJSON() });
    } catch (error) {
      if (error instanceof ReturnNotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal error' });
      }
    }
  }

  async markInTransit(req: TypedRequest<{ returnId: string }, Record<string, never>, { trackingNumber?: string; trackingUrl?: string }>, res: Response): Promise<void> {
    try {
      const result = await markReturnInTransitUseCase.execute(req.params.returnId, req.body?.trackingNumber, req.body?.trackingUrl);
      res.json({ success: true, data: result.toJSON() });
    } catch (error) {
      if (error instanceof ReturnNotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal error' });
      }
    }
  }

  async markReceived(req: TypedRequest<{ returnId: string }>, res: Response): Promise<void> {
    try {
      const result = await markReturnReceivedUseCase.execute(req.params.returnId);
      res.json({ success: true, data: result.toJSON() });
    } catch (error) {
      if (error instanceof ReturnNotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal error' });
      }
    }
  }

  async completeInspection(req: TypedRequest<{ returnId: string }, Record<string, never>, { passedItems?: Record<string, unknown>; failedItems?: Record<string, unknown> }>, res: Response): Promise<void> {
    try {
      const result = await completeReturnInspectionUseCase.execute(req.params.returnId, req.body?.passedItems, req.body?.failedItems);
      res.json({ success: true, data: result.toJSON() });
    } catch (error) {
      if (error instanceof ReturnNotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal error' });
      }
    }
  }

  async completeReturn(req: TypedRequest<{ returnId: string }>, res: Response): Promise<void> {
    try {
      const result = await completeReturnRequestUseCase.execute(req.params.returnId);
      res.json({ success: true, data: result.toJSON() });
    } catch (error) {
      if (error instanceof ReturnNotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal error' });
      }
    }
  }

  async cancelReturn(req: TypedRequest<{ returnId: string }, Record<string, never>, { reason?: string }>, res: Response): Promise<void> {
    try {
      const result = await cancelReturnRequestUseCase.execute(req.params.returnId, req.body?.reason);
      res.json({ success: true, data: result.toJSON() });
    } catch (error) {
      if (error instanceof ReturnNotFoundError) {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal error' });
      }
    }
  }

  async getStoreCreditBalance(req: TypedRequest, res: Response): Promise<void> {
    const customerId = req.query.customerId as string;
    if (!customerId) {
      res.status(400).json({ success: false, error: 'customerId is required' });
      return;
    }
    const balance = await getStoreCreditBalanceUseCase.execute(customerId);
    res.json({ success: true, data: balance });
  }

  async getStoreCreditLedger(req: TypedRequest, res: Response): Promise<void> {
    const customerId = req.query.customerId as string;
    if (!customerId) {
      res.status(400).json({ success: false, error: 'customerId is required' });
      return;
    }
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const ledger = await getStoreCreditLedgerUseCase.execute(customerId, limit);
    res.json({ success: true, data: ledger.map(e => e.toJSON()) });
  }

  async debitStoreCredit(req: TypedRequest<Record<string, never>, Record<string, never>, {
    customerId: string;
    amount: number;
    referenceType?: string;
    referenceId?: string;
    reason?: string;
  }>, res: Response): Promise<void> {
    try {
      const result = await debitStoreCreditUseCase.execute(req.body as Parameters<typeof debitStoreCreditUseCase.execute>[0]);
      res.json({ success: true, data: result.toJSON() });
    } catch (error) {
      if (error instanceof InsufficientStoreCreditError) {
        res.status(400).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: 'Internal error' });
      }
    }
  }
}

export default new ReturnController();
