import type { HttpRequest, HttpResponse } from 'libs/http';
import { query, queryOne } from '../../../../libs/db';
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

class ReturnController {
  async listReturns(req: HttpRequest, res: HttpResponse): Promise<void> {
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const returns = await listReturnRequestsUseCase.execute(status, limit, offset);
    res.json({ success: true, data: returns.map(r => r.toJSON()) });
  }

  async getReturn(req: HttpRequest<{ returnId: string }>, res: HttpResponse): Promise<void> {
    const returnRequest = await getReturnRequestUseCase.execute(req.params.returnId);
    res.json({ success: true, data: returnRequest.toJSON() });
  }

  async createReturn(
    req: HttpRequest<
      Record<string, never>,
      Record<string, never>,
      {
        orderId: string;
        customerId?: string;
        returnType?: string;
        returnReason?: string;
        reason?: string;
        customerNotes?: string;
        returnCarrier?: string;
        returnShippingPaid?: boolean;
        requiresInspection?: boolean;
        items: Array<{
          orderItemId?: string;
          productId?: string;
          quantity: number;
          returnReason?: string;
          reason?: string;
          returnReasonDetail?: string;
          condition?: string;
          restockItem?: boolean;
          refundAmountCents?: number;
          exchangeProductId?: string;
          exchangeVariantId?: string;
          notes?: string;
          warrantyStatus?: string;
        }>;
      }
    >,
    res: HttpResponse,
  ): Promise<void> {
    const body = req.body;
    // Normalize: accept "reason" as shorthand for "returnReason"
    const returnReason = body.returnReason || body.reason || '';
    // Normalize: accept "productId" as shorthand for "orderItemId", "reason" for "returnReason"
    // Map allowed returnReason values
    const reasonMap: Record<string, string> = {
      defective: 'damaged',
      damaged: 'damaged',
      wrong: 'wrongProduct',
      'wrong-product': 'wrongProduct',
      'not-as-described': 'productNotAsDescribed',
      expired: 'expired',
      other: 'other',
    };
    const mapReason = (r: string): string =>
      reasonMap[r] || (['productNotAsDescribed', 'wrongProduct', 'damaged', 'expired', 'other'].includes(r) ? r : 'other');
    // Look up orderItem IDs for the order if needed
    let orderItems: { orderItemId: string; productId?: string }[] = [];
    if (body.orderId) {
      orderItems =
        (await query<{ orderItemId: string; productId?: string }[]>(
          'SELECT "orderItemId", "productId" FROM "orderItem" WHERE "orderId" = $1 ORDER BY "createdAt" ASC',
          [body.orderId],
        )) || [];
    }
    const items = (body.items || []).map((item, idx) => {
      let orderItemId = item.orderItemId || item.productId || '';
      // If the orderItemId doesn't look like a valid UUID or isn't in the order, look it up
      if (orderItems.length > 0) {
        const matched = orderItems.find(oi => oi.orderItemId === orderItemId || oi.productId === orderItemId);
        if (matched) {
          orderItemId = matched.orderItemId;
        } else if (idx < orderItems.length) {
          orderItemId = orderItems[idx].orderItemId;
        }
      }
      return {
        ...item,
        orderItemId,
        returnReason: mapReason(item.returnReason || item.reason || returnReason || 'other'),
        condition: item.condition || 'new',
      };
    });
    // Look up customerId from the order if not provided
    let customerId = body.customerId || '';
    if (!customerId && body.orderId) {
      const order = await queryOne<{ customerId: string }>('SELECT "customerId" FROM "order" WHERE "orderId" = $1', [body.orderId]);
      if (order) {
        customerId = order.customerId;
      }
    }
    const payload = {
      ...body,
      returnType: body.returnType || 'refund',
      returnReason,
      items,
      customerId,
    };
    const result = await createReturnRequestUseCase.execute(payload as Parameters<typeof createReturnRequestUseCase.execute>[0]);
    res.status(201).json({ success: true, data: result.toJSON() });
  }

  async approveReturn(
    req: HttpRequest<{ returnId: string }, Record<string, never>, { rmaNumber?: string }>,
    res: HttpResponse,
  ): Promise<void> {
    const result = await approveReturnRequestUseCase.execute(req.params.returnId, req.body?.rmaNumber);
    res.json({ success: true, data: result.toJSON() });
  }

  async denyReturn(req: HttpRequest<{ returnId: string }, Record<string, never>, { reason?: string }>, res: HttpResponse): Promise<void> {
    const result = await denyReturnRequestUseCase.execute(req.params.returnId, req.body?.reason);
    res.json({ success: true, data: result.toJSON() });
  }

  async markInTransit(
    req: HttpRequest<{ returnId: string }, Record<string, never>, { trackingNumber?: string; trackingUrl?: string }>,
    res: HttpResponse,
  ): Promise<void> {
    const result = await markReturnInTransitUseCase.execute(req.params.returnId, req.body?.trackingNumber, req.body?.trackingUrl);
    res.json({ success: true, data: result.toJSON() });
  }

  async markReceived(req: HttpRequest<{ returnId: string }>, res: HttpResponse): Promise<void> {
    const result = await markReturnReceivedUseCase.execute(req.params.returnId);
    res.json({ success: true, data: result.toJSON() });
  }

  async completeInspection(
    req: HttpRequest<
      { returnId: string },
      Record<string, never>,
      { passedItems?: Record<string, unknown>; failedItems?: Record<string, unknown> }
    >,
    res: HttpResponse,
  ): Promise<void> {
    const result = await completeReturnInspectionUseCase.execute(req.params.returnId, req.body?.passedItems, req.body?.failedItems);
    res.json({ success: true, data: result.toJSON() });
  }

  async completeReturn(req: HttpRequest<{ returnId: string }>, res: HttpResponse): Promise<void> {
    const result = await completeReturnRequestUseCase.execute(req.params.returnId);
    res.json({ success: true, data: result.toJSON() });
  }

  async cancelReturn(req: HttpRequest<{ returnId: string }, Record<string, never>, { reason?: string }>, res: HttpResponse): Promise<void> {
    const result = await cancelReturnRequestUseCase.execute(req.params.returnId, req.body?.reason);
    res.json({ success: true, data: result.toJSON() });
  }

  async getStoreCreditBalance(req: HttpRequest, res: HttpResponse): Promise<void> {
    const customerId = (req.query.customerId as string) || '';
    if (!customerId) {
      res.json({ success: true, data: { customerId: '', balanceCents: 0, currency: 'USD' } });
      return;
    }
    const balanceCents = await getStoreCreditBalanceUseCase.execute(customerId);
    res.json({ success: true, data: balanceCents });
  }

  async getStoreCreditLedger(req: HttpRequest, res: HttpResponse): Promise<void> {
    const customerId = (req.query.customerId as string) || '';
    if (!customerId) {
      res.json({ success: true, data: [] });
      return;
    }
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const ledger = await getStoreCreditLedgerUseCase.execute(customerId, limit);
    res.json({ success: true, data: ledger.map(e => e.toJSON()) });
  }

  async debitStoreCredit(
    req: HttpRequest<
      Record<string, never>,
      Record<string, never>,
      {
        customerId: string;
        amountCents: number;
        referenceType?: string;
        referenceId?: string;
        reason?: string;
      }
    >,
    res: HttpResponse,
  ): Promise<void> {
    const result = await debitStoreCreditUseCase.execute(req.body as Parameters<typeof debitStoreCreditUseCase.execute>[0]);
    res.json({ success: true, data: result.toJSON() });
  }
}

export default new ReturnController();
