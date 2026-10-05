/**
 * Cancel Channel Session Use Case
 *
 * ACP cancelCheckoutSession: abandons the internal checkout (releasing
 * basket/reservations via the normal checkout path) and marks the channel
 * session canceled.
 */

import type { ChannelSessionRepository } from '../../domain/repositories/ChannelSessionRepository';
import type { ChannelCheckoutPort } from '../ports/ChannelCheckoutPort';
import { ChannelSessionNotFoundError, ChannelSessionNotMutableError } from '../../domain/errors/AgenticCheckoutErrors';
import { toAcpSession, type AcpCheckoutSession } from '../services/CheckoutSessionTranslator';

export class CancelChannelSessionCommand {
  constructor(
    public readonly channelSessionId: string,
    public readonly integrationId: string,
  ) {}
}

export class CancelChannelSessionUseCase {
  constructor(
    private readonly channelSessionRepository: ChannelSessionRepository,
    private readonly checkout: ChannelCheckoutPort,
  ) {}

  async execute(command: CancelChannelSessionCommand): Promise<AcpCheckoutSession> {
    const session = await this.channelSessionRepository.findById(command.channelSessionId);
    if (!session || session.integrationId !== command.integrationId) {
      throw new ChannelSessionNotFoundError(command.channelSessionId);
    }

    if (session.status === 'completed') {
      // Completed sessions can't be canceled through the checkout path —
      // cancellation/refund flows through order management instead.
      throw new ChannelSessionNotMutableError(session.channelSessionId, 'completed');
    }

    if (session.checkoutId && session.isMutable) {
      try {
        await this.checkout.abandonCheckout(session.checkoutId);
      } catch {
        // Basket/checkout may already be released — cancellation is idempotent
      }
    }

    session.markCanceled();
    await this.channelSessionRepository.save(session);

    const checkout = session.checkoutId ? await this.checkout.getCheckout(session.checkoutId) : null;
    const basket = session.basketId ? await this.checkout.getBasket(session.basketId) : null;

    return toAcpSession({ session, checkout, basketItems: basket?.items ?? [] });
  }
}
