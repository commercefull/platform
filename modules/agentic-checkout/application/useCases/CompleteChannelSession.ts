/**
 * Complete Channel Session Use Case
 *
 * ACP completeCheckoutSession: applies `payment_data` (delegated credential
 * such as a Stripe Shared Payment Token), runs payment intent + completion,
 * and returns the finished session with its order reference.
 */

import type { ChannelSessionRepository } from '../../domain/repositories/ChannelSessionRepository';
import type { ChannelCheckoutPort, DelegatedCredential } from '../ports/ChannelCheckoutPort';
import type { DelegatedPaymentPort } from '../ports/DelegatedPaymentPort';
import {
  ChannelSessionNotFoundError,
  ChannelSessionNotMutableError,
  DelegatedPaymentError,
} from '../../domain/errors/AgenticCheckoutErrors';
import { toAcpSession, type AcpCheckoutSession } from '../services/CheckoutSessionTranslator';
import { eventBus } from '../../../../libs/events/eventBus';

export class CompleteChannelSessionCommand {
  constructor(
    public readonly channelSessionId: string,
    public readonly integrationId: string,
    public readonly buyer?: { first_name?: string; last_name?: string; email?: string; phone?: string },
    public readonly paymentData?: {
      handler_id?: string;
      instrument?: {
        type?: string;
        credential?: { type?: string; token?: string };
      };
    },
  ) {}
}

export class CompleteChannelSessionUseCase {
  constructor(
    private readonly channelSessionRepository: ChannelSessionRepository,
    private readonly checkout: ChannelCheckoutPort,
    private readonly delegatedPayment: DelegatedPaymentPort,
  ) {}

  async execute(command: CompleteChannelSessionCommand): Promise<AcpCheckoutSession> {
    const session = await this.channelSessionRepository.findById(command.channelSessionId);
    if (!session || session.integrationId !== command.integrationId) {
      throw new ChannelSessionNotFoundError(command.channelSessionId);
    }

    // Already completed → return the finished session (idempotent at use-case level)
    if (session.status === 'completed' && session.checkoutId) {
      return this.render(session.checkoutId, session.basketId);
    }
    if (!session.isMutable || !session.checkoutId || !session.basketId) {
      throw new ChannelSessionNotMutableError(session.channelSessionId, session.effectiveStatus);
    }

    const credential = command.paymentData?.instrument?.credential;
    if (!credential?.token || !credential.type) {
      throw new DelegatedPaymentError('payment_data.instrument.credential with type and token is required');
    }

    const delegated: DelegatedCredential = {
      provider: command.paymentData?.handler_id ?? 'default',
      credentialType: credential.type,
      token: credential.token,
    };

    if (command.buyer) {
      session.setBuyer({
        firstName: command.buyer.first_name,
        lastName: command.buyer.last_name,
        email: command.buyer.email,
        phone: command.buyer.phone,
      });
    }

    session.markCompleting();
    await this.channelSessionRepository.save(session);

    try {
      // Delegated credential rides session metadata → payment module
      await this.checkout.attachDelegatedPayment(session.checkoutId, delegated);

      const intent = await this.checkout.createPaymentIntent(session.checkoutId);

      // No client-side confirm exists on agentic surfaces — charge the
      // delegated token synchronously through the payment module's PSP routing.
      const snapshot = await this.checkout.getCheckout(session.checkoutId);
      await this.delegatedPayment.chargeDelegatedPayment({
        organizationId: session.organizationId,
        orderId: intent.orderId,
        transactionId: intent.paymentIntentId,
        amountCents: snapshot?.totalCents ?? 0,
        currency: snapshot?.currency ?? 'usd',
        credential: delegated,
        customerEmail: session.buyer?.email ?? snapshot?.guestEmail,
      });

      const result = await this.checkout.completeCheckout(session.checkoutId);

      session.markCompleted(result.orderId, intent.orderNumber);
      await this.channelSessionRepository.save(session);

      eventBus.emit('agenticCheckout.session_completed', {
        channelSessionId: session.channelSessionId,
        integrationId: session.integrationId,
        storeId: session.storeId,
        checkoutId: session.checkoutId,
        orderId: result.orderId,
        orderNumber: intent.orderNumber,
        paymentIntentId: intent.paymentIntentId,
      });
    } catch (err) {
      eventBus.emit('agenticCheckout.session_failed', {
        channelSessionId: session.channelSessionId,
        integrationId: session.integrationId,
        error: err instanceof Error ? err.message : String(err),
      });
      // Roll back to active so the surface can retry with a different
      // credential instead of leaving the session stuck in 'completing'.
      session.revertToActive();
      await this.channelSessionRepository.save(session);
      throw err;
    }

    return this.render(session.checkoutId, session.basketId);
  }

  private async render(checkoutId: string, basketId: string | null): Promise<AcpCheckoutSession> {
    const checkout = await this.checkout.getCheckout(checkoutId);
    const basket = basketId ? await this.checkout.getBasket(basketId) : null;
    const session = await this.channelSessionRepository.findByCheckoutId(checkoutId);
    if (!session) {
      throw new ChannelSessionNotFoundError(checkoutId);
    }
    return toAcpSession({ session, checkout, basketItems: basket?.items ?? [] });
  }
}
