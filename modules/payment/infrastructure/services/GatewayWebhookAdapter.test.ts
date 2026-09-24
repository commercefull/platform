jest.mock('./GatewayAdapterRegistry', () => ({
  getAdapter: jest.fn(),
}));

import { getAdapter } from './GatewayAdapterRegistry';
import { GatewayWebhookAdapter } from './GatewayWebhookAdapter';

const getAdapterMock = getAdapter as jest.Mock;

describe('GatewayWebhookAdapter', () => {
  let adapter: GatewayWebhookAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new GatewayWebhookAdapter();
  });

  it('should delegate signature verification to the resolved provider adapter', () => {
    const verifySignature = jest.fn().mockReturnValue(true);
    getAdapterMock.mockReturnValue({ verifySignature });

    const headers = { 'stripe-signature': 'sig' };
    const result = adapter.verifySignature('stripe', Buffer.from('body'), headers, 'secret');

    expect(getAdapterMock).toHaveBeenCalledWith('stripe');
    expect(verifySignature).toHaveBeenCalledWith(Buffer.from('body'), headers, 'secret');
    expect(result).toBe(true);
  });

  it('should delegate normalization to the resolved provider adapter', () => {
    const event = { type: 'payment_succeeded', externalTransactionId: 'tx1' };
    const normalize = jest.fn().mockReturnValue(event);
    getAdapterMock.mockReturnValue({ normalize });

    const result = adapter.normalize('adyen', { foo: 'bar' });

    expect(getAdapterMock).toHaveBeenCalledWith('adyen');
    expect(normalize).toHaveBeenCalledWith({ foo: 'bar' });
    expect(result).toBe(event);
  });
});
