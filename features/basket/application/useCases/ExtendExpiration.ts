/**
 * Extend Expiration Use Case
 * Extends the expiration date of a basket
 */

import { BasketRepository } from '../../domain/repositories/BasketRepository';
import { eventBus } from '../../../../libs/events/eventBus';
import { BasketResponse } from './GetOrCreateBasket';
import { BasketNotFoundError, InvalidExpirationDaysError } from '../../domain/errors/BasketErrors';

// ============================================================================
// Command
// ============================================================================

export class ExtendExpirationCommand {
  constructor(
    public readonly basketId: string,
    public readonly days: number = 7
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class ExtendExpirationUseCase {
  constructor(private readonly basketRepository: BasketRepository) {}

  async execute(command: ExtendExpirationCommand): Promise<BasketResponse> {
    if (command.days < 1) {
      throw new InvalidExpirationDaysError(command.days);
    }

    const basket = await this.basketRepository.findById(command.basketId);
    if (!basket) {
      throw new BasketNotFoundError(command.basketId);
    }

    basket.extendExpiration(command.days);
    await this.basketRepository.save(basket);

    eventBus.emit('basket.expiration_extended', {
      basketId: command.basketId,
      newExpiresAt: basket.expiresAt?.toISOString(),
      days: command.days
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
