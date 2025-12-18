/**
 * Assign Basket To Customer Use Case
 * Assigns a session basket to a customer (typically when guest logs in)
 */

import { BasketRepository } from '../../domain/repositories/BasketRepository';
import { eventBus } from '../../../../libs/events/eventBus';
import { BasketResponse } from './GetOrCreateBasket';

// ============================================================================
// Command
// ============================================================================

export class AssignBasketToCustomerCommand {
  constructor(
    public readonly basketId: string,
    public readonly customerId: string
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class AssignBasketToCustomerUseCase {
  constructor(private readonly basketRepository: BasketRepository) {}

  async execute(command: AssignBasketToCustomerCommand): Promise<BasketResponse> {
    const basket = await this.basketRepository.findById(command.basketId);
    if (!basket) {
      throw new Error('Basket not found');
    }

    const previousSessionId = basket.sessionId;

    basket.assignToCustomer(command.customerId);
    await this.basketRepository.save(basket);

    eventBus.emit('basket.assigned_to_customer', {
      basketId: command.basketId,
      customerId: command.customerId,
      previousSessionId
    });

    const updatedBasket = await this.basketRepository.findById(command.basketId);
    return this.mapToResponse(updatedBasket!);
  }

  private mapToResponse(basket: any): BasketResponse {
    return {
      basketId: basket.basketId,
      customerId: basket.customerId,
      sessionId: basket.sessionId,
      status: basket.status,
      currency: basket.currency,
      items: basket.items.map((item: any) => ({
        basketItemId: item.basketItemId,
        productId: item.productId,
        productVariantId: item.productVariantId,
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice.amount,
        lineTotal: item.lineTotal.amount,
        imageUrl: item.imageUrl,
        isGift: item.isGift
      })),
      itemCount: basket.itemCount,
      subtotal: basket.subtotal.amount,
      createdAt: basket.createdAt.toISOString(),
      updatedAt: basket.updatedAt.toISOString()
    };
  }
}
