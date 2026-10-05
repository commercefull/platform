/**
 * Update Channel Session Use Case
 *
 * ACP updateCheckoutSession: applies the surface's desired state —
 * items, fulfillment address, selected fulfillment option, buyer —
 * and returns refreshed authoritative totals.
 */

import type { ChannelSessionRepository } from '../../domain/repositories/ChannelSessionRepository';
import type { ChannelCatalogPort } from '../ports/ChannelCatalogPort';
import type { ChannelCheckoutPort } from '../ports/ChannelCheckoutPort';
import { ChannelCatalogError, ChannelSessionNotFoundError, ChannelSessionNotMutableError } from '../../domain/errors/AgenticCheckoutErrors';
import { toAcpSession, type AcpCheckoutSession } from '../services/CheckoutSessionTranslator';
import { eventBus } from '../../../../libs/events/eventBus';

export class UpdateChannelSessionCommand {
  constructor(
    public readonly channelSessionId: string,
    public readonly integrationId: string,
    public readonly items?: Array<{ id: string; quantity: number }>,
    public readonly buyer?: { first_name?: string; last_name?: string; email?: string; phone?: string },
    public readonly fulfillmentDetails?: {
      email?: string;
      phone?: string;
      address?: {
        line_one?: string;
        line_two?: string;
        city?: string;
        region?: string;
        country?: string;
        postal_code?: string;
      };
    },
    public readonly fulfillmentOptionId?: string,
    public readonly affiliateAttribution?: { first_touch?: Record<string, unknown>; last_touch?: Record<string, unknown> },
  ) {}
}

export class UpdateChannelSessionUseCase {
  constructor(
    private readonly channelSessionRepository: ChannelSessionRepository,
    private readonly catalog: ChannelCatalogPort,
    private readonly checkout: ChannelCheckoutPort,
  ) {}

  async execute(command: UpdateChannelSessionCommand): Promise<AcpCheckoutSession> {
    const session = await this.channelSessionRepository.findById(command.channelSessionId);
    if (!session || session.integrationId !== command.integrationId) {
      throw new ChannelSessionNotFoundError(command.channelSessionId);
    }
    if (!session.isMutable) {
      throw new ChannelSessionNotMutableError(session.channelSessionId, session.effectiveStatus);
    }
    if (!session.checkoutId || !session.basketId) {
      throw new ChannelSessionNotFoundError(command.channelSessionId);
    }

    if (command.items) {
      await this.applyItems(session.storeId, session.basketId, command.items);
    }

    let checkout = await this.checkout.getCheckout(session.checkoutId);

    const address = command.fulfillmentDetails?.address;
    if (address?.line_one && address.city && address.country) {
      checkout = await this.checkout.setShippingAddress(session.checkoutId, {
        firstName: command.buyer?.first_name ?? session.buyer?.firstName ?? '',
        lastName: command.buyer?.last_name ?? session.buyer?.lastName ?? '',
        lineOne: address.line_one,
        lineTwo: address.line_two,
        city: address.city,
        region: address.region,
        country: address.country,
        postalCode: address.postal_code ?? '',
        phone: command.fulfillmentDetails?.phone ?? session.buyer?.phone,
      });
      session.setFulfillmentDetails({
        email: command.fulfillmentDetails?.email,
        phone: command.fulfillmentDetails?.phone,
        address: {
          lineOne: address.line_one,
          lineTwo: address.line_two,
          city: address.city,
          region: address.region,
          country: address.country,
          postalCode: address.postal_code,
        },
      });
    }

    if (command.fulfillmentOptionId) {
      checkout = await this.checkout.setShippingMethod(session.checkoutId, command.fulfillmentOptionId);
    }

    if (command.buyer) {
      session.setBuyer({
        firstName: command.buyer.first_name,
        lastName: command.buyer.last_name,
        email: command.buyer.email,
        phone: command.buyer.phone,
      });
    }

    if (command.affiliateAttribution) {
      session.setAttribution({
        firstTouch: command.affiliateAttribution.first_touch,
        lastTouch: command.affiliateAttribution.last_touch,
      });
    }

    await this.channelSessionRepository.save(session);

    const basket = await this.checkout.getBasket(session.basketId);
    const shippingOptions = checkout?.shippingAddress ? await this.checkout.getShippingOptions(session.checkoutId).catch(() => []) : [];

    eventBus.emit('checkout.updated', { checkoutId: session.checkoutId, field: 'channelSession' });

    return toAcpSession({
      session,
      checkout,
      basketItems: basket?.items ?? [],
      shippingOptions,
    });
  }

  private async applyItems(storeId: string, basketId: string, desired: Array<{ id: string; quantity: number }>): Promise<void> {
    const basket = await this.checkout.getBasket(basketId);
    // The basket carries the session's sales channel — channel-scoped
    // assortment entries apply to channel sessions, not to plain store ones.
    const products = await this.catalog.findProducts(
      storeId,
      desired.map(i => i.id),
      basket?.channelId,
    );
    const missing = desired.map(i => i.id).filter(id => !products.some(p => p.productId === id || p.productVariantId === id));
    if (missing.length > 0) {
      throw new ChannelCatalogError(`Items not purchasable on this channel: ${missing.join(', ')}`);
    }

    const current = basket?.items ?? [];

    for (const wanted of desired) {
      const product = products.find(p => p.productId === wanted.id || p.productVariantId === wanted.id);
      if (!product) continue;
      const existing = current.find(i => i.productId === product.productId && i.productVariantId === product.productVariantId);
      if (existing) {
        if (existing.quantity !== wanted.quantity) {
          await this.checkout.updateItemQuantity(basketId, existing.basketItemId, wanted.quantity);
        }
      } else {
        await this.checkout.addItem(basketId, {
          productId: product.productId,
          productVariantId: product.productVariantId,
          sku: product.sku ?? '',
          name: product.name,
          quantity: wanted.quantity,
          imageUrl: product.imageUrl,
        });
      }
    }

    for (const existing of current) {
      const stillWanted = desired.some(d => {
        const p = products.find(p => p.productId === d.id || p.productVariantId === d.id);
        return p && p.productId === existing.productId && p.productVariantId === existing.productVariantId;
      });
      if (!stillWanted) {
        await this.checkout.removeItem(basketId, existing.basketItemId);
      }
    }
  }
}
