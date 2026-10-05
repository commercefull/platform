/**
 * CancelChannelSession unit tests
 */

import '../../tests/testUtils';
import { CancelChannelSessionUseCase, CancelChannelSessionCommand } from './CancelChannelSession';
import { ChannelSessionNotFoundError, ChannelSessionNotMutableError } from '../../domain/errors/AgenticCheckoutErrors';
import { makeSessionRepo, makeCheckoutPort, createSession, CHANNEL_SESSION_ID, INTEGRATION_ID } from '../../tests/testUtils';

function makeUseCase() {
  const sessionRepo = makeSessionRepo();
  const checkout = makeCheckoutPort();
  return { useCase: new CancelChannelSessionUseCase(sessionRepo, checkout), sessionRepo, checkout };
}

describe('CancelChannelSessionUseCase', () => {
  it('should abandon the checkout and mark the session canceled', async () => {
    const { useCase, sessionRepo, checkout } = makeUseCase();
    sessionRepo.findById.mockResolvedValue(createSession());

    const response = await useCase.execute(new CancelChannelSessionCommand(CHANNEL_SESSION_ID, INTEGRATION_ID));

    expect(checkout.abandonCheckout).toHaveBeenCalled();
    expect(sessionRepo.save).toHaveBeenCalled();
    expect(response.status).toBe('canceled');
  });

  it('should be idempotent when the checkout is already released', async () => {
    const { useCase, sessionRepo, checkout } = makeUseCase();
    sessionRepo.findById.mockResolvedValue(createSession());
    checkout.abandonCheckout.mockRejectedValue(new Error('already abandoned'));

    const response = await useCase.execute(new CancelChannelSessionCommand(CHANNEL_SESSION_ID, INTEGRATION_ID));
    expect(response.status).toBe('canceled');
  });

  it('should reject cancellation of a completed session', async () => {
    const { useCase, sessionRepo } = makeUseCase();
    const session = createSession();
    session.markCompleting();
    session.markCompleted('order-1');
    sessionRepo.findById.mockResolvedValue(session);

    await expect(useCase.execute(new CancelChannelSessionCommand(CHANNEL_SESSION_ID, INTEGRATION_ID))).rejects.toThrow(
      ChannelSessionNotMutableError,
    );
  });

  it('should scope sessions to the calling channel', async () => {
    const { useCase, sessionRepo } = makeUseCase();
    sessionRepo.findById.mockResolvedValue(createSession());

    await expect(useCase.execute(new CancelChannelSessionCommand(CHANNEL_SESSION_ID, 'other-integration'))).rejects.toThrow(
      ChannelSessionNotFoundError,
    );
  });
});
