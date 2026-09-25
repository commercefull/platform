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

    let taxAmountCents: number;
    let taxIncludedInSubtotal = false;
    try {
      let taxableShippingCents = session.shippingAmount.cents;
      let applyDiscountBeforeTax = false;
      let pricesIncludeTax = false;
      try {
        if (this.taxQuotePort) {
          const settings = await this.taxQuotePort.getTaxSettings('default');
          if (settings) {
            applyDiscountBeforeTax = settings.applyDiscountBeforeTax;
            pricesIncludeTax = settings.pricesIncludeTax;
            if (!settings.applyTaxToShipping) {
              taxableShippingCents = 0;
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
            unitPriceCents:
              applyDiscountBeforeTax && session.discountAmount.cents > 0
                ? Math.max(0, Math.round(item.unitPriceCents - session.discountAmount.cents / items.length))
                : item.unitPriceCents,
          })),
          shippingAddress: {
            country: command.country,
            region: command.region,
            postalCode: command.postalCode,
            city: command.city,
          },
          shippingAmountCents: taxableShippingCents,
          customerId: session.customerId,
          pricesIncludeTax,
        });
        taxAmountCents = taxResult.success ? taxResult.taxAmountCents : 0;
        taxIncludedInSubtotal = taxResult.success && taxResult.taxIncludedInSubtotal === true;
      } else {
        taxAmountCents = 0;
      }
    } catch {
      taxAmountCents = 0;
    }
    session.updateAmounts(
      session.subtotal,
      Money.fromCents(taxAmountCents, session.subtotal.currency),
      taxIncludedInSubtotal,
    );

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

  private async getTaxLineItems(
    session: CheckoutSessionLike,
  ): Promise<Array<{ productId: string; name: string; quantity: number; unitPriceCents: number; taxCategoryId?: string; taxable?: boolean }>> {
    if (!this.basketSnapshotPort) {
      return [{ productId: '_subtotal', name: 'Subtotal', quantity: 1, unitPriceCents: session.subtotal.cents }];
    }
    try {
      const basket = await this.basketSnapshotPort.getSnapshot(session.basketId);
      if (!basket) {
        return [{ productId: '_subtotal', name: 'Subtotal', quantity: 1, unitPriceCents: session.subtotal.cents }];
      }
      return basket.items.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPriceCents: item.unitPrice?.cents ?? 0,
        taxCategoryId: item.taxCategoryId,
        taxable: item.taxable,
      }));
    } catch {
      return [{ productId: '_subtotal', name: 'Subtotal', quantity: 1, unitPriceCents: session.subtotal.cents }];
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
          unitPriceCents: item.unitPrice?.cents ?? 0,
          isDigital: item.isDigital,
        })),
        subtotalCents: session.subtotal.cents,
        shippingAmountCents: session.shippingAmount?.cents ?? 0,
        customerId: session.customerId,
        currency: session.subtotal.currency ?? 'USD',
        couponCode: session.couponCode,
      });
      if (!session.couponCode && promoResult.totalDiscountAmountCents > 0) {
        session.applyCoupon('AUTO_PROMOTION', Money.fromCents(promoResult.totalDiscountAmountCents, session.subtotal.currency ?? 'USD'));
      }
    } catch {
      // Promotion evaluation is best-effort
    }
  }
}

interface CheckoutSessionLike {
  basketId: string;
  subtotal: { cents: number; currency?: string };
  shippingAmount?: { cents: number };
  customerId?: string;
  couponCode?: string;
  applyCoupon(code: string, discount: Money): void;
}
