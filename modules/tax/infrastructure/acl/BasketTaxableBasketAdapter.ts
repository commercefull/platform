/**
 * BasketTaxableBasketAdapter
 *
 * ACL adapter implementing tax's TaxableBasketPort.
 * Translates basket's BasketRepository into tax's
 * TaxableBasket vocabulary.
 *
 * Only this adapter may import from basket's infrastructure.
 */

import { TaxableBasketPort, TaxableBasket } from '../../application/ports/TaxableBasketPort';
import type basketRepo from '../../../basket/infrastructure/repositories/BasketRepository';

export class BasketTaxableBasketAdapter implements TaxableBasketPort {
  constructor(private readonly baskets: Pick<typeof basketRepo, 'findById'>) {}

  async findById(basketId: string): Promise<TaxableBasket | null> {
    const basket = await this.baskets.findById(basketId);
    if (!basket) return null;

    return {
      basketId,
      items: (basket.items || []).map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.unitPrice.amount,
      })),
      subtotal: basket.subtotal.amount,
    };
  }
}
