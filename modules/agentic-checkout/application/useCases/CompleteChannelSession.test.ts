/**
 * CompleteChannelSession unit tests
 */

import '../../tests/testUtils';
import { CompleteChannelSessionUseCase, CompleteChannelSessionCommand } from './CompleteChannelSession';
import {
  ChannelSessionNotFoundError,
  ChannelSessionNotMutableError,
  DelegatedPaymentError,
} from '../../domain/errors/AgenticCheckoutErrors';
import {
  makeSessionRepo,
  makeCheckoutPort,
  makeDelegatedPaymentPort,
  createSession,
  CHANNEL_SESSION_ID,
  INTEGRATION_ID,
  ORDER_ID,
  emitMock,
} from '../../tests/testUtils';

const PAYMENT_DATA = {
  handler_id: 'stripe',
  instrument: { type: 'card', credential: { type: 'spt', token: 'spt_123' } },
};

function makeUseCase() {
  const sessionRepo = makeSessionRepo();
  const checkout = makeCheckoutPort();
  const delegatedPayment = makeDelegatedPaymentPort();
  const useCase = new CompleteChannelSessionUseCase(sessionRepo, checkout, delegatedPayment);
  return { useCase, sessionRepo, checkout, delegatedPayment };
}

describe('CompleteChannelSessionUseCase', () => {
  it('should complete a session with a delegated credential', async () => {
    const { useCase, sessionRepo, checkout, delegatedPayment } = makeUseCase();
    const session = createSession();
    sessionRepo.findById.mockResolvedValue(session);
    sessionRepo.findByCheckoutId.mockResolvedValue(session);

    const response = await useCase.execute(
      new CompleteChannelSessionCommand(CHANNEL_SESSION_ID, INTEGRATION_ID, { email: 'b@x.com' }, PAYMENT_DATA),
    );

    expect(checkout.attachDelegatedPayment).toHaveBeenCalledWith(expect.any(String), {
      provider: 'stripe',
      credentialType: 'spt',
      token: 'spt_123',
    });
    expect(checkout.createPaymentIntent).toHaveBeenCalled();
    expect(delegatedPayment.chargeDelegatedPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: ORDER_ID,
        transactionId: 'pi_1',
        credential: { provider: 'stripe', credentialType: 'spt', token: 'spt_123' },
      }),
    );
    expect(checkout.completeCheckout).toHaveBeenCalled();
    expect(response.status).toBe('completed');
    expect(emitMock).toHaveBeenCalledWith('agenticCheckout.session_completed', expect.objectContaining({ orderId: ORDER_ID }));
  });

  it('should reject completion without a credential', async () => {
    const { useCase, sessionRepo } = makeUseCase();
    sessionRepo.findById.mockResolvedValue(createSession());

    await expect(useCase.execute(new CompleteChannelSessionCommand(CHANNEL_SESSION_ID, INTEGRATION_ID))).rejects.toThrow(
      DelegatedPaymentError,
    );
  });

  it('should throw when session belongs to another channel', async () => {
    const { useCase, sessionRepo } = makeUseCase();
    sessionRepo.findById.mockResolvedValue(createSession());

    await expect(
      useCase.execute(new CompleteChannelSessionCommand(CHANNEL_SESSION_ID, 'other-integration', undefined, PAYMENT_DATA)),
    ).rejects.toThrow(ChannelSessionNotFoundError);
  });

  it('should return the finished session when already completed', async () => {
    const { useCase, sessionRepo, checkout } = makeUseCase();
    const completed = createSession();
    completed.markCompleting();
    completed.markCompleted(ORDER_ID, 'ORD-1');
    sessionRepo.findById.mockResolvedValue(completed);
    sessionRepo.findByCheckoutId.mockResolvedValue(completed);

    const response = await useCase.execute(new CompleteChannelSessionCommand(CHANNEL_SESSION_ID, INTEGRATION_ID, undefined, PAYMENT_DATA));

    expect(checkout.createPaymentIntent).not.toHaveBeenCalled();
    expect(response.status).toBe('completed');
  });

  it('should revert to active and emit failure when payment throws', async () => {
    const { useCase, sessionRepo, checkout } = makeUseCase();
    const session = createSession();
    sessionRepo.findById.mockResolvedValue(session);
    checkout.createPaymentIntent.mockRejectedValue(new Error('gateway declined'));

    await expect(
      useCase.execute(new CompleteChannelSessionCommand(CHANNEL_SESSION_ID, INTEGRATION_ID, undefined, PAYMENT_DATA)),
    ).rejects.toThrow('gateway declined');

    expect(session.status).toBe('active');
    expect(emitMock).toHaveBeenCalledWith('agenticCheckout.session_failed', expect.any(Object));
  });

  it('should reject a canceled session', async () => {
    const { useCase, sessionRepo } = makeUseCase();
    const session = createSession();
    session.markCanceled();
    sessionRepo.findById.mockResolvedValue(session);

    await expect(
      useCase.execute(new CompleteChannelSessionCommand(CHANNEL_SESSION_ID, INTEGRATION_ID, undefined, PAYMENT_DATA)),
    ).rejects.toThrow(ChannelSessionNotMutableError);
  });
});
