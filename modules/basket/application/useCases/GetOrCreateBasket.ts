/**
 * Get Or Create Basket Use Case
 * Retrieves existing basket or creates a new one for customer/session
 */

import { generateUUID } from '../../../../libs/uuid';
import { BasketRepository } from '../../domain/repositories/BasketRepository';
import { Basket } from '../../domain/entities/Basket';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class GetOrCreateBasketCommand {
  constructor(
    public readonly customerId?: string,
    public readonly sessionId?: string,
    public readonly currency: string = 'USD',
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface BasketResponse {
  basketId: string;
  customerId?: string;
  sessionId?: string;
  status: string;
  currency: string;
  items: Array<{
    basketItemId: string;
    productId: string;
    productVariantId?: string;
    sku: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
    imageUrl?: string;
    isGift: boolean;
  }>;
  itemCount: number;
  subtotalCents: number;
  createdAt: string;
  updatedAt: string;
}

function mapBasketToResponse(basket: Basket): BasketResponse {
  return {
    basketId: basket.basketId,
    customerId: basket.customerId,
    sessionId: basket.sessionId,
    status: basket.status,
    currency: basket.currency,
    items: basket.items.map(item => ({
      basketItemId: item.basketItemId,
      productId: item.productId,
      productVariantId: item.productVariantId,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unitPriceCents: item.unitPrice.cents,
      lineTotalCents: item.lineTotal.cents,
      imageUrl: item.imageUrl,
      isGift: item.isGift,
    })),
    itemCount: basket.itemCount,
    subtotalCents: basket.subtotal.cents,
    createdAt: basket.createdAt.toISOString(),
    updatedAt: basket.updatedAt.toISOString(),
  };
}

// ============================================================================
// Use Case
// ============================================================================

export class GetOrCreateBasketUseCase {
  constructor(private readonly basketRepository: BasketRepository) {}

  async execute(command: GetOrCreateBasketCommand): Promise<BasketResponse> {
    let basket = await this.basketRepository.findActiveBasket(command.customerId, command.sessionId);
    let isNew = false;

    if (!basket) {
      basket = Basket.create({
        basketId: generateUUID(),
        customerId: command.customerId,
        sessionId: command.sessionId,
        currency: command.currency,
      });

      await this.basketRepository.save(basket);
      isNew = true;

      eventBus.emit('basket.created', {
        basketId: basket.basketId,
        customerId: command.customerId,
        sessionId: command.sessionId,
      });
    }

    const response = mapBasketToResponse(basket);
    (response as { isNew?: boolean }).isNew = isNew;
    return response;
  }
}
