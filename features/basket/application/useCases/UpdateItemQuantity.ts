/**
 * Update Item Quantity Use Case
 * Updates the quantity of an item in a basket
 */

import { BasketRepository } from '../../domain/repositories/BasketRepository';
import { eventBus } from '../../../../libs/events/eventBus';
import { BasketResponse } from './GetOrCreateBasket';

// ============================================================================
// Command
// ============================================================================

export class UpdateItemQuantityCommand {
  constructor(
    public readonly basketId: string,
    public readonly basketItemId: string,
    public readonly quantity: number
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class UpdateItemQuantityUseCase {
  constructor(private readonly basketRepository: BasketRepository) {}

  async execute(command: UpdateItemQuantityCommand): Promise<BasketResponse> {
    const basket = await this.basketRepository.findById(command.basketId);
    if (!basket) {
      throw new Error('Basket not found');
    }

    const item = basket.findItem(command.basketItemId);
    if (!item) {
      throw new Error('Item not found in basket');
    }

    if (command.quantity <= 0) {
      basket.removeItem(command.basketItemId);
      await this.basketRepository.removeItem(command.basketItemId);

      eventBus.emit('basket.item_removed', {
        basketId: command.basketId,
        basketItemId: command.basketItemId
      });
    } else {
      item.updateQuantity(command.quantity);
      await this.basketRepository.updateItem(item);

      eventBus.emit('basket.item_updated', {
        basketId: command.basketId,
        basketItemId: command.basketItemId,
        quantity: command.quantity
      });
    }

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
