/**
 * ChannelSession entity unit tests
 */

import '../../tests/testUtils';
import { ChannelSession } from './ChannelSession';
import { INTEGRATION_ID, ORG_ID, STORE_ID } from '../../tests/testUtils';

describe('ChannelSession', () => {
  it('should create an active session with 24h expiry when created', () => {
    const session = ChannelSession.create({
      integrationId: INTEGRATION_ID,
      organizationId: ORG_ID,
      storeId: STORE_ID,
    });

    expect(session.status).toBe('active');
    expect(session.isMutable).toBe(true);
    expect(session.basketId).toBeNull();
    expect(session.checkoutId).toBeNull();
    expect(session.orderId).toBeNull();
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('should link basket and checkout when attachCheckout is called', () => {
    const session = ChannelSession.create({
      integrationId: INTEGRATION_ID,
      organizationId: ORG_ID,
      storeId: STORE_ID,
    });
    session.attachCheckout('basket-1', 'checkout-1');

    expect(session.basketId).toBe('basket-1');
    expect(session.checkoutId).toBe('checkout-1');
  });

  it('should become immutable when completed', () => {
    const session = ChannelSession.create({
      integrationId: INTEGRATION_ID,
      organizationId: ORG_ID,
      storeId: STORE_ID,
      basketId: 'b',
      checkoutId: 'c',
    });
    session.markCompleting();
    session.markCompleted('order-1', 'ORD-1');

    expect(session.status).toBe('completed');
    expect(session.isMutable).toBe(false);
    expect(session.orderId).toBe('order-1');
    expect(session.metadata?.orderNumber).toBe('ORD-1');
  });

  it('should revert to active from completing after a failed payment', () => {
    const session = ChannelSession.create({
      integrationId: INTEGRATION_ID,
      organizationId: ORG_ID,
      storeId: STORE_ID,
    });
    session.markCompleting();
    session.revertToActive();

    expect(session.status).toBe('active');
    expect(session.isMutable).toBe(true);
  });

  it('should not revert a completed session to active', () => {
    const session = ChannelSession.create({
      integrationId: INTEGRATION_ID,
      organizationId: ORG_ID,
      storeId: STORE_ID,
    });
    session.markCompleting();
    session.markCompleted('order-1');
    session.revertToActive();

    expect(session.status).toBe('completed');
  });

  it('should report expired effectiveStatus when past expiresAt', () => {
    const session = ChannelSession.reconstitute({
      channelSessionId: 'cs-1',
      integrationId: INTEGRATION_ID,
      organizationId: ORG_ID,
      storeId: STORE_ID,
      basketId: null,
      checkoutId: null,
      orderId: null,
      status: 'active',
      buyer: null,
      fulfillmentDetails: null,
      attribution: null,
      metadata: null,
      createdAt: new Date(Date.now() - 48 * 3600_000),
      updatedAt: new Date(Date.now() - 48 * 3600_000),
      expiresAt: new Date(Date.now() - 3600_000),
    });

    expect(session.effectiveStatus).toBe('expired');
    expect(session.isMutable).toBe(false);
  });

  it('should merge buyer and attribution fields when updated', () => {
    const session = ChannelSession.create({
      integrationId: INTEGRATION_ID,
      organizationId: ORG_ID,
      storeId: STORE_ID,
      buyer: { firstName: 'Ada' },
    });
    session.setBuyer({ email: 'ada@example.com' });
    session.setAttribution({ surface: 'chatgpt' });

    expect(session.buyer?.firstName).toBe('Ada');
    expect(session.buyer?.email).toBe('ada@example.com');
    expect(session.attribution?.surface).toBe('chatgpt');
  });
});
