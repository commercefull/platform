/**
 * Merge Baskets Use Case
 * Merges a source basket into a target basket (typically when guest logs in)
 */

import { BasketRepository } from '../../domain/repositories/BasketRepository';
import { eventBus } from '../../../../libs/events/eventBus';
import { BasketResponse } from './GetOrCreateBasket';
import { BasketNotFoundError } from '../../domain/errors/BasketErrors';

// ============================================================================
// Command
// ============================================================================

export class MergeBasketsCommand {
  constructor(
    public readonly sourceBasketId: string,
    public readonly targetBasketId: string,
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class MergeBasketsUseCase {
  constructor(private readonly basketRepository: BasketRepository) {}

  async execute(command: MergeBasketsCommand): Promise<BasketResponse> {
    const sourceBasket = await this.basketRepository.findById(command.sourceBasketId);
    if (!sourceBasket) {
      throw new BasketNotFoundError(command.sourceBasketId);
    }

    const targetBasket = await this.basketRepository.findById(command.targetBasketId);
    if (!targetBasket) {
      throw new BasketNotFoundError(command.targetBasketId);
    }

    const itemsMerged = sourceBasket.items.length;

    const mergedBasket = await this.basketRepository.mergeBaskets(command.sourceBasketId, command.targetBasketId);

    eventBus.emit('basket.merged', {
      sourceBasketId: command.sourceBasketId,
      targetBasketId: command.targetBasketId,
      itemsMerged,
    });

    return this.mapToResponse(mergedBasket);
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
