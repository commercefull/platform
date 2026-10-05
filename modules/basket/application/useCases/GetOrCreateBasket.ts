/**
 * Get Or Create Basket Use Case
 * Retrieves existing basket or creates a new one for customer/session
 */

import { generateUUID } from '../../../../libs/uuid';
import { BasketRepository } from '../../domain/repositories/BasketRepository';
import { Basket } from '../../domain/entities/Basket';
import { BasketValidationError } from '../../domain/errors/BasketErrors';
import type { StoreCurrencyPort } from '../ports/StoreCurrencyPort';
import type { StoreChannelPort } from '../ports/StoreChannelPort';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class GetOrCreateBasketCommand {
  constructor(
    public readonly customerId?: string,
    public readonly sessionId?: string,
    public readonly currency?: string,
    public readonly storeId?: string,
    public readonly channelId?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface BasketResponse {
  basketId: string;
  customerId?: string;
  sessionId?: string;
  storeId?: string;
  channelId?: string;
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
    storeId: basket.storeId,
    channelId: basket.channelId,
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
  constructor(
    private readonly basketRepository: BasketRepository,
    private readonly storeCurrencyPort?: StoreCurrencyPort,
    private readonly storeChannelPort?: StoreChannelPort,
  ) {}

  async execute(command: GetOrCreateBasketCommand): Promise<BasketResponse> {
    if (command.channelId && !command.storeId) {
      throw new BasketValidationError('A sales channel requires a store context');
    }
    if (command.channelId && command.storeId && this.storeChannelPort) {
      const assigned = await this.storeChannelPort.isAssigned(command.storeId, command.channelId);
      if (!assigned) throw new BasketValidationError('Sales channel is not active for this store');
    }
    let basket = await this.basketRepository.findActiveBasket(command.customerId, command.sessionId, command.storeId, command.channelId);
    let isNew = false;

    if (!basket) {
      // Resolve the basket currency against the store's supported currencies
      // when a store context is present.
      let currency = command.currency;
      if (command.storeId && this.storeCurrencyPort) {
        if (currency) {
          const supported = await this.storeCurrencyPort.isSupported(command.storeId, currency);
          if (!supported) {
            throw new BasketValidationError(`Currency '${currency}' is not supported by this store`);
          }
        } else {
          currency = (await this.storeCurrencyPort.getDefaultCode(command.storeId)) ?? undefined;
        }
      }

      basket = Basket.create({
        basketId: generateUUID(),
        customerId: command.customerId,
        sessionId: command.sessionId,
        storeId: command.storeId,
        channelId: command.channelId,
        currency: currency || 'USD',
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
