import * as crypto from 'crypto';
import { GenericAdapter } from './GenericAdapter';

describe('GenericAdapter', () => {
  let adapter: GenericAdapter;

  beforeEach(() => {
    adapter = new GenericAdapter();
  });

  it('should have provider "generic"', () => {
    expect(adapter.provider).toBe('generic');
  });

  it('should return false when no signature header', () => {
    const result = adapter.verifySignature(Buffer.from('body'), {}, 'secret');
    expect(result).toBe(false);
  });

  it('should verify valid signature with sha256= prefix', () => {
    const secret = 'test_secret';
    const body = Buffer.from('{"test":true}');
    const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');

    const result = adapter.verifySignature(body, { 'x-webhook-signature': `sha256=${sig}` }, secret);
    expect(result).toBe(true);
  });

  it('should verify valid signature without prefix', () => {
    const secret = 'test_secret';
    const body = Buffer.from('{"test":true}');
    const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');

    const result = adapter.verifySignature(body, { 'x-webhook-signature': sig }, secret);
    expect(result).toBe(true);
  });

  it('should normalize payment_succeeded event', () => {
    const result = adapter.normalize({
      type: 'payment_succeeded',
      externalTransactionId: 'tx_123',
    });

    expect(result).not.toBeNull();
    expect(result?.type).toBe('payment_succeeded');
    expect(result?.externalTransactionId).toBe('tx_123');
  });

  it('should normalize payment_failed event', () => {
    const result = adapter.normalize({
      type: 'payment_failed',
      externalTransactionId: 'tx_456',
      errorCode: 'declined',
      errorMessage: 'Card declined',
    });

    expect(result).not.toBeNull();
    expect(result?.type).toBe('payment_failed');
    expect(result?.errorCode).toBe('declined');
  });

  it('should return null for unknown type', () => {
    const result = adapter.normalize({ type: 'unknown', externalTransactionId: 'tx' });
    expect(result).toBeNull();
  });

  it('should return null when no externalTransactionId', () => {
    const result = adapter.normalize({ type: 'payment_succeeded' });
    expect(result).toBeNull();
  });
});
