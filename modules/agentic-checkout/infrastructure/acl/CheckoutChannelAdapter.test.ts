/**
 * Tests for CheckoutChannelAdapter — translates the channel checkout port to
 * basket + checkout use-case commands and maps entities to port snapshots.
 */

import { Basket } from '../../../basket/domain/entities/Basket';
import { BasketItem } from '../../../basket/domain/entities/BasketItem';
import { Money } from '../../../../libs/money';
import { CheckoutSession } from '../../../checkout/domain/entities/CheckoutSession';
import { Address } from '../../../checkout/domain/valueObjects/Address';
import { GetOrCreateBasketCommand } from '../../../basket/application/useCases/GetOrCreateBasket';
import { AddItemCommand } from '../../../basket/application/useCases/AddItem';
import { UpdateItemQuantityCommand } from '../../../basket/application/useCases/UpdateItemQuantity';
import { RemoveItemCommand } from '../../../basket/application/useCases/RemoveItem';
import { InitiateCheckoutCommand } from '../../../checkout/application/useCases/InitiateCheckout';
import { SetShippingAddressCommand } from '../../../checkout/application/useCases/SetShippingAddress';
import { SetFulfillmentMethodCommand } from '../../../checkout/application/useCases/SetFulfillmentMethod';
import { SetShippingMethodCommand } from '../../../checkout/application/useCases/SetShippingMethod';
import { ApplyCouponCommand } from '../../../checkout/application/useCases/ApplyCoupon';
import { CreatePaymentIntentCommand } from '../../../checkout/application/useCases/CreatePaymentIntent';
import { CompleteCheckoutCommand } from '../../../checkout/application/useCases/CompleteCheckout';
import { AbandonCheckoutCommand } from '../../../checkout/application/useCases/AbandonCheckout';
import { ChannelSessionNotFoundError } from '../../domain/errors/AgenticCheckoutErrors';
import type { ShippingOption, ShippingQuoteRequest } from '../../../checkout/application/ports/ShippingQuotePort';
import { CheckoutChannelAdapter } from './CheckoutChannelAdapter';

const BASKET_ID = 'basket-1';
const CHECKOUT_ID = 'checkout-1';
const ORDER_ID = 'order-1';

function makeBasket(): Basket {
  const basket = Basket.create({ basketId: BASKET_ID, sessionId: 'sess-1', currency: 'USD' });
  basket.addItem(
    BasketItem.create({
      basketItemId: 'item-1',
      basketId: BASKET_ID,
      productId: 'prod-1',
      sku: 'SKU-1',
      name: 'Test Product',
      quantity: 2,
      unitPrice: Money.fromCents(1999, 'USD'),
      imageUrl: 'https://cdn.example.com/p.png',
      itemType: 'physical',
      isGift: false,
    }),
  );
  return basket;
}

function makeCheckoutSession(overrides: Partial<Parameters<typeof CheckoutSession.reconstitute>[0]> = {}): CheckoutSession {
  const now = new Date();
  return CheckoutSession.reconstitute({
    id: CHECKOUT_ID,
    basketId: BASKET_ID,
    status: 'active',
    paymentStatus: 'pending',
    sameAsShipping: true,
    fulfillmentType: 'shipping',
    subtotal: Money.fromCents(3998, 'USD'),
    taxAmount: Money.fromCents(320, 'USD'),
    shippingAmount: Money.fromCents(500, 'USD'),
    discountAmount: Money.zero('USD'),
    total: Money.fromCents(4818, 'USD'),
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(now.getTime() + 30 * 60_000),
    ...overrides,
  });
}

function makeShippingAddress(): Address {
  return Address.create({
    firstName: 'Ada',
    lastName: 'Lovelace',
    addressLine1: '1 Main St',
    city: 'Springfield',
    postalCode: '12345',
    country: 'US',
  });
}

function basketResponse() {
  return {
    basketId: BASKET_ID,
    sessionId: 'sess-1',
    status: 'active',
    currency: 'USD',
    items: [],
    itemCount: 0,
    subtotalCents: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function checkoutResponse() {
  return {
    checkoutId: CHECKOUT_ID,
    basketId: BASKET_ID,
    status: 'active',
    paymentStatus: 'pending',
    subtotalCents: 3998,
    taxAmountCents: 320,
    shippingAmountCents: 500,
    discountAmountCents: 0,
    totalCents: 4818,
    currency: 'USD',
    fulfillmentType: 'shipping',
    sameAsShipping: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date().toISOString(),
  };
}

function makeDeps() {
  return {
    getOrCreateBasket: { execute: jest.fn(async (_cmd: GetOrCreateBasketCommand) => basketResponse()) },
    addItem: { execute: jest.fn(async (_cmd: AddItemCommand) => basketResponse()) },
    updateItemQuantity: { execute: jest.fn(async (_cmd: UpdateItemQuantityCommand) => basketResponse()) },
    removeItem: { execute: jest.fn(async (_cmd: RemoveItemCommand) => basketResponse()) },
    basketRepo: { findById: jest.fn(async (_basketId: string): Promise<Basket | null> => makeBasket()) },
    initiateCheckout: { execute: jest.fn(async (_cmd: InitiateCheckoutCommand) => checkoutResponse()) },
    manageCheckoutSession: {
      findById: jest.fn(async (_checkoutId: string): Promise<CheckoutSession | null> => makeCheckoutSession()),
      save: jest.fn(async (s: CheckoutSession) => s),
    },
    setShippingAddress: { execute: jest.fn(async (_cmd: SetShippingAddressCommand) => checkoutResponse()) },
    setFulfillmentMethod: { execute: jest.fn(async (_cmd: SetFulfillmentMethodCommand) => checkoutResponse()) },
    setShippingMethod: { execute: jest.fn(async (_cmd: SetShippingMethodCommand) => checkoutResponse()) },
    applyCoupon: { execute: jest.fn(async (_cmd: ApplyCouponCommand) => checkoutResponse()) },
    createPaymentIntent: {
      execute: jest.fn(async (_cmd: CreatePaymentIntentCommand) => ({
        orderId: ORDER_ID,
        orderNumber: 'ORD-1',
        paymentIntent: { id: 'pi_1' },
        status: 'initiated',
      })),
    },
    completeCheckout: {
      execute: jest.fn(async (_cmd: CompleteCheckoutCommand) => ({
        orderId: ORDER_ID,
        checkoutId: CHECKOUT_ID,
        total: 4818,
        currency: 'USD',
        status: 'completed',
      })),
    },
    abandonCheckout: { execute: jest.fn(async (_cmd: AbandonCheckoutCommand) => ({ message: 'abandoned', checkoutId: CHECKOUT_ID })) },
    shippingQuotes: {
      getShippingOptions: jest.fn(async (_request: ShippingQuoteRequest): Promise<ShippingOption[]> => []),
    },
  };
}

function makeAdapter(deps: ReturnType<typeof makeDeps>) {
  return new CheckoutChannelAdapter(
    deps.getOrCreateBasket,
    deps.addItem,
    deps.updateItemQuantity,
    deps.removeItem,
    deps.basketRepo,
    deps.initiateCheckout,
    deps.manageCheckoutSession,
    deps.setShippingAddress,
    deps.setFulfillmentMethod,
    deps.setShippingMethod,
    deps.applyCoupon,
    deps.createPaymentIntent,
    deps.completeCheckout,
    deps.abandonCheckout,
    deps.shippingQuotes,
  );
}

describe('CheckoutChannelAdapter', () => {
  let deps: ReturnType<typeof makeDeps>;
  let adapter: CheckoutChannelAdapter;

  beforeEach(() => {
    deps = makeDeps();
    adapter = makeAdapter(deps);
  });

  describe('createBasket', () => {
    it('should create a session-scoped basket for the channel store', async () => {
      const result = await adapter.createBasket({ sessionId: 'sess-1', storeId: 'store-1', currency: 'USD' });

      expect(deps.getOrCreateBasket.execute).toHaveBeenCalledWith(expect.any(GetOrCreateBasketCommand));
      const command = deps.getOrCreateBasket.execute.mock.calls[0][0] as GetOrCreateBasketCommand;
      expect(command).toMatchObject({ sessionId: 'sess-1', storeId: 'store-1', currency: 'USD' });
      expect(result).toEqual({ basketId: BASKET_ID });
    });
  });

  describe('getBasket', () => {
    it('should map basket items to the channel item shape', async () => {
      const basket = await adapter.getBasket(BASKET_ID);

      expect(basket?.items).toHaveLength(1);
      expect(basket?.items[0]).toMatchObject({
        basketItemId: 'item-1',
        productId: 'prod-1',
        sku: 'SKU-1',
        quantity: 2,
        unitPriceCents: 1999,
        lineTotalCents: 3998,
      });
    });

    it('should return null when the basket does not exist', async () => {
      deps.basketRepo.findById.mockResolvedValueOnce(null);

      expect(await adapter.getBasket('missing')).toBeNull();
    });
  });

  describe('item mutations', () => {
    it('should map addItem to an AddItemCommand', async () => {
      await adapter.addItem(BASKET_ID, {
        productId: 'prod-1',
        sku: 'SKU-1',
        name: 'Test Product',
        quantity: 2,
        productVariantId: 'var-1',
        imageUrl: 'https://cdn.example.com/p.png',
      });

      const command = deps.addItem.execute.mock.calls[0][0] as AddItemCommand;
      expect(command).toBeInstanceOf(AddItemCommand);
      expect(command).toMatchObject({
        basketId: BASKET_ID,
        productId: 'prod-1',
        sku: 'SKU-1',
        quantity: 2,
        productVariantId: 'var-1',
      });
    });

    it('should map updateItemQuantity and removeItem to their commands', async () => {
      await adapter.updateItemQuantity(BASKET_ID, 'item-1', 3);
      await adapter.removeItem(BASKET_ID, 'item-1');

      const update = deps.updateItemQuantity.execute.mock.calls[0][0] as UpdateItemQuantityCommand;
      expect(update).toMatchObject({ basketId: BASKET_ID, basketItemId: 'item-1', quantity: 3 });
      const remove = deps.removeItem.execute.mock.calls[0][0] as RemoveItemCommand;
      expect(remove).toMatchObject({ basketId: BASKET_ID, basketItemId: 'item-1' });
    });
  });

  describe('checkout lifecycle', () => {
    it('should initiate checkout and return the snapshot', async () => {
      const snapshot = await adapter.initiateCheckout(BASKET_ID, 'buyer@example.com');

      const command = deps.initiateCheckout.execute.mock.calls[0][0] as InitiateCheckoutCommand;
      expect(command).toMatchObject({ basketId: BASKET_ID, guestEmail: 'buyer@example.com' });
      expect(snapshot.checkoutId).toBe(CHECKOUT_ID);
      expect(snapshot.subtotalCents).toBe(3998);
      expect(snapshot.totalCents).toBe(4818);
    });

    it('should return null from getCheckout when the session is gone', async () => {
      deps.manageCheckoutSession.findById.mockResolvedValueOnce(null);

      expect(await adapter.getCheckout('missing')).toBeNull();
    });

    it('should map the checkout shipping address into the snapshot', async () => {
      deps.manageCheckoutSession.findById.mockResolvedValueOnce(makeCheckoutSession({ shippingAddress: makeShippingAddress() }));

      const snapshot = await adapter.getCheckout(CHECKOUT_ID);

      expect(snapshot?.shippingAddress).toMatchObject({
        firstName: 'Ada',
        addressLine1: '1 Main St',
        city: 'Springfield',
        postalCode: '12345',
        country: 'US',
      });
    });

    it('should throw ChannelSessionNotFoundError when a mutation target is missing', async () => {
      deps.manageCheckoutSession.findById.mockResolvedValue(null);

      await expect(adapter.setFulfillmentMethod(CHECKOUT_ID, 'shipping')).rejects.toThrow(ChannelSessionNotFoundError);
    });
  });

  describe('shipping address and options', () => {
    it('should map ACP address fields to SetShippingAddressCommand', async () => {
      await adapter.setShippingAddress(CHECKOUT_ID, {
        firstName: 'Ada',
        lastName: 'Lovelace',
        lineOne: '1 Main St',
        lineTwo: 'Apt 4',
        city: 'Springfield',
        region: 'IL',
        postalCode: '12345',
        country: 'US',
        phone: '+15551234567',
      });

      const command = deps.setShippingAddress.execute.mock.calls[0][0] as SetShippingAddressCommand;
      expect(command).toMatchObject({
        checkoutId: CHECKOUT_ID,
        firstName: 'Ada',
        lastName: 'Lovelace',
        addressLine1: '1 Main St',
        addressLine2: 'Apt 4',
        city: 'Springfield',
        region: 'IL',
        postalCode: '12345',
        country: 'US',
        phone: '+15551234567',
      });
    });

    it('should return no shipping options without a shipping address', async () => {
      const options = await adapter.getShippingOptions(CHECKOUT_ID);

      expect(options).toEqual([]);
      expect(deps.shippingQuotes.getShippingOptions).not.toHaveBeenCalled();
    });

    it('should fetch and map shipping options once an address exists', async () => {
      deps.manageCheckoutSession.findById.mockResolvedValue(makeCheckoutSession({ shippingAddress: makeShippingAddress() }));
      deps.shippingQuotes.getShippingOptions.mockResolvedValueOnce([
        { methodId: 'm1', methodName: 'Standard', amountCents: 500, currency: 'USD', estimatedDays: 5, carrier: 'UPS' },
      ]);

      const options = await adapter.getShippingOptions(CHECKOUT_ID);

      expect(deps.shippingQuotes.getShippingOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          basketId: BASKET_ID,
          shippingAddress: expect.objectContaining({ country: 'US', postalCode: '12345' }),
          totalValueCents: 3998,
        }),
      );
      expect(options).toEqual([
        { methodId: 'm1', methodName: 'Standard', amountCents: 500, currency: 'USD', estimatedDays: 5, carrier: 'UPS' },
      ]);
    });
  });

  describe('payment and completion', () => {
    it('should store the delegated credential on session metadata and save', async () => {
      const session = makeCheckoutSession();
      deps.manageCheckoutSession.findById.mockResolvedValueOnce(session);

      await adapter.attachDelegatedPayment(CHECKOUT_ID, {
        provider: 'stripe',
        credentialType: 'spt',
        token: 'spt_token_123',
      });

      expect(session.paymentMethodId).toBe('delegated:stripe');
      expect(session.metadata?.delegatedPaymentCredential).toEqual({
        provider: 'stripe',
        credentialType: 'spt',
        token: 'spt_token_123',
      });
      expect(deps.manageCheckoutSession.save).toHaveBeenCalledWith(session);
    });

    it('should throw when attaching a delegated credential to a missing session', async () => {
      deps.manageCheckoutSession.findById.mockResolvedValueOnce(null);

      await expect(adapter.attachDelegatedPayment('missing', { provider: 'stripe', credentialType: 'spt', token: 't' })).rejects.toThrow(
        ChannelSessionNotFoundError,
      );
    });

    it('should map createPaymentIntent response to orderId/orderNumber/paymentIntentId', async () => {
      const result = await adapter.createPaymentIntent(CHECKOUT_ID);

      const command = deps.createPaymentIntent.execute.mock.calls[0][0] as CreatePaymentIntentCommand;
      expect(command.checkoutId).toBe(CHECKOUT_ID);
      expect(result).toEqual({ orderId: ORDER_ID, orderNumber: 'ORD-1', paymentIntentId: 'pi_1' });
    });

    it('should complete the checkout through CompleteCheckoutCommand', async () => {
      const result = await adapter.completeCheckout(CHECKOUT_ID);

      const command = deps.completeCheckout.execute.mock.calls[0][0] as CompleteCheckoutCommand;
      expect(command.checkoutId).toBe(CHECKOUT_ID);
      expect(result.orderId).toBe(ORDER_ID);
    });

    it('should abandon the checkout through AbandonCheckoutCommand', async () => {
      await adapter.abandonCheckout(CHECKOUT_ID);

      const command = deps.abandonCheckout.execute.mock.calls[0][0] as AbandonCheckoutCommand;
      expect(command.checkoutId).toBe(CHECKOUT_ID);
    });
  });

  describe('fulfillment and coupons', () => {
    it('should map fulfillment method and shipping method commands', async () => {
      await adapter.setFulfillmentMethod(CHECKOUT_ID, 'pickup');
      await adapter.setShippingMethod(CHECKOUT_ID, 'm1');

      const fulfillment = deps.setFulfillmentMethod.execute.mock.calls[0][0] as SetFulfillmentMethodCommand;
      expect(fulfillment).toMatchObject({ checkoutId: CHECKOUT_ID, fulfillmentType: 'pickup' });
      const shipping = deps.setShippingMethod.execute.mock.calls[0][0] as SetShippingMethodCommand;
      expect(shipping).toMatchObject({ checkoutId: CHECKOUT_ID, shippingMethodId: 'm1' });
    });

    it('should map applyCoupon to an ApplyCouponCommand', async () => {
      await adapter.applyCoupon(CHECKOUT_ID, 'SAVE10');

      const command = deps.applyCoupon.execute.mock.calls[0][0] as ApplyCouponCommand;
      expect(command).toMatchObject({ checkoutId: CHECKOUT_ID, couponCode: 'SAVE10' });
    });
  });
});
