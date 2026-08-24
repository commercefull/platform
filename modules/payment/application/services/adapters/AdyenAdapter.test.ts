import * as crypto from 'crypto';
import { AdyenAdapter } from './AdyenAdapter';

describe('AdyenAdapter', () => {
  let adapter: AdyenAdapter;

  beforeEach(() => {
    adapter = new AdyenAdapter();
  });

  it('should have provider "adyen"', () => {
    expect(adapter.provider).toBe('adyen');
  });

  it('should verify signature via X-Webhook-Signature header', () => {
    const secret = 'test_secret';
    const body = Buffer.from('{"test":true}');
    const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');

    const result = adapter.verifySignature(body, { 'x-webhook-signature': sig }, secret);
    expect(result).toBe(true);
  });

  it('should return false when no signature header and invalid body', () => {
    const result = adapter.verifySignature(Buffer.from('not json'), {}, 'secret');
    expect(result).toBe(false);
  });

  it('should normalize successful payment event', () => {
    const result = adapter.normalize({
      notificationItems: [
        {
          NotificationRequestItem: {
            pspReference: 'PSP_123',
            eventCode: 'AUTHORISATION',
            success: 'true',
            amount: { value: 5000, currency: 'USD' },
          },
        },
      ],
    });

    expect(result).not.toBeNull();
    expect(result?.externalTransactionId).toBe('PSP_123');
  });

  it('should return null for empty notification', () => {
    const result = adapter.normalize({ notificationItems: [] });
    expect(result).toBeNull();
  });
});
