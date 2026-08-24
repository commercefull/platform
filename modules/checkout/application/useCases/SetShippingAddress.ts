/**
 * Set Shipping Address Use Case
 * Sets the shipping address for a checkout session
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { BasketSnapshotPort } from '../../application/ports/BasketSnapshotPort';
import { TaxQuotePort } from '../../application/ports/TaxQuotePort';
import { PromotionQuotePort } from '../../application/ports/PromotionQuotePort';
import { Address } from '../../domain/valueObjects/Address';
import { Money } from '../../../../libs/money';
import { CheckoutResponse, mapCheckoutToResponse } from './InitiateCheckout';
import { eventBus } from '../../../../libs/events/eventBus';
import { BadRequestError, NotFoundError } from '../../../../libs/errors';

// ============================================================================
// Command
// ============================================================================

export class SetShippingAddressCommand {
  constructor(
    public readonly checkoutId: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly addressLine1: string,
    public readonly city: string,
    public readonly postalCode: string,
    public readonly country: string,
    public readonly company?: string,
    public readonly addressLine2?: string,
    public readonly region?: string,
    public readonly phone?: string,
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class SetShippingAddressUseCase {
  constructor(
    private readonly checkoutRepository: CheckoutRepository,
    private readonly basketSnapshotPort?: BasketSnapshotPort,
    private readonly taxQuotePort?: TaxQuotePort,
    private readonly promotionQuotePort?: PromotionQuotePort,
  ) {}

  async execute(command: SetShippingAddressCommand): Promise<CheckoutResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new NotFoundError('Checkout session not found');
    }

    const validation = await this.checkoutRepository.validateShippingAddress({
      firstName: command.firstName,
      lastName: command.lastName,
      addressLine1: command.addressLine1,
      city: command.city,
      postalCode: command.postalCode,
      country: command.country,
    });

    if (!validation.valid) {
      throw new BadRequestError(`Invalid address: ${validation.errors.join(', ')}`);
    }

    const address = Address.create({
      firstName: command.firstName,
      lastName: command.lastName,
      company: command.company,
      addressLine1: command.addressLine1,
      addressLine2: command.addressLine2,
      city: command.city,
      region: command.region,
      postalCode: command.postalCode,
      country: command.country,
      phone: command.phone,
    });

    session.setShippingAddress(address);

    let taxAmount: number;
    try {
      let taxableShipping = session.shippingAmount.amount;
      let applyDiscountBeforeTax = false;
      try {
        if (this.taxQuotePort) {
          const settings = await this.taxQuotePort.getTaxSettings('default');
          if (settings) {
            applyDiscountBeforeTax = settings.applyDiscountBeforeTax;
            if (!settings.applyTaxToShipping) {
              taxableShipping = 0;
            }
          }
        }
      } catch {
        // Tax settings lookup is best-effort
      }

      const items = await this.getTaxLineItems(session);
      if (this.taxQuotePort) {
        const taxResult = await this.taxQuotePort.calculateTax({
          items: items.map(item => ({
            ...item,
            unitPrice: applyDiscountBeforeTax && session.discountAmount.amount > 0
              ? Math.max(0, item.unitPrice - (session.discountAmount.amount / items.length))
              : item.unitPrice,
          })),
          shippingAddress: {
            country: command.country,
            region: command.region,
            postalCode: command.postalCode,
            city: command.city,
          },
          shippingAmount: taxableShipping,
          customerId: session.customerId,
        });
        taxAmount = taxResult.success ? taxResult.taxAmount : 0;
      } else {
        taxAmount = 0;
      }
    } catch {
      taxAmount = await this.checkoutRepository.calculateTax(session.subtotal.amount, session.shippingAmount.amount, {
        country: command.country,
        region: command.region,
        postalCode: command.postalCode,
      });
    }
    session.updateAmounts(session.subtotal, Money.create(taxAmount, session.subtotal.currency));

    // Evaluate auto-applied promotions
    await this.evaluatePromotions(session);

    await this.checkoutRepository.save(session);

    eventBus.emit('checkout.updated', {
      checkoutId: session.id,
      field: 'shippingAddress',
      country: command.country,
      postalCode: command.postalCode,
    });

    return mapCheckoutToResponse(session);
  }

  private async getTaxLineItems(session: CheckoutSessionLike): Promise<Array<{ productId: string; name: string; quantity: number; unitPrice: number; taxCategoryId?: string; taxable?: boolean }>> {
    if (!this.basketSnapshotPort) {
      return [{ productId: '_subtotal', name: 'Subtotal', quantity: 1, unitPrice: session.subtotal.amount }];
    }
    try {
      const basket = await this.basketSnapshotPort.getSnapshot(session.basketId);
      if (!basket) {
        return [{ productId: '_subtotal', name: 'Subtotal', quantity: 1, unitPrice: session.subtotal.amount }];
      }
      return basket.items.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice?.amount ?? 0,
      }));
    } catch {
      return [{ productId: '_subtotal', name: 'Subtotal', quantity: 1, unitPrice: session.subtotal.amount }];
    }
  }

  private async evaluatePromotions(session: CheckoutSessionLike): Promise<void> {
    if (!this.basketSnapshotPort || !this.promotionQuotePort) return;
    try {
      const basket = await this.basketSnapshotPort.getSnapshot(session.basketId);
      if (!basket) return;
      const promoResult = await this.promotionQuotePort.evaluatePromotions({
        items: basket.items.map(item => ({
          productId: item.productId,
          productVariantId: item.productVariantId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice?.amount ?? 0,
          isDigital: item.isDigital,
        })),
        subtotal: session.subtotal.amount,
        shippingAmount: session.shippingAmount?.amount ?? 0,
        customerId: session.customerId,
        currency: session.subtotal.currency ?? 'USD',
        couponCode: session.couponCode,
      });
      if (!session.couponCode && promoResult.totalDiscountAmount > 0) {
        session.applyCoupon('AUTO_PROMOTION', Money.create(promoResult.totalDiscountAmount, session.subtotal.currency ?? 'USD'));
      }
    } catch {
      // Promotion evaluation is best-effort
    }
  }
}

interface CheckoutSessionLike {
  basketId: string;
  subtotal: { amount: number; currency?: string };
  shippingAmount?: { amount: number };
  customerId?: string;
  couponCode?: string;
  applyCoupon(code: string, discount: Money): void;
}
