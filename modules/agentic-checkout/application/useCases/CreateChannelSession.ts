/**
 * Create Channel Session Use Case
 *
 * ACP createCheckoutSession: validates items against the channel store's
 * assortment, builds the basket + checkout internally, and returns the
 * ACP-shaped session response.
 */

import { ChannelSession } from '../../domain/entities/ChannelSession';
import type { ChannelSessionRepository } from '../../domain/repositories/ChannelSessionRepository';
import type { ChannelContext } from '../ports/ChannelResolverPort';
import type { ChannelCatalogPort } from '../ports/ChannelCatalogPort';
import type { ChannelCheckoutPort } from '../ports/ChannelCheckoutPort';
import { ChannelCatalogError } from '../../domain/errors/AgenticCheckoutErrors';
import { toAcpSession, type AcpCheckoutSession } from '../services/CheckoutSessionTranslator';
import { eventBus } from '../../../../libs/events/eventBus';

export interface CreateChannelSessionItem {
  /** Product id (or productVariantId when it matches the channel's feed ids) */
  id: string;
  quantity: number;
}

export class CreateChannelSessionCommand {
  constructor(
    public readonly channel: ChannelContext,
    public readonly items: CreateChannelSessionItem[],
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
    public readonly affiliateAttribution?: { first_touch?: Record<string, unknown>; last_touch?: Record<string, unknown> },
  ) {}
}

type CatalogProduct = Awaited<ReturnType<ChannelCatalogPort['findProducts']>>[number];
type AcpFulfillmentDetails = NonNullable<CreateChannelSessionCommand['fulfillmentDetails']>;
type Checkout = Awaited<ReturnType<ChannelCheckoutPort['initiateCheckout']>>;

export class CreateChannelSessionUseCase {
  constructor(
    private readonly channelSessionRepository: ChannelSessionRepository,
    private readonly catalog: ChannelCatalogPort,
    private readonly checkout: ChannelCheckoutPort,
  ) {}

  async execute(command: CreateChannelSessionCommand): Promise<AcpCheckoutSession> {
    const products = await this.resolvePurchasableProducts(command);
    const session = this.buildSession(command);

    const basket = await this.checkout.createBasket({
      sessionId: `acp:${session.channelSessionId}`,
      storeId: command.channel.storeId,
      salesChannelId: command.channel.salesChannelId,
      currency: command.channel.currency,
    });

    await this.fillBasket(basket.basketId, command.items, products);

    const guestEmail = command.fulfillmentDetails?.email ?? command.buyer?.email;
    const checkout = await this.checkout.initiateCheckout(basket.basketId, guestEmail);
    const updatedCheckout = await this.applyShippingAddress(checkout, command);

    session.attachCheckout(basket.basketId, checkout.checkoutId);
    await this.channelSessionRepository.save(session);

    const basketView = await this.checkout.getBasket(basket.basketId);
    const shippingOptions = command.fulfillmentDetails?.address ? await this.safeShippingOptions(checkout.checkoutId) : [];

    eventBus.emit('agenticCheckout.session_created', {
      channelSessionId: session.channelSessionId,
      integrationId: session.integrationId,
      storeId: session.storeId,
      checkoutId: checkout.checkoutId,
    });

    return toAcpSession({
      session,
      checkout: updatedCheckout,
      basketItems: basketView?.items ?? [],
      shippingOptions,
    });
  }

  // Items must exist and be purchasable on the session's channel.
  private async resolvePurchasableProducts(command: CreateChannelSessionCommand): Promise<CatalogProduct[]> {
    if (!command.items || command.items.length === 0) {
      throw new ChannelCatalogError('items must contain at least one entry');
    }

    const ids = command.items.map(i => i.id);
    const products = await this.catalog.findProducts(command.channel.storeId, ids, command.channel.salesChannelId);

    const missing = ids.filter(id => !products.some(p => p.productId === id || p.productVariantId === id));
    if (missing.length > 0) {
      throw new ChannelCatalogError(`Items not purchasable on this channel: ${missing.join(', ')}`);
    }
    return products;
  }

  private buildSession(command: CreateChannelSessionCommand): ChannelSession {
    return ChannelSession.create({
      integrationId: command.channel.integrationId,
      organizationId: command.channel.organizationId,
      storeId: command.channel.storeId,
      buyer: command.buyer
        ? {
            firstName: command.buyer.first_name,
            lastName: command.buyer.last_name,
            email: command.buyer.email,
            phone: command.buyer.phone,
          }
        : undefined,
      fulfillmentDetails: command.fulfillmentDetails ? this.toFulfillmentDetails(command.fulfillmentDetails) : undefined,
      attribution: command.affiliateAttribution
        ? {
            surface: command.channel.surface,
            firstTouch: command.affiliateAttribution.first_touch,
            lastTouch: command.affiliateAttribution.last_touch,
          }
        : { surface: command.channel.surface },
    });
  }

  private toFulfillmentDetails(details: AcpFulfillmentDetails) {
    return {
      email: details.email,
      phone: details.phone,
      address: details.address
        ? {
            lineOne: details.address.line_one,
            lineTwo: details.address.line_two,
            city: details.address.city,
            region: details.address.region,
            country: details.address.country,
            postalCode: details.address.postal_code,
          }
        : undefined,
    };
  }

  private async fillBasket(basketId: string, items: CreateChannelSessionItem[], products: CatalogProduct[]): Promise<void> {
    for (const item of items) {
      const product = products.find(p => p.productId === item.id || p.productVariantId === item.id);
      if (!product) continue;
      await this.checkout.addItem(basketId, {
        productId: product.productId,
        productVariantId: product.productVariantId,
        sku: product.sku ?? '',
        name: product.name,
        quantity: item.quantity,
        imageUrl: product.imageUrl,
      });
    }
  }

  private async applyShippingAddress(checkout: Checkout, command: CreateChannelSessionCommand): Promise<Checkout> {
    const address = command.fulfillmentDetails?.address;
    if (!address?.line_one || !address.city || !address.country) return checkout;
    return this.checkout.setShippingAddress(checkout.checkoutId, {
      firstName: command.buyer?.first_name ?? '',
      lastName: command.buyer?.last_name ?? '',
      lineOne: address.line_one,
      lineTwo: address.line_two,
      city: address.city,
      region: address.region,
      country: address.country,
      postalCode: address.postal_code ?? '',
      phone: command.fulfillmentDetails?.phone ?? command.buyer?.phone,
    });
  }

  private async safeShippingOptions(checkoutId: string) {
    try {
      return await this.checkout.getShippingOptions(checkoutId);
    } catch {
      return [];
    }
  }
}
