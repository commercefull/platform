/**
 * Add Item Use Case
 * Adds an item to a basket
 */

import { generateUUID } from '../../../../libs/uuid';
import { BasketRepository } from '../../domain/repositories/BasketRepository';
import { Basket } from '../../domain/entities/Basket';
import { BasketItem } from '../../domain/entities/BasketItem';
import { Money } from '../../domain/valueObjects/Money';
import { BasketNotFoundError, BasketValidationError } from '../../domain/errors/BasketErrors';
import { eventBus } from '../../../../libs/events/eventBus';
import { BasketResponse } from './GetOrCreateBasket';
import type { ProductPricePort } from '../ports/ProductPricePort';

// ============================================================================
// Command
// ============================================================================

export class AddItemCommand {
  constructor(
    public readonly basketId: string,
    public readonly productId: string,
    public readonly sku: string,
    public readonly name: string,
    public readonly quantity: number,
    public readonly productVariantId?: string,
    public readonly imageUrl?: string,
    public readonly attributes?: Record<string, unknown>,
    public readonly itemType: 'physical' | 'digital' | 'subscription' | 'service' = 'physical',
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class AddItemUseCase {
  constructor(
    private readonly basketRepository: BasketRepository,
    private readonly productPricePort: ProductPricePort,
  ) {}

  async execute(command: AddItemCommand): Promise<BasketResponse> {
    if (command.quantity < 1) {
      throw new BasketValidationError('Quantity must be at least 1');
    }

    const basket = await this.basketRepository.findById(command.basketId);
    if (!basket) {
      throw new BasketNotFoundError(command.basketId);
    }

    const existingItem = basket.findItemByProduct(command.productId, command.productVariantId);
    let unitPriceCents: number | undefined;

    if (existingItem) {
      existingItem.incrementQuantity(command.quantity);
      unitPriceCents = existingItem.unitPrice.cents;
      await this.basketRepository.updateItem(existingItem);
    } else {
      // The sellable price comes from the pricing module — never from the client
      const price = await this.productPricePort.getPrice(
        command.productId,
        command.productVariantId,
        basket.currency,
        command.quantity,
      );
      if (!price) {
        throw new BasketValidationError(`Product ${command.productId} has no price and cannot be purchased`);
      }

      unitPriceCents = price.unitPriceCents;
      const newItem = BasketItem.create({
        basketItemId: generateUUID(),
        basketId: command.basketId,
        productId: command.productId,
        productVariantId: command.productVariantId,
        sku: command.sku,
        name: command.name,
        quantity: command.quantity,
        unitPrice: Money.fromCents(price.unitPriceCents, price.currency),
        imageUrl: command.imageUrl,
        attributes: command.attributes,
        itemType: command.itemType,
        isGift: false,
      });

      basket.addItem(newItem);
      await this.basketRepository.addItem(command.basketId, newItem);
    }

    eventBus.emit('basket.item_added', {
      basketId: command.basketId,
      productId: command.productId,
      productVariantId: command.productVariantId,
      quantity: command.quantity,
      unitPriceCents,
    });

    const updatedBasket = await this.basketRepository.findById(command.basketId);
    if (!updatedBasket) {
      throw new BasketNotFoundError(command.basketId);
    }
    return this.mapToResponse(updatedBasket);
  }

  private mapToResponse(basket: Basket): BasketResponse {
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
}
