/**
 * CheckoutSessionTranslator unit tests
 */

import '../../tests/testUtils';
import { mapChannelStatus, toAcpSession, ACP_PROTOCOL_VERSION } from './CheckoutSessionTranslator';
import { createSession, createCheckoutSnapshot } from '../../tests/testUtils';

describe('mapChannelStatus', () => {
  it('should map active+ready checkout to ready_for_payment', () => {
    const session = createSession();
    expect(mapChannelStatus(session, createCheckoutSnapshot({ isReadyForPayment: true }))).toBe('ready_for_payment');
  });

  it('should map active+unready checkout to not_ready_for_payment', () => {
    const session = createSession();
    expect(mapChannelStatus(session, createCheckoutSnapshot({ isReadyForPayment: false }))).toBe('not_ready_for_payment');
  });

  it('should map pending payment to complete_in_progress', () => {
    const session = createSession();
    expect(mapChannelStatus(session, createCheckoutSnapshot({ paymentStatus: 'pending_payment' }))).toBe('complete_in_progress');
  });

  it('should map completed/canceled/expired directly', () => {
    const session = createSession();
    session.markCompleting();
    session.markCompleted('order-1');
    expect(mapChannelStatus(session, null)).toBe('completed');

    const canceled = createSession();
    canceled.markCanceled();
    expect(mapChannelStatus(canceled, null)).toBe('canceled');
  });
});

describe('toAcpSession', () => {
  it('should render ACP session schema with totals and line items', () => {
    const session = createSession();
    const checkout = createCheckoutSnapshot();
    const response = toAcpSession({
      session,
      checkout,
      basketItems: [
        {
          basketItemId: 'item-1',
          productId: 'prod-1',
          sku: 'SKU-1',
          name: 'Test Product',
          quantity: 2,
          unitPriceCents: 1000,
          lineTotalCents: 2000,
        },
      ],
    });

    expect(response.id).toBe(session.channelSessionId);
    expect(response.currency).toBe('usd');
    expect(response.capabilities.api_version).toBe(ACP_PROTOCOL_VERSION);
    expect(response.line_items[0]).toMatchObject({
      id: 'item-1',
      item: { id: 'prod-1', quantity: 2 },
      base_amount: 1000,
      total: 2000,
    });
    expect(response.totals.map(t => t.type)).toEqual(['subtotal', 'fulfillment', 'tax', 'total']);
    expect(response.totals.find(t => t.type === 'total')?.amount).toBe(2659);
  });

  it('should include fulfillment options with the selected method flagged', () => {
    const session = createSession();
    const response = toAcpSession({
      session,
      checkout: createCheckoutSnapshot({ shippingMethodId: 'ship-2', shippingMethodName: 'Express' }),
      basketItems: [],
      shippingOptions: [
        { methodId: 'ship-1', methodName: 'Standard', amountCents: 500, currency: 'USD' },
        { methodId: 'ship-2', methodName: 'Express', amountCents: 1500, currency: 'USD' },
      ],
    });

    expect(response.fulfillment_options).toHaveLength(2);
    expect(response.fulfillment_options?.[1].selected).toBe(true);
  });

  it('should include order reference when session is completed', () => {
    const session = createSession();
    session.markCompleting();
    session.markCompleted('order-9', 'ORD-9');
    const response = toAcpSession({ session, checkout: createCheckoutSnapshot(), basketItems: [] });

    expect(response.status).toBe('completed');
    expect(response.order).toEqual({ id: 'order-9', number: 'ORD-9' });
  });
});
