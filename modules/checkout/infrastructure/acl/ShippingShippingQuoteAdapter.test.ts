/* eslint-disable @typescript-eslint/no-require-imports */

describe('ShippingShippingQuoteAdapter', () => {
  let adapter: import('./ShippingShippingQuoteAdapter').ShippingShippingQuoteAdapter;
  let mockShippingUseCase: { execute: jest.Mock };

  beforeEach(() => {
    mockShippingUseCase = {
      execute: jest.fn(),
    };
    const { ShippingShippingQuoteAdapter } = require('./ShippingShippingQuoteAdapter');
    adapter = new ShippingShippingQuoteAdapter(mockShippingUseCase as never);
  });

  it('implements ShippingQuotePort', () => {
    expect(typeof adapter.getShippingOptions).toBe('function');
  });

  it('should return empty array when use case is not provided', async () => {
    const { ShippingShippingQuoteAdapter } = require('./ShippingShippingQuoteAdapter');
    const noUseCaseAdapter = new ShippingShippingQuoteAdapter(undefined);
    const result = await noUseCaseAdapter.getShippingOptions({
      basketId: 'basket-1',
      shippingAddress: { country: 'US' },
    });
    expect(result).toEqual([]);
  });

  it('should map shipping rates to checkout vocabulary', async () => {
    mockShippingUseCase.execute.mockResolvedValue({
      success: true,
      rates: [
        {
          shippingMethodId: 'method-1',
          shippingMethodName: 'Standard',
          shippingMethodCode: 'STD',
          shippingCarrierId: 'UPS',
          rateId: 'rate-1',
          rateName: 'Ground',
          rateType: 'flat',
          amount: 9.99,
          currency: 'USD',
          estimatedDeliveryDays: 5,
          isFreeShipping: false,
          taxable: true,
        },
      ],
    });

    const result = await adapter.getShippingOptions({
      basketId: 'basket-1',
      shippingAddress: { country: 'US', region: 'OR', city: 'Portland', postalCode: '97201' },
      totalValue: 100,
    });

    expect(result).toHaveLength(1);
    expect(result[0].methodId).toBe('method-1');
    expect(result[0].methodName).toBe('Standard');
    expect(result[0].amount).toBe(9.99);
    expect(result[0].currency).toBe('USD');
    expect(result[0].estimatedDays).toBe(5);
    expect(result[0].carrier).toBe('UPS');
  });

  it('should return empty array when shipping calculation fails', async () => {
    mockShippingUseCase.execute.mockResolvedValue({
      success: false,
      rates: null,
    });

    const result = await adapter.getShippingOptions({
      basketId: 'basket-1',
      shippingAddress: { country: 'US' },
    });

    expect(result).toEqual([]);
  });

  it('should return empty array when use case throws', async () => {
    mockShippingUseCase.execute.mockRejectedValue(new Error('Network error'));

    const result = await adapter.getShippingOptions({
      basketId: 'basket-1',
      shippingAddress: { country: 'US' },
    });

    expect(result).toEqual([]);
  });

  it('should map estimatedDeliveryDays null to undefined', async () => {
    mockShippingUseCase.execute.mockResolvedValue({
      success: true,
      rates: [
        {
          shippingMethodId: 'm1',
          shippingMethodName: 'Express',
          shippingCarrierId: null,
          rateId: 'r1',
          rateName: null,
          rateType: 'flat',
          amount: 19.99,
          currency: 'USD',
          estimatedDeliveryDays: null,
          isFreeShipping: false,
          taxable: false,
          shippingMethodCode: 'EXP',
        },
      ],
    });

    const result = await adapter.getShippingOptions({
      basketId: 'basket-1',
      shippingAddress: { country: 'US' },
    });

    expect(result[0].estimatedDays).toBeUndefined();
    expect(result[0].carrier).toBeUndefined();
  });
});
