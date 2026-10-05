/**
 * UpdateChannelSession unit tests
 */

import '../../tests/testUtils';
import { UpdateChannelSessionUseCase, UpdateChannelSessionCommand } from './UpdateChannelSession';
import { ChannelSessionNotFoundError, ChannelSessionNotMutableError, ChannelCatalogError } from '../../domain/errors/AgenticCheckoutErrors';
import {
  makeSessionRepo,
  makeCatalogPort,
  makeCheckoutPort,
  createSession,
  createChannelProduct,
  CHANNEL_SESSION_ID,
  INTEGRATION_ID,
  PRODUCT_ID,
  BASKET_ID,
} from '../../tests/testUtils';

function makeUseCase() {
  const sessionRepo = makeSessionRepo();
  const catalog = makeCatalogPort();
  const checkout = makeCheckoutPort();
  return { useCase: new UpdateChannelSessionUseCase(sessionRepo, catalog, checkout), sessionRepo, catalog, checkout };
}

describe('UpdateChannelSessionUseCase', () => {
  it('should apply a shipping address and refresh the checkout', async () => {
    const { useCase, sessionRepo, checkout } = makeUseCase();
    sessionRepo.findById.mockResolvedValue(createSession());

    await useCase.execute(
      new UpdateChannelSessionCommand(CHANNEL_SESSION_ID, INTEGRATION_ID, undefined, undefined, {
        email: 'b@x.com',
        address: { line_one: '1 Main St', city: 'SF', country: 'US', postal_code: '94102' },
      }),
    );

    expect(checkout.setShippingAddress).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ lineOne: '1 Main St', postalCode: '94102' }),
    );
    expect(sessionRepo.save).toHaveBeenCalled();
  });

  it('should set the selected shipping method when fulfillment_option_id is given', async () => {
    const { useCase, sessionRepo, checkout } = makeUseCase();
    sessionRepo.findById.mockResolvedValue(createSession());

    await useCase.execute(new UpdateChannelSessionCommand(CHANNEL_SESSION_ID, INTEGRATION_ID, undefined, undefined, undefined, 'ship-9'));

    expect(checkout.setShippingMethod).toHaveBeenCalledWith(expect.any(String), 'ship-9');
  });

  it('should diff items — add new, update changed quantities, remove missing', async () => {
    const { useCase, sessionRepo, checkout, catalog } = makeUseCase();
    sessionRepo.findById.mockResolvedValue(createSession());
    catalog.findProducts.mockResolvedValue([
      createChannelProduct({ productId: PRODUCT_ID }),
      createChannelProduct({ productId: 'prod-new' }),
    ]);
    checkout.getBasket.mockResolvedValue({
      basketId: BASKET_ID,
      currency: 'USD',
      items: [
        {
          basketItemId: 'bi-1',
          productId: PRODUCT_ID,
          sku: 'SKU-1',
          name: 'Test Product',
          quantity: 1,
          unitPriceCents: 1999,
          lineTotalCents: 1999,
        },
        {
          basketItemId: 'bi-2',
          productId: 'prod-old',
          sku: 'SKU-2',
          name: 'Old Product',
          quantity: 1,
          unitPriceCents: 500,
          lineTotalCents: 500,
        },
      ],
    });

    await useCase.execute(
      new UpdateChannelSessionCommand(CHANNEL_SESSION_ID, INTEGRATION_ID, [
        { id: PRODUCT_ID, quantity: 3 },
        { id: 'prod-new', quantity: 1 },
      ]),
    );

    expect(checkout.updateItemQuantity).toHaveBeenCalledWith(BASKET_ID, 'bi-1', 3);
    expect(checkout.addItem).toHaveBeenCalledWith(BASKET_ID, expect.objectContaining({ productId: 'prod-new' }));
    expect(checkout.removeItem).toHaveBeenCalledWith(BASKET_ID, 'bi-2');
  });

  it('should reject items outside the channel assortment', async () => {
    const { useCase, sessionRepo, catalog } = makeUseCase();
    sessionRepo.findById.mockResolvedValue(createSession());
    catalog.findProducts.mockResolvedValue([]);

    await expect(
      useCase.execute(new UpdateChannelSessionCommand(CHANNEL_SESSION_ID, INTEGRATION_ID, [{ id: 'bad', quantity: 1 }])),
    ).rejects.toThrow(ChannelCatalogError);
  });

  it('should reject updates on a completed session', async () => {
    const { useCase, sessionRepo } = makeUseCase();
    const session = createSession();
    session.markCompleting();
    session.markCompleted('order-1');
    sessionRepo.findById.mockResolvedValue(session);

    await expect(
      useCase.execute(new UpdateChannelSessionCommand(CHANNEL_SESSION_ID, INTEGRATION_ID, [{ id: 'p', quantity: 1 }])),
    ).rejects.toThrow(ChannelSessionNotMutableError);
  });

  it('should scope to the calling channel', async () => {
    const { useCase, sessionRepo } = makeUseCase();
    sessionRepo.findById.mockResolvedValue(createSession());

    await expect(useCase.execute(new UpdateChannelSessionCommand(CHANNEL_SESSION_ID, 'other-integration'))).rejects.toThrow(
      ChannelSessionNotFoundError,
    );
  });
});
