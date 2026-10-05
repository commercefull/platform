/**
 * CheckoutChannelAdapter
 *
 * ACL adapter bridging agentic-checkout's ChannelCheckoutPort to the basket
 * and checkout modules' wired use cases. Totals, availability, tax, and
 * promotions remain authoritative in checkout — this adapter only translates.
 */

import { GetOrCreateBasketCommand, type GetOrCreateBasketUseCase } from '../../../basket/application/useCases/GetOrCreateBasket';
import { AddItemCommand, type AddItemUseCase } from '../../../basket/application/useCases/AddItem';
import { UpdateItemQuantityCommand, type UpdateItemQuantityUseCase } from '../../../basket/application/useCases/UpdateItemQuantity';
import { RemoveItemCommand, type RemoveItemUseCase } from '../../../basket/application/useCases/RemoveItem';
import type { BasketRepository } from '../../../basket/domain/repositories/BasketRepository';
import { InitiateCheckoutCommand, type InitiateCheckoutUseCase } from '../../../checkout/application/useCases/InitiateCheckout';
import type { ManageCheckoutSessionUseCase } from '../../../checkout/application/useCases/ManageCheckoutSession';
import { SetShippingAddressCommand, type SetShippingAddressUseCase } from '../../../checkout/application/useCases/SetShippingAddress';
import { SetFulfillmentMethodCommand, type SetFulfillmentMethodUseCase } from '../../../checkout/application/useCases/SetFulfillmentMethod';
import { SetShippingMethodCommand, type SetShippingMethodUseCase } from '../../../checkout/application/useCases/SetShippingMethod';
import { ApplyCouponCommand, type ApplyCouponUseCase } from '../../../checkout/application/useCases/ApplyCoupon';
import { CreatePaymentIntentCommand, type CreatePaymentIntentUseCase } from '../../../checkout/application/useCases/CreatePaymentIntent';
import { CompleteCheckoutCommand, type CompleteCheckoutUseCase } from '../../../checkout/application/useCases/CompleteCheckout';
import { AbandonCheckoutCommand, type AbandonCheckoutUseCase } from '../../../checkout/application/useCases/AbandonCheckout';
import type { ShippingQuotePort } from '../../../checkout/application/ports/ShippingQuotePort';
import type { CheckoutSession, FulfillmentType } from '../../../checkout/domain/entities/CheckoutSession';
import { ChannelSessionNotFoundError } from '../../domain/errors/AgenticCheckoutErrors';
import type {
  ChannelCheckoutPort,
  ChannelCheckoutSnapshot,
  ChannelItemInput,
  ChannelShippingOption,
  ChannelCompletionResult,
  DelegatedCredential,
  ChannelAddressInput,
} from '../../application/ports/ChannelCheckoutPort';

function mapCheckout(session: CheckoutSession): ChannelCheckoutSnapshot {
  const sa = session.shippingAddress;
  return {
    checkoutId: session.id,
    basketId: session.basketId,
    status: session.status,
    paymentStatus: session.paymentStatus,
    isReadyForPayment: session.isReadyForPayment,
    guestEmail: session.guestEmail,
    fulfillmentType: session.fulfillmentType,
    shippingAddress: sa
      ? {
          firstName: sa.firstName,
          lastName: sa.lastName,
          addressLine1: sa.addressLine1,
          city: sa.city,
          postalCode: sa.postalCode,
          country: sa.country,
        }
      : undefined,
    shippingMethodId: session.shippingMethodId,
    shippingMethodName: session.shippingMethodName,
    paymentMethodId: session.paymentMethodId,
    subtotalCents: session.subtotal.cents,
    taxAmountCents: session.taxAmount.cents,
    shippingAmountCents: session.shippingAmount.cents,
    discountAmountCents: session.discountAmount.cents,
    totalCents: session.total.cents,
    currency: session.subtotal.currency,
    couponCode: session.couponCode,
    expiresAt: session.expiresAt,
  };
}

export class CheckoutChannelAdapter implements ChannelCheckoutPort {
  constructor(
    private readonly getOrCreateBasketUseCase: Pick<GetOrCreateBasketUseCase, 'execute'>,
    private readonly addItemUseCase: Pick<AddItemUseCase, 'execute'>,
    private readonly updateItemQuantityUseCase: Pick<UpdateItemQuantityUseCase, 'execute'>,
    private readonly removeItemUseCase: Pick<RemoveItemUseCase, 'execute'>,
    private readonly basketRepository: Pick<BasketRepository, 'findById'>,
    private readonly initiateCheckoutUseCase: Pick<InitiateCheckoutUseCase, 'execute'>,
    private readonly manageCheckoutSessionUseCase: Pick<ManageCheckoutSessionUseCase, 'findById' | 'save'>,
    private readonly setShippingAddressUseCase: Pick<SetShippingAddressUseCase, 'execute'>,
    private readonly setFulfillmentMethodUseCase: Pick<SetFulfillmentMethodUseCase, 'execute'>,
    private readonly setShippingMethodUseCase: Pick<SetShippingMethodUseCase, 'execute'>,
    private readonly applyCouponUseCase: Pick<ApplyCouponUseCase, 'execute'>,
    private readonly createPaymentIntentUseCase: Pick<CreatePaymentIntentUseCase, 'execute'>,
    private readonly completeCheckoutUseCase: Pick<CompleteCheckoutUseCase, 'execute'>,
    private readonly abandonCheckoutUseCase: Pick<AbandonCheckoutUseCase, 'execute'>,
    private readonly shippingQuotePort: Pick<ShippingQuotePort, 'getShippingOptions'>,
  ) {}

  async createBasket(params: {
    sessionId: string;
    storeId?: string;
    salesChannelId?: string;
    currency?: string;
  }): Promise<{ basketId: string }> {
    const basket = await this.getOrCreateBasketUseCase.execute(
      new GetOrCreateBasketCommand(undefined, params.sessionId, params.currency, params.storeId, params.salesChannelId),
    );
    return { basketId: basket.basketId };
  }

  async getBasket(basketId: string) {
    const basket = await this.basketRepository.findById(basketId);
    if (!basket) return null;
    return {
      basketId: basket.basketId,
      currency: basket.currency,
      channelId: basket.channelId,
      items: basket.items.map(i => ({
        basketItemId: i.basketItemId,
        productId: i.productId,
        productVariantId: i.productVariantId,
        sku: i.sku,
        name: i.name,
        quantity: i.quantity,
        unitPriceCents: i.unitPrice.cents,
        lineTotalCents: i.lineTotal.cents,
        imageUrl: i.imageUrl,
      })),
    };
  }

  async addItem(basketId: string, item: ChannelItemInput): Promise<void> {
    await this.addItemUseCase.execute(
      new AddItemCommand(basketId, item.productId, item.sku, item.name, item.quantity, item.productVariantId, item.imageUrl),
    );
  }

  async updateItemQuantity(basketId: string, basketItemId: string, quantity: number): Promise<void> {
    await this.updateItemQuantityUseCase.execute(new UpdateItemQuantityCommand(basketId, basketItemId, quantity));
  }

  async removeItem(basketId: string, basketItemId: string): Promise<void> {
    await this.removeItemUseCase.execute(new RemoveItemCommand(basketId, basketItemId));
  }

  async initiateCheckout(basketId: string, guestEmail?: string): Promise<ChannelCheckoutSnapshot> {
    const response = await this.initiateCheckoutUseCase.execute(new InitiateCheckoutCommand(basketId, undefined, guestEmail));
    return this.fetch(response.checkoutId);
  }

  async getCheckout(checkoutId: string): Promise<ChannelCheckoutSnapshot | null> {
    const session = await this.manageCheckoutSessionUseCase.findById(checkoutId);
    return session ? mapCheckout(session) : null;
  }

  private async fetch(checkoutId: string): Promise<ChannelCheckoutSnapshot> {
    const session = await this.manageCheckoutSessionUseCase.findById(checkoutId);
    if (!session) throw new ChannelSessionNotFoundError(checkoutId);
    return mapCheckout(session);
  }

  async setShippingAddress(checkoutId: string, address: ChannelAddressInput): Promise<ChannelCheckoutSnapshot> {
    await this.setShippingAddressUseCase.execute(
      new SetShippingAddressCommand(
        checkoutId,
        address.firstName ?? '',
        address.lastName ?? '',
        address.lineOne,
        address.city,
        address.postalCode,
        address.country,
        undefined,
        address.lineTwo,
        address.region,
        address.phone,
      ),
    );
    return this.fetch(checkoutId);
  }

  async setFulfillmentMethod(checkoutId: string, fulfillmentType: string): Promise<ChannelCheckoutSnapshot> {
    await this.setFulfillmentMethodUseCase.execute(new SetFulfillmentMethodCommand(checkoutId, fulfillmentType as FulfillmentType));
    return this.fetch(checkoutId);
  }

  async setShippingMethod(checkoutId: string, methodId: string): Promise<ChannelCheckoutSnapshot> {
    await this.setShippingMethodUseCase.execute(new SetShippingMethodCommand(checkoutId, methodId));
    return this.fetch(checkoutId);
  }

  async applyCoupon(checkoutId: string, couponCode: string): Promise<ChannelCheckoutSnapshot> {
    await this.applyCouponUseCase.execute(new ApplyCouponCommand(checkoutId, couponCode));
    return this.fetch(checkoutId);
  }

  async getShippingOptions(checkoutId: string): Promise<ChannelShippingOption[]> {
    const session = await this.manageCheckoutSessionUseCase.findById(checkoutId);
    if (!session?.shippingAddress) return [];
    const sa = session.shippingAddress;
    const options = await this.shippingQuotePort.getShippingOptions({
      basketId: session.basketId,
      shippingAddress: {
        country: sa.country,
        region: sa.region,
        postalCode: sa.postalCode,
        city: sa.city,
      },
      totalValueCents: session.subtotal.cents,
    });
    return options.map(o => ({
      methodId: o.methodId,
      methodName: o.methodName,
      amountCents: o.amountCents,
      currency: o.currency,
      estimatedDays: o.estimatedDays,
      carrier: o.carrier,
    }));
  }

  async attachDelegatedPayment(checkoutId: string, credential: DelegatedCredential): Promise<void> {
    const session = await this.manageCheckoutSessionUseCase.findById(checkoutId);
    if (!session) throw new ChannelSessionNotFoundError(checkoutId);
    // The surface's delegated token stands in for a stored payment method;
    // the credential rides session metadata into the payment module.
    session.setPaymentMethod(`delegated:${credential.provider}`);
    session.updateMetadata({
      delegatedPaymentCredential: {
        provider: credential.provider,
        credentialType: credential.credentialType,
        token: credential.token,
      },
    });
    await this.manageCheckoutSessionUseCase.save(session);
  }

  async createPaymentIntent(checkoutId: string): Promise<{ orderId: string; orderNumber: string; paymentIntentId: string }> {
    const response = await this.createPaymentIntentUseCase.execute(new CreatePaymentIntentCommand(checkoutId));
    return { orderId: response.orderId, orderNumber: response.orderNumber, paymentIntentId: response.paymentIntent.id };
  }

  async completeCheckout(checkoutId: string): Promise<ChannelCompletionResult> {
    const response = await this.completeCheckoutUseCase.execute(new CompleteCheckoutCommand(checkoutId));
    return { orderId: response.orderId, orderNumber: '', paymentIntentId: '' };
  }

  async abandonCheckout(checkoutId: string): Promise<void> {
    await this.abandonCheckoutUseCase.execute(new AbandonCheckoutCommand(checkoutId));
  }
}
