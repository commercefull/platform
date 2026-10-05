/**
 * Tests for GetChannelSessionUseCase — ACP getCheckoutSession.
 */

import {
  CHANNEL_SESSION_ID,
  CHECKOUT_ID,
  INTEGRATION_ID,
  createCheckoutSnapshot,
  createSession,
  makeCheckoutPort,
  makeSessionRepo,
} from '../../tests/testUtils';
import { ChannelSessionNotFoundError } from '../../domain/errors/AgenticCheckoutErrors';
import { GetChannelSessionCommand, GetChannelSessionUseCase } from './GetChannelSession';

describe('GetChannelSessionUseCase', () => {
  const sessionRepo = makeSessionRepo();
  const checkout = makeCheckoutPort();
  const useCase = new GetChannelSessionUseCase(sessionRepo, checkout);

  beforeEach(() => {
    jest.clearAllMocks();
    sessionRepo.findById.mockResolvedValue(createSession());
  });

  it('should return the ACP session with basket items and totals when found', async () => {
    const result = await useCase.execute(new GetChannelSessionCommand(CHANNEL_SESSION_ID, INTEGRATION_ID));

    expect(result.id).toBe('test-uuid');
    expect(result.line_items).toHaveLength(1);
    expect(result.totals.find(t => t.type === 'total')?.amount).toBe(2659);
    expect(checkout.getCheckout).toHaveBeenCalledWith(CHECKOUT_ID);
  });

  it('should not fetch shipping options when the checkout has no shipping address', async () => {
    const result = await useCase.execute(new GetChannelSessionCommand(CHANNEL_SESSION_ID, INTEGRATION_ID));

    expect(checkout.getShippingOptions).not.toHaveBeenCalled();
    expect(result.fulfillment_options).toBeUndefined();
  });

  it('should include shipping options when a shipping address is present', async () => {
    checkout.getCheckout.mockResolvedValueOnce(
      createCheckoutSnapshot({
        shippingAddress: {
          firstName: 'Ada',
          lastName: 'Lovelace',
          addressLine1: '1 Main St',
          city: 'Springfield',
          postalCode: '12345',
          country: 'US',
        },
      }),
    );
    checkout.getShippingOptions.mockResolvedValueOnce([{ methodId: 'm1', methodName: 'Standard', amountCents: 500, currency: 'USD' }]);

    const result = await useCase.execute(new GetChannelSessionCommand(CHANNEL_SESSION_ID, INTEGRATION_ID));

    expect(checkout.getShippingOptions).toHaveBeenCalledWith(CHECKOUT_ID);
    expect(result.fulfillment_options).toHaveLength(1);
    expect(result.fulfillment_options?.[0].id).toBe('m1');
  });

  it('should tolerate shipping option lookup failures and return no options', async () => {
    checkout.getCheckout.mockResolvedValueOnce(
      createCheckoutSnapshot({
        shippingAddress: {
          firstName: 'Ada',
          lastName: 'Lovelace',
          addressLine1: '1 Main St',
          city: 'Springfield',
          postalCode: '12345',
          country: 'US',
        },
      }),
    );
    checkout.getShippingOptions.mockRejectedValueOnce(new Error('shipping unavailable'));

    const result = await useCase.execute(new GetChannelSessionCommand(CHANNEL_SESSION_ID, INTEGRATION_ID));

    expect(result.fulfillment_options).toBeUndefined();
  });

  it('should translate a session without checkout or basket to an empty ACP session', async () => {
    sessionRepo.findById.mockResolvedValueOnce(createSession({ checkoutId: undefined, basketId: undefined }));

    const result = await useCase.execute(new GetChannelSessionCommand(CHANNEL_SESSION_ID, INTEGRATION_ID));

    expect(result.line_items).toHaveLength(0);
    expect(result.totals.find(t => t.type === 'total')?.amount).toBe(0);
  });

  it('should throw ChannelSessionNotFoundError when the session does not exist', async () => {
    sessionRepo.findById.mockResolvedValueOnce(null);

    await expect(useCase.execute(new GetChannelSessionCommand(CHANNEL_SESSION_ID, INTEGRATION_ID))).rejects.toThrow(
      ChannelSessionNotFoundError,
    );
  });

  it('should throw ChannelSessionNotFoundError when the session belongs to another channel', async () => {
    await expect(useCase.execute(new GetChannelSessionCommand(CHANNEL_SESSION_ID, 'other-integration'))).rejects.toThrow(
      ChannelSessionNotFoundError,
    );
  });
});
