/**
 * Add Item Use Case
 * Adds an item to a basket
 */

import { generateUUID } from '../../../../libs/uuid';
import { BasketRepository } from '../../domain/repositories/BasketRepository';
import { BasketItem } from '../../domain/entities/BasketItem';
import { Money } from '../../domain/valueObjects/Money';
import { eventBus } from '../../../../libs/events/eventBus';
import { BasketResponse } from './GetOrCreateBasket';

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
    public readonly unitPrice: number,
    public readonly productVariantId?: string,
    public readonly imageUrl?: string,
    public readonly attributes?: Record<string, any>,
    public readonly itemType: 'physical' | 'digital' | 'subscription' | 'service' = 'physical',
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class AddItemUseCase {
  constructor(private readonly basketRepository: BasketRepository) {}

  async execute(command: AddItemCommand): Promise<BasketResponse> {
    const basket = await this.basketRepository.findById(command.basketId);
    if (!basket) {
      throw new Error('Basket not found');
    }

    const existingItem = basket.findItemByProduct(command.productId, command.productVariantId);

    if (existingItem) {
      existingItem.incrementQuantity(command.quantity);
      await this.basketRepository.updateItem(existingItem);
    } else {
      const newItem = BasketItem.create({
        basketItemId: generateUUID(),
        basketId: command.basketId,
        productId: command.productId,
        productVariantId: command.productVariantId,
        sku: command.sku,
        name: command.name,
        quantity: command.quantity,
        unitPrice: Money.create(command.unitPrice, basket.currency),
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
      quantity: command.quantity,
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
