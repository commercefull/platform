import { ReturnRequest } from '../../domain/entities/ReturnRequest';
import { StoreCreditLedgerEntry } from '../../domain/entities/StoreCredit';
import { ReturnNotFoundError } from '../../domain/errors/ReturnErrors';
import type { ReturnRequestRepository, StoreCreditRepository } from '../../domain/repositories/ReturnRepository';
import { eventBus } from '../../../../libs/events/eventBus';
import { logger } from '../../../../libs/logger';

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

