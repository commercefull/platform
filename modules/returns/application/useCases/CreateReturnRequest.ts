import { ReturnRequest } from '../../domain/entities/ReturnRequest';
import type { ReturnType, ReturnCarrier, ReturnItemReason, ReturnItemCondition, WarrantyStatus } from '../../domain/entities/ReturnRequest';
import { InvalidReturnRequestError } from '../../domain/errors/ReturnErrors';
import type { ReturnRequestRepository } from '../../domain/repositories/ReturnRepository';
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

