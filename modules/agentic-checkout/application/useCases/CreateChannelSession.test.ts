/**
 * CreateChannelSession unit tests
 */

import '../../tests/testUtils';
import { CreateChannelSessionUseCase, CreateChannelSessionCommand } from './CreateChannelSession';
import { ChannelCatalogError } from '../../domain/errors/AgenticCheckoutErrors';
import {
  makeSessionRepo,
  makeCatalogPort,
  makeCheckoutPort,
  createChannelContext,
  createCheckoutSnapshot,
  BASKET_ID,
  CHECKOUT_ID,
  PRODUCT_ID,
  emitMock,
} from '../../tests/testUtils';

function makeUseCase() {
  const sessionRepo = makeSessionRepo();
  const catalog = makeCatalogPort();
  const checkout = makeCheckoutPort();
  const useCase = new CreateChannelSessionUseCase(sessionRepo, catalog, checkout);
  return { useCase, sessionRepo, catalog, checkout };
}

describe('CreateChannelSessionUseCase', () => {
  it('should create a session with basket + checkout when items are sellable', async () => {
    const { useCase, sessionRepo, checkout } = makeUseCase();

    const response = await useCase.execute(new CreateChannelSessionCommand(createChannelContext(), [{ id: PRODUCT_ID, quantity: 2 }]));

    expect(checkout.createBasket).toHaveBeenCalledWith(
      expect.objectContaining({ storeId: expect.any(String), sessionId: expect.stringMatching(/^acp:/) }),
    );
    expect(checkout.addItem).toHaveBeenCalledWith(BASKET_ID, expect.objectContaining({ productId: PRODUCT_ID, quantity: 2 }));
    expect(checkout.initiateCheckout).toHaveBeenCalledWith(BASKET_ID, undefined);
    expect(sessionRepo.save).toHaveBeenCalled();

    const saved = sessionRepo.save.mock.calls[0][0];
    expect(saved.basketId).toBe(BASKET_ID);
    expect(saved.checkoutId).toBe(CHECKOUT_ID);

    expect(response.id).toBe(saved.channelSessionId);
    expect(response.line_items).toHaveLength(1);
    expect(emitMock).toHaveBeenCalledWith('agenticCheckout.session_created', expect.any(Object));
  });

  it('should throw when items array is empty', async () => {
    const { useCase } = makeUseCase();
    await expect(useCase.execute(new CreateChannelSessionCommand(createChannelContext(), []))).rejects.toThrow(ChannelCatalogError);
  });

  it('should reject items not in the channel assortment', async () => {
    const { useCase, catalog } = makeUseCase();
    catalog.findProducts.mockResolvedValue([]);

    await expect(
      useCase.execute(new CreateChannelSessionCommand(createChannelContext(), [{ id: 'missing-product', quantity: 1 }])),
    ).rejects.toThrow(ChannelCatalogError);
  });

  it('should set the shipping address when fulfillment_details include one', async () => {
    const { useCase, checkout } = makeUseCase();
    checkout.setShippingAddress.mockResolvedValue(
      createCheckoutSnapshot({
        shippingAddress: {
          firstName: '',
          lastName: '',
          addressLine1: '1 Main St',
          city: 'SF',
          postalCode: '94102',
          country: 'US',
        },
      }),
    );

    await useCase.execute(
      new CreateChannelSessionCommand(
        createChannelContext(),
        [{ id: PRODUCT_ID, quantity: 1 }],
        { email: 'buyer@example.com' },
        {
          email: 'buyer@example.com',
          address: { line_one: '1 Main St', city: 'SF', country: 'US', postal_code: '94102' },
        },
      ),
    );

    expect(checkout.initiateCheckout).toHaveBeenCalledWith(BASKET_ID, 'buyer@example.com');
    expect(checkout.setShippingAddress).toHaveBeenCalledWith(
      CHECKOUT_ID,
      expect.objectContaining({ lineOne: '1 Main St', postalCode: '94102' }),
    );
    expect(checkout.getShippingOptions).toHaveBeenCalledWith(CHECKOUT_ID);
  });
});
