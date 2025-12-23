/**
 * Initiate Checkout Use Case
 * Creates a new checkout session from a basket
 */

import { generateUUID } from '../../../../libs/uuid';
import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { BasketRepository } from '../../../basket/domain/repositories/BasketRepository';
import { CheckoutSession } from '../../domain/entities/CheckoutSession';
import { Money } from '../../../basket/domain/valueObjects/Money';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class InitiateCheckoutCommand {
  constructor(
    public readonly basketId: string,
    public readonly customerId?: string,
    public readonly guestEmail?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface CheckoutResponse {
  checkoutId: string;
  basketId: string;
  customerId?: string;
  guestEmail?: string;
  status: string;
  paymentStatus: string;
  shippingAddress?: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    city: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    city: string;
    postalCode: string;
    country: string;
  };
  shippingMethodId?: string;
  shippingMethodName?: string;
  paymentMethodId?: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  couponCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export function mapCheckoutToResponse(session: CheckoutSession): CheckoutResponse {
  return {
    checkoutId: session.id,
    basketId: session.basketId,
    customerId: session.customerId,
    guestEmail: session.guestEmail,
    status: session.status,
    paymentStatus: session.paymentStatus,
    shippingAddress: session.shippingAddress
      ? {
          firstName: session.shippingAddress.firstName,
          lastName: session.shippingAddress.lastName,
          addressLine1: session.shippingAddress.addressLine1,
          city: session.shippingAddress.city,
          postalCode: session.shippingAddress.postalCode,
          country: session.shippingAddress.country,
        }
      : undefined,
    billingAddress: session.billingAddress
      ? {
          firstName: session.billingAddress.firstName,
          lastName: session.billingAddress.lastName,
          addressLine1: session.billingAddress.addressLine1,
          city: session.billingAddress.city,
          postalCode: session.billingAddress.postalCode,
          country: session.billingAddress.country,
        }
      : undefined,
    shippingMethodId: session.shippingMethodId,
    shippingMethodName: session.shippingMethodName,
    paymentMethodId: session.paymentMethodId,
    subtotal: session.subtotal.amount,
    taxAmount: session.taxAmount.amount,
    shippingAmount: session.shippingAmount.amount,
    discountAmount: session.discountAmount.amount,
    total: session.total.amount,
    currency: session.subtotal.currency,
    couponCode: session.couponCode,
    notes: session.notes,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
  };
}

// ============================================================================
// Use Case
// ============================================================================

export class InitiateCheckoutUseCase {
  constructor(
    private readonly checkoutRepository: CheckoutRepository,
    private readonly basketRepository: BasketRepository,
  ) {}

  async execute(command: InitiateCheckoutCommand): Promise<CheckoutResponse> {
    const basket = await this.basketRepository.findById(command.basketId);
    if (!basket) {
      throw new Error('Basket not found');
    }

    if (basket.isEmpty) {
      throw new Error('Cannot checkout with empty basket');
    }

    let session = await this.checkoutRepository.findByBasketId(command.basketId);

    if (session && session.isActive) {
      session.extendExpiration();
      await this.checkoutRepository.save(session);
      return mapCheckoutToResponse(session);
    }

    session = CheckoutSession.create({
      id: generateUUID(),
      basketId: command.basketId,
      customerId: command.customerId,
      guestEmail: command.guestEmail,
      currency: basket.currency,
    });

    session.updateAmounts(basket.subtotal, Money.zero(basket.currency));

    await this.checkoutRepository.save(session);

    eventBus.emit('checkout.started', {
      checkoutId: session.id,
      basketId: command.basketId,
      customerId: command.customerId,
    });

    return mapCheckoutToResponse(session);
  }
}
