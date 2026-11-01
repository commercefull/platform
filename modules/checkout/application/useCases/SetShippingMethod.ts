/**
 * Set Shipping Method Use Case
 * Sets the shipping method for a checkout session
 */

import { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import { ShippingQuotePort } from '../../application/ports/ShippingQuotePort';
import type { StoreContextPort } from '../../application/ports/StoreContextPort';
import type { BasketSnapshotPort } from '../../application/ports/BasketSnapshotPort';
import { Money } from '../../../../libs/money';
import { CheckoutResponse, mapCheckoutToResponse } from './InitiateCheckout';
import { BadRequestError, NotFoundError } from '../../../../libs/errors';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class SetShippingMethodCommand {
  constructor(
    public readonly checkoutId: string,
    public readonly shippingMethodId: string,
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class SetShippingMethodUseCase {
  constructor(
    private readonly checkoutRepository: CheckoutRepository,
    private readonly shippingQuotePort?: ShippingQuotePort,
    private readonly storeContextPort?: StoreContextPort,
    private readonly basketSnapshotPort?: BasketSnapshotPort,
  ) {}

  async execute(command: SetShippingMethodCommand): Promise<CheckoutResponse> {
    const session = await this.checkoutRepository.findById(command.checkoutId);
    if (!session) {
      throw new NotFoundError('Checkout session not found');
    }

    if (!session.shippingAddress) {
      throw new BadRequestError('Shipping address must be set first');
    }

    if (!this.shippingQuotePort) {
      throw new BadRequestError('Shipping service unavailable');
    }

    const shippingOptions = await this.shippingQuotePort.getShippingOptions({
      basketId: session.basketId,
      shippingAddress: {
        country: session.shippingAddress.country,
        region: session.shippingAddress.region,
        city: session.shippingAddress.city,
        postalCode: session.shippingAddress.postalCode,
      },
      totalValueCents: session.subtotal.cents,
      originCountry: await this.resolveOriginCountry(session),
    });

    if (shippingOptions.length === 0) {
      throw new BadRequestError('No shipping methods available for this address');
    }

    const selectedRate = shippingOptions.find(r => r.methodId === command.shippingMethodId);
    if (!selectedRate) {
      throw new BadRequestError('Invalid shipping method');
    }

    session.setShippingMethod(
      selectedRate.methodId,
      selectedRate.methodName,
      Money.fromCents(selectedRate.amountCents, selectedRate.currency),
    );

    await this.checkoutRepository.save(session);

    eventBus.emit('checkout.updated', {
      checkoutId: session.id,
      field: 'shippingMethod',
      methodId: selectedRate.methodId,
      methodName: selectedRate.methodName,
      amountCents: selectedRate.amountCents,
    });

    return mapCheckoutToResponse(session);
  }

  /** Ship-from country for lane-aware rates — the fulfillment source's country. */
  private async resolveOriginCountry(session: { basketId: string; storeId?: string }): Promise<string | undefined> {
    if (!this.storeContextPort) return undefined;
    try {
      const storeId = session.storeId ?? (await this.basketSnapshotPort?.getSnapshot(session.basketId))?.storeId;
      if (!storeId) return undefined;
      const context = await this.storeContextPort.getStoreContext(storeId);
      return context?.country;
    } catch {
      return undefined;
    }
  }
}
