/**
 * Remove Item Use Case
 * Removes an item from a basket
 */

import { BasketRepository } from '../../domain/repositories/BasketRepository';
import { eventBus } from '../../../../libs/events/eventBus';
import { BasketResponse } from './GetOrCreateBasket';

// ============================================================================
// Command
// ============================================================================

export class RemoveItemCommand {
  constructor(
    public readonly basketId: string,
    public readonly basketItemId: string
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class RemoveItemUseCase {
  constructor(private readonly basketRepository: BasketRepository) {}

  async execute(command: RemoveItemCommand): Promise<BasketResponse> {
    const basket = await this.basketRepository.findById(command.basketId);
    if (!basket) {
      throw new Error('Basket not found');
    }

    const item = basket.findItem(command.basketItemId);
    if (!item) {
      throw new Error('Item not found in basket');
    }

    await this.basketRepository.removeItem(command.basketItemId);

    eventBus.emit('basket.item_removed', {
      basketId: command.basketId,
      basketItemId: command.basketItemId,
      productId: item.productId
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
