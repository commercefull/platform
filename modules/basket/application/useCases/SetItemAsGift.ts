/**
 * Set Item As Gift Use Case
 * Marks an item in the basket as a gift with optional message
 */

import { BasketRepository } from '../../domain/repositories/BasketRepository';
import { eventBus } from '../../../../libs/events/eventBus';
import { BasketResponse } from './GetOrCreateBasket';

// ============================================================================
// Command
// ============================================================================

export class SetItemAsGiftCommand {
  constructor(
    public readonly basketId: string,
    public readonly basketItemId: string,
    public readonly giftMessage?: string,
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class SetItemAsGiftUseCase {
  constructor(private readonly basketRepository: BasketRepository) {}

  async execute(command: SetItemAsGiftCommand): Promise<BasketResponse> {
    const basket = await this.basketRepository.findById(command.basketId);
    if (!basket) {
      throw new Error('Basket not found');
    }

    const item = basket.findItem(command.basketItemId);
    if (!item) {
      throw new Error('Item not found in basket');
    }

    basket.setItemAsGift(command.basketItemId, command.giftMessage);
    await this.basketRepository.updateItem(item);

    eventBus.emit('basket.item_set_as_gift', {
      basketId: command.basketId,
      basketItemId: command.basketItemId,
      giftMessage: command.giftMessage,
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
        isGift: item.isGift,
      })),
      itemCount: basket.itemCount,
      subtotal: basket.subtotal.amount,
      createdAt: basket.createdAt.toISOString(),
      updatedAt: basket.updatedAt.toISOString(),
    };
  }
}
