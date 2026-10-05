/**
 * Get Channel Session Use Case
 *
 * ACP getCheckoutSession: returns the authoritative cart state for the
 * surface, scoped to the calling channel's integration.
 */

import type { ChannelSessionRepository } from '../../domain/repositories/ChannelSessionRepository';
import type { ChannelCheckoutPort } from '../ports/ChannelCheckoutPort';
import { ChannelSessionNotFoundError } from '../../domain/errors/AgenticCheckoutErrors';
import { toAcpSession, type AcpCheckoutSession } from '../services/CheckoutSessionTranslator';

export class GetChannelSessionCommand {
  constructor(
    public readonly channelSessionId: string,
    public readonly integrationId: string,
  ) {}
}

export class GetChannelSessionUseCase {
  constructor(
    private readonly channelSessionRepository: ChannelSessionRepository,
    private readonly checkout: ChannelCheckoutPort,
  ) {}

  async execute(command: GetChannelSessionCommand): Promise<AcpCheckoutSession> {
    const session = await this.channelSessionRepository.findById(command.channelSessionId);
    if (!session || session.integrationId !== command.integrationId) {
      throw new ChannelSessionNotFoundError(command.channelSessionId);
    }

    const checkout = session.checkoutId ? await this.checkout.getCheckout(session.checkoutId) : null;
    const basket = session.basketId ? await this.checkout.getBasket(session.basketId) : null;
    const shippingOptions = checkout?.shippingAddress ? await this.safeShippingOptions(checkout.checkoutId) : [];

    return toAcpSession({
      session,
      checkout,
      basketItems: basket?.items ?? [],
      shippingOptions,
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
