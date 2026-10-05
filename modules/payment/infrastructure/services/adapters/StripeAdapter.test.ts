import * as crypto from 'crypto';
import { StripeAdapter } from './StripeAdapter';

describe('StripeAdapter', () => {
  let adapter: StripeAdapter;

  beforeEach(() => {
    adapter = new StripeAdapter();
  });

  it('should have provider "stripe"', () => {
    expect(adapter.provider).toBe('stripe');
  });

  it('should return false when no stripe-signature header', () => {
    const result = adapter.verifySignature(Buffer.from('body'), {}, 'secret');
    expect(result).toBe(false);
  });

  it('should return false when signature header missing t or v1', () => {
    const result = adapter.verifySignature(Buffer.from('body'), { 'stripe-signature': 't=123' }, 'secret');
    expect(result).toBe(false);
  });

  it('should verify valid signature', () => {
    const secret = 'whsec_test';
    const body = '{"type":"test"}';
    const timestamp = '1234567890';
    const signed = `${timestamp}.${body}`;
    const sig = crypto.createHmac('sha256', secret).update(signed).digest('hex');
    const header = `t=${timestamp},v1=${sig}`;

    const result = adapter.verifySignature(Buffer.from(body), { 'stripe-signature': header }, secret);
    expect(result).toBe(true);
  });

  it('should normalize payment_intent.succeeded event', () => {
    const result = adapter.normalize({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123' } },
    });

    expect(result).not.toBeNull();
    expect(result?.type).toBe('payment_succeeded');
    expect(result?.externalTransactionId).toBe('pi_123');
  });

  it('should normalize payment_intent.payment_failed event', () => {
    const result = adapter.normalize({
      type: 'payment_intent.payment_failed',
      data: { object: { id: 'pi_456', last_payment_error: { code: 'card_declined', message: 'Card declined' } } },
    });

    expect(result).not.toBeNull();
    expect(result?.type).toBe('payment_failed');
    expect(result?.errorCode).toBe('card_declined');
    expect(result?.errorMessage).toBe('Card declined');
  });

  it('should return null for unknown event type', () => {
    const result = adapter.normalize({
      type: 'unknown.event',
      data: { object: { id: 'x' } },
    });

    expect(result).toBeNull();
  });

  it('should return null when no externalTransactionId', () => {
    const result = adapter.normalize({ type: 'payment_intent.succeeded', data: {} });
    expect(result).toBeNull();
  });

  describe('initiatePayment', () => {
    const config = { apiKey: 'sk_test_xxx', webhookSecret: 'whsec_xxx', testMode: true };
    const request = { orderId: 'order-1', amountCents: 48.18, currency: 'USD' };

    function lastRequestBody(): URLSearchParams {
      const call = jest.mocked(fetch).mock.calls[0];
      return call[1]?.body as URLSearchParams;
    }

    beforeEach(() => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => ({ id: 'pi_123', status: 'succeeded' }),
      })) as unknown as typeof fetch;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should send the delegated token as payment_method with confirm=true', async () => {
      await adapter.initiatePayment({ ...request, paymentMethodToken: 'spt_token_123' }, config);

      const body = lastRequestBody();
      expect(body.get('payment_method')).toBe('spt_token_123');
      expect(body.get('confirm')).toBe('true');
    });

    it('should not send payment_method or confirm for regular intents', async () => {
      await adapter.initiatePayment(request, config);

      const body = lastRequestBody();
      expect(body.get('payment_method')).toBeNull();
      expect(body.get('confirm')).toBeNull();
    });

    it('should map a succeeded response to captured', async () => {
      const result = await adapter.initiatePayment({ ...request, paymentMethodToken: 'spt_token_123' }, config);

      expect(result.success).toBe(true);
      expect(result.status).toBe('captured');
      expect(result.externalTransactionId).toBe('pi_123');
    });

    it('should map a Stripe error response to a failed result', async () => {
      global.fetch = jest.fn(async () => ({
        ok: false,
        json: async () => ({ error: { code: 'card_declined', message: 'Card declined' } }),
      })) as unknown as typeof fetch;

      const result = await adapter.initiatePayment({ ...request, paymentMethodToken: 'spt_bad' }, config);

      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
      expect(result.errorCode).toBe('card_declined');
    });
  });
});
