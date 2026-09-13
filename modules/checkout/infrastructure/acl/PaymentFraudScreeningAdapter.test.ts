/**
 * Unit Tests for PaymentFraudScreeningAdapter (Epic G)
 */

jest.mock('../../../payment/application/services/FraudScreeningService', () => ({
  FraudScreeningService: jest.fn().mockImplementation(() => ({
    screen: jest.fn(),
  })),
}));

import { PaymentFraudScreeningAdapter } from './PaymentFraudScreeningAdapter';
import { FraudScreeningService } from '../../../payment/application/services/FraudScreeningService';

describe('PaymentFraudScreeningAdapter', () => {
  let adapter: PaymentFraudScreeningAdapter;
  let mockScreen: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockScreen = jest.fn();
    jest.mocked(FraudScreeningService).mockImplementation(
      () =>
        ({
          screen: mockScreen,
        }) as never,
    );
    adapter = new PaymentFraudScreeningAdapter();
  });

  it('maps approved screening result to checkout vocabulary', async () => {
    mockScreen.mockResolvedValue({
      decision: 'approved',
      riskScore: 0,
      riskLevel: 'low',
      status: 'passed',
      triggeredRules: [],
      signals: {},
    });

    const result = await adapter.screenOrder({
      checkoutId: 'ck-1',
      orderAmount: 100,
      currency: 'USD',
    });

    expect(result.decision).toBe('approved');
    expect(result.riskScore).toBe(0);
    expect(result.riskLevel).toBe('low');
    expect(result.triggeredRules).toEqual([]);
  });

  it('maps blocked screening result with triggered rules', async () => {
    mockScreen.mockResolvedValue({
      decision: 'blocked',
      riskScore: 100,
      riskLevel: 'critical',
      status: 'blocked',
      triggeredRules: [{ fraudRuleId: 'r1', name: 'Blacklist IP', ruleType: 'blacklist', action: 'block', riskScore: 100 }],
      signals: { blacklistHit: { hit: true, type: 'ip' } },
    });

    const result = await adapter.screenOrder({
      checkoutId: 'ck-1',
      ipAddress: '1.2.3.4',
      orderAmount: 100,
      currency: 'USD',
    });

    expect(result.decision).toBe('blocked');
    expect(result.riskScore).toBe(100);
    expect(result.triggeredRules).toEqual([{ ruleId: 'r1', name: 'Blacklist IP', action: 'block' }]);
  });

  it('maps review screening result', async () => {
    mockScreen.mockResolvedValue({
      decision: 'review',
      riskScore: 50,
      riskLevel: 'medium',
      status: 'flagged',
      triggeredRules: [{ fraudRuleId: 'r1', name: 'High Amount', ruleType: 'amount', action: 'review', riskScore: 50 }],
      signals: {},
    });

    const result = await adapter.screenOrder({
      checkoutId: 'ck-1',
      orderAmount: 600,
      currency: 'USD',
    });

    expect(result.decision).toBe('review');
    expect(result.riskLevel).toBe('medium');
  });

  it('passes checkout request fields to the fraud screening service', async () => {
    mockScreen.mockResolvedValue({
      decision: 'approved',
      riskScore: 0,
      riskLevel: 'low',
      status: 'passed',
      triggeredRules: [],
      signals: {},
    });

    await adapter.screenOrder({
      checkoutId: 'ck-1',
      customerId: 'cust-1',
      customerEmail: 'test@test.com',
      ipAddress: '1.2.3.4',
      billingCountry: 'US',
      shippingCountry: 'CA',
      orderAmount: 200,
      currency: 'USD',
      paymentMethodId: 'pm1',
      isFirstOrder: true,
      isGuestCheckout: false,
    });

    expect(mockScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'cust-1',
        email: 'test@test.com',
        ipAddress: '1.2.3.4',
        billingCountry: 'US',
        shippingCountry: 'CA',
        orderAmount: 200,
        currency: 'USD',
        paymentMethod: 'pm1',
        isFirstOrder: true,
        isGuestCheckout: false,
      }),
    );
  });
});
