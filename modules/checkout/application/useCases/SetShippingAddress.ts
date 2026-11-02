/**
 * Set Shipping Address Use Case
 * Sets the shipping address for a checkout session
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { BasketSnapshotPort } from '../../application/ports/BasketSnapshotPort';
import { TaxQuotePort } from '../../application/ports/TaxQuotePort';
import { PromotionQuotePort } from '../../application/ports/PromotionQuotePort';
import type { StoreContextPort } from '../../application/ports/StoreContextPort';
import { Address } from '../../domain/valueObjects/Address';
import { Money } from '../../../../libs/money';
import type { AppliedPromotion } from '../../domain/entities/CheckoutSession';
import { CheckoutResponse, mapCheckoutToResponse } from './InitiateCheckout';
import { eventBus } from '../../../../libs/events/eventBus';
import { BadRequestError, NotFoundError } from '../../../../libs/errors';
export interface SetShippingAddressCommandProps {
  checkoutId: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  city: string;
  /** Optional for countries without postal codes (e.g. AE, HK). */
  postalCode: string | undefined;
  country: string;
  company?: string;
  addressLine2?: string;
  region?: string;
  phone?: string;
}

// ============================================================================
// Command
// ============================================================================

export class SetShippingAddressCommand {
  public readonly checkoutId: string;
  public readonly firstName: string;
  public readonly lastName: string;
  public readonly addressLine1: string;
  public readonly city: string;
  public readonly postalCode: string | undefined;
  public readonly country: string;
  public readonly company?: string;
  public readonly addressLine2?: string;
  public readonly region?: string;
  public readonly phone?: string;

  constructor(props: SetShippingAddressCommandProps) {
    this.checkoutId = props.checkoutId;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.addressLine1 = props.addressLine1;
    this.city = props.city;
    this.postalCode = props.postalCode;
    this.country = props.country;
    this.company = props.company;
    this.addressLine2 = props.addressLine2;
    this.region = props.region;
    this.phone = props.phone;
  }
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
    private readonly storeContextPort?: StoreContextPort,
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

    const tax = await this.calculateSessionTax(session, command);
    session.updateAmounts(
      session.subtotal,
      Money.fromCents(tax.taxAmountCents, session.subtotal.currency),
      tax.taxIncludedInSubtotal,
      tax.taxAddedCents != null ? Money.fromCents(tax.taxAddedCents, session.subtotal.currency) : undefined,
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

  /** Tax-settings flags that shape the tax calculation (best-effort lookup). */
  private async getTaxSettingsFlags(defaultShippingCents: number): Promise<{
    taxableShippingCents: number;
    applyDiscountBeforeTax: boolean;
    pricesIncludeTax: boolean;
  }> {
    const flags = { taxableShippingCents: defaultShippingCents, applyDiscountBeforeTax: false, pricesIncludeTax: false };
    try {
      const settings = this.taxQuotePort ? await this.taxQuotePort.getTaxSettings('default') : null;
      if (settings) {
        flags.applyDiscountBeforeTax = settings.applyDiscountBeforeTax;
        flags.pricesIncludeTax = settings.pricesIncludeTax;
        if (!settings.applyTaxToShipping) {
          flags.taxableShippingCents = 0;
        }
      }
    } catch {
      // Tax settings lookup is best-effort
    }
    return flags;
  }

  /** Recalculate tax for the session; returns zero-tax defaults on any failure. */
  private async calculateSessionTax(
    session: CheckoutSessionLike,
    command: SetShippingAddressCommand,
  ): Promise<{ taxAmountCents: number; taxIncludedInSubtotal: boolean; taxAddedCents?: number }> {
    try {
      const { taxableShippingCents, applyDiscountBeforeTax, pricesIncludeTax } = await this.getTaxSettingsFlags(
        session.shippingAmount.cents,
      );
      if (!this.taxQuotePort) return { taxAmountCents: 0, taxIncludedInSubtotal: false };

      const items = await this.getTaxLineItems(session);
      const storeContext = await this.getStoreContext(session);
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
        vatNumber: session.vatNumber,
        organizationId: storeContext?.organizationId,
        originCountry: storeContext?.country,
      });

      const taxIncludedInSubtotal = taxResult.success && taxResult.taxIncludedInSubtotal === true;
      const taxAmountCents = taxResult.success ? taxResult.taxAmountCents : 0;
      const taxAddedCents =
        taxResult.success && taxResult.taxAddedCents != null ? taxResult.taxAddedCents : taxIncludedInSubtotal ? 0 : taxAmountCents;
      if (taxResult.success) {
        session.setReverseChargeApplied(taxResult.reverseChargeApplied === true);
        session.updateMetadata({
          taxDecision: {
            taxRegime: taxResult.taxRegime,
            taxPolicyVersion: taxResult.taxPolicyVersion,
            decisionRecord: taxResult.decisionRecord,
            lineItems: taxResult.lineItems,
          },
        });
      }
      return { taxAmountCents, taxIncludedInSubtotal, taxAddedCents };
    } catch {
      return { taxAmountCents: 0, taxIncludedInSubtotal: false };
    }
  }

  private async getTaxLineItems(
    session: CheckoutSessionLike,
  ): Promise<
    Array<{ productId: string; name: string; quantity: number; unitPriceCents: number; taxCategoryId?: string; taxable?: boolean }>
  > {
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

  private async getStoreContext(session: CheckoutSessionLike): Promise<{ organizationId?: string; country?: string } | null> {
    if (!this.storeContextPort || !this.basketSnapshotPort) return null;
    try {
      const basket = await this.basketSnapshotPort.getSnapshot(session.basketId);
      if (!basket?.storeId) return null;
      return await this.storeContextPort.getStoreContext(basket.storeId);
    } catch {
      return null;
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
        storeId: basket.storeId,
        channelId: basket.channelId,
        countryCode: session.shippingAddress?.country,
        currency: session.subtotal.currency ?? 'USD',
        couponCode: session.couponCode,
      });
      if (!session.couponCode && promoResult.totalDiscountAmountCents > 0) {
        session.applyPromotions(
          promoResult.appliedPromotions.map(p => ({
            promotionId: p.id,
            name: p.name,
            discountAmountCents: p.amountCents,
          })),
          Money.fromCents(promoResult.totalDiscountAmountCents, session.subtotal.currency ?? 'USD'),
        );
      }
    } catch {
      // Promotion evaluation is best-effort
    }
  }
}

interface CheckoutSessionLike {
  basketId: string;
  subtotal: { cents: number; currency?: string };
  shippingAmount: { cents: number };
  discountAmount: { cents: number };
  customerId?: string;
  couponCode?: string;
  vatNumber?: string;
  shippingAddress?: { country: string };
  applyPromotions(promotions: AppliedPromotion[], discountAmount: Money): void;
  setReverseChargeApplied(applied: boolean): void;
  updateMetadata(metadata: Record<string, unknown>): void;
}
