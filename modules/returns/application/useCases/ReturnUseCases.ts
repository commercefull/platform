import { ReturnRequest } from '../../domain/entities/ReturnRequest';
import type { ReturnType, ReturnCarrier, ReturnItemReason, ReturnItemCondition, WarrantyStatus } from '../../domain/entities/ReturnRequest';
import { StoreCreditLedgerEntry } from '../../domain/entities/StoreCredit';
import { InvalidReturnRequestError, ReturnNotFoundError, InsufficientStoreCreditError } from '../../domain/errors/ReturnErrors';
import type { ReturnRequestRepository, StoreCreditRepository } from '../../domain/repositories/ReturnRepository';
import { eventBus } from '../../../../libs/events/eventBus';
import { logger } from '../../../../libs/logger';

export class CreateReturnRequestUseCase {
  constructor(private returnRepo: ReturnRequestRepository) {}

  async execute(params: {
    orderId: string;
    customerId?: string;
    returnType: ReturnType;
    returnReason?: string;
    customerNotes?: string;
    returnCarrier?: ReturnCarrier;
    returnShippingPaid?: boolean;
    requiresInspection?: boolean;
    items: Array<{
      orderItemId: string;
      quantity: number;
      returnReason: ReturnItemReason;
      returnReasonDetail?: string;
      condition: ReturnItemCondition;
      restockItem?: boolean;
      refundAmount?: number;
      exchangeProductId?: string;
      exchangeVariantId?: string;
      notes?: string;
      warrantyStatus?: WarrantyStatus;
    }>;
  }): Promise<ReturnRequest> {
    if (!params.items || params.items.length === 0) {
      throw new InvalidReturnRequestError('At least one return item is required');
    }

    for (const item of params.items) {
      if (item.quantity <= 0) {
        throw new InvalidReturnRequestError(`Item quantity must be positive for item ${item.orderItemId}`);
      }
    }

    const returnRequest = ReturnRequest.create({
      ...params,
      items: params.items.map(item => ({
        ...item,
        restockItem: item.restockItem ?? false,
      })),
    });
    const created = await this.returnRepo.create(returnRequest);

    eventBus.emit('return.created', {
      orderReturnId: created.orderReturnId,
      returnNumber: created.returnNumber,
      orderId: created.orderId,
      customerId: created.customerId,
      returnType: created.returnType,
    });

    logger.info('Return request created', {
      orderReturnId: created.orderReturnId,
      returnNumber: created.returnNumber,
      orderId: created.orderId,
    });

    return created;
  }
}

export class ApproveReturnRequestUseCase {
  constructor(private returnRepo: ReturnRequestRepository) {}

  async execute(returnId: string, rmaNumber?: string): Promise<ReturnRequest> {
    const returnRequest = await this.returnRepo.findById(returnId);
    if (!returnRequest) throw new ReturnNotFoundError(returnId);

    returnRequest.approve(rmaNumber);
    const updated = await this.returnRepo.update(returnRequest);
    if (!updated) throw new ReturnNotFoundError(returnId);

    eventBus.emit('return.approved', {
      orderReturnId: updated.orderReturnId,
      returnNumber: updated.returnNumber,
      orderId: updated.orderId,
      rmaNumber: updated.rmaNumber,
    });

    return updated;
  }
}

export class DenyReturnRequestUseCase {
  constructor(private returnRepo: ReturnRequestRepository) {}

  async execute(returnId: string, reason?: string): Promise<ReturnRequest> {
    const returnRequest = await this.returnRepo.findById(returnId);
    if (!returnRequest) throw new ReturnNotFoundError(returnId);

    returnRequest.deny(reason);
    const updated = await this.returnRepo.update(returnRequest);
    if (!updated) throw new ReturnNotFoundError(returnId);

    eventBus.emit('return.denied', {
      orderReturnId: updated.orderReturnId,
      returnNumber: updated.returnNumber,
      orderId: updated.orderId,
      reason,
    });

    return updated;
  }
}

export class MarkReturnInTransitUseCase {
  constructor(private returnRepo: ReturnRequestRepository) {}

  async execute(returnId: string, trackingNumber?: string, trackingUrl?: string): Promise<ReturnRequest> {
    const returnRequest = await this.returnRepo.findById(returnId);
    if (!returnRequest) throw new ReturnNotFoundError(returnId);

    returnRequest.markInTransit(trackingNumber, trackingUrl);
    const updated = await this.returnRepo.update(returnRequest);
    if (!updated) throw new ReturnNotFoundError(returnId);

    eventBus.emit('return.in_transit', {
      orderReturnId: updated.orderReturnId,
      returnNumber: updated.returnNumber,
      trackingNumber: updated.returnTrackingNumber,
    });

    return updated;
  }
}

export class MarkReturnReceivedUseCase {
  constructor(private returnRepo: ReturnRequestRepository) {}

  async execute(returnId: string): Promise<ReturnRequest> {
    const returnRequest = await this.returnRepo.findById(returnId);
    if (!returnRequest) throw new ReturnNotFoundError(returnId);

    returnRequest.markReceived();
    const updated = await this.returnRepo.update(returnRequest);
    if (!updated) throw new ReturnNotFoundError(returnId);

    eventBus.emit('return.received', {
      orderReturnId: updated.orderReturnId,
      returnNumber: updated.returnNumber,
    });

    return updated;
  }
}

export class CompleteReturnInspectionUseCase {
  constructor(private returnRepo: ReturnRequestRepository) {}

  async execute(returnId: string, passedItems?: Record<string, unknown>, failedItems?: Record<string, unknown>): Promise<ReturnRequest> {
    const returnRequest = await this.returnRepo.findById(returnId);
    if (!returnRequest) throw new ReturnNotFoundError(returnId);

    returnRequest.completeInspection(passedItems, failedItems);
    const updated = await this.returnRepo.update(returnRequest);
    if (!updated) throw new ReturnNotFoundError(returnId);

    eventBus.emit('return.inspected', {
      orderReturnId: updated.orderReturnId,
      returnNumber: updated.returnNumber,
      passedItems,
      failedItems,
    });

    return updated;
  }
}

export class CompleteReturnRequestUseCase {
  constructor(
    private returnRepo: ReturnRequestRepository,
    private storeCreditRepo: StoreCreditRepository,
  ) {}

  async execute(returnId: string): Promise<ReturnRequest> {
    const returnRequest = await this.returnRepo.findById(returnId);
    if (!returnRequest) throw new ReturnNotFoundError(returnId);

    returnRequest.complete();
    const updated = await this.returnRepo.update(returnRequest);
    if (!updated) throw new ReturnNotFoundError(returnId);

    if (updated.returnType === 'storeCredit' && updated.customerId) {
      const balance = await this.storeCreditRepo.getBalance(updated.customerId);
      const creditAmount = updated.totalRefundAmount;
      const newBalance = balance.balance + creditAmount;
      const entry = StoreCreditLedgerEntry.create({
        customerId: updated.customerId,
        entryType: 'credit',
        referenceType: 'return',
        referenceId: updated.orderReturnId,
        amount: creditAmount,
        balanceAfter: newBalance,
        reason: `Store credit from return ${updated.returnNumber}`,
      });
      await this.storeCreditRepo.addEntry(entry);
    }

    eventBus.emit('return.completed', {
      orderReturnId: updated.orderReturnId,
      returnNumber: updated.returnNumber,
      orderId: updated.orderId,
      customerId: updated.customerId,
      returnType: updated.returnType,
      totalRefundAmount: updated.totalRefundAmount,
    });

    logger.info('Return request completed', {
      orderReturnId: updated.orderReturnId,
      returnNumber: updated.returnNumber,
      returnType: updated.returnType,
    });

    return updated;
  }
}

export class CancelReturnRequestUseCase {
  constructor(private returnRepo: ReturnRequestRepository) {}

  async execute(returnId: string, reason?: string): Promise<ReturnRequest> {
    const returnRequest = await this.returnRepo.findById(returnId);
    if (!returnRequest) throw new ReturnNotFoundError(returnId);

    returnRequest.cancel(reason);
    const updated = await this.returnRepo.update(returnRequest);
    if (!updated) throw new ReturnNotFoundError(returnId);

    eventBus.emit('return.cancelled', {
      orderReturnId: updated.orderReturnId,
      returnNumber: updated.returnNumber,
      reason,
    });

    return updated;
  }
}

export class GetReturnRequestUseCase {
  constructor(private returnRepo: ReturnRequestRepository) {}

  async execute(returnId: string): Promise<ReturnRequest> {
    const returnRequest = await this.returnRepo.findById(returnId);
    if (!returnRequest) throw new ReturnNotFoundError(returnId);
    return returnRequest;
  }
}

export class ListReturnRequestsUseCase {
  constructor(private returnRepo: ReturnRequestRepository) {}

  async execute(status?: string, limit?: number, offset?: number): Promise<ReturnRequest[]> {
    if (status) {
      return this.returnRepo.findByStatus(status as never, limit, offset);
    }
    return this.returnRepo.findPending(limit);
  }
}

export class GetStoreCreditBalanceUseCase {
  constructor(private storeCreditRepo: StoreCreditRepository) {}

  async execute(customerId: string) {
    return this.storeCreditRepo.getBalance(customerId);
  }
}

export class GetStoreCreditLedgerUseCase {
  constructor(private storeCreditRepo: StoreCreditRepository) {}

  async execute(customerId: string, limit?: number) {
    return this.storeCreditRepo.getLedger(customerId, limit);
  }
}

export class DebitStoreCreditUseCase {
  constructor(private storeCreditRepo: StoreCreditRepository) {}

  async execute(params: {
    customerId: string;
    amount: number;
    referenceType?: string;
    referenceId?: string;
    reason?: string;
  }): Promise<StoreCreditLedgerEntry> {
    const balance = await this.storeCreditRepo.getBalance(params.customerId);

    if (balance.balance < params.amount) {
      throw new InsufficientStoreCreditError(params.customerId, params.amount, balance.balance);
    }

    const newBalance = balance.balance - params.amount;
    const entry = StoreCreditLedgerEntry.create({
      customerId: params.customerId,
      entryType: 'debit',
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      amount: params.amount,
      balanceAfter: newBalance,
      reason: params.reason ?? 'Store credit debit',
    });

    return this.storeCreditRepo.addEntry(entry);
  }
}
