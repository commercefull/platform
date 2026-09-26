import { AdjustCustomerPointsUseCase, type AdjustCustomerPointsPort } from './AdjustCustomerPoints';
import { LoyaltyValidationError } from '../../domain/errors/LoyaltyErrors';

const lazyMock = <T extends object>(): jest.Mocked<T> => {
  const fns = new Map<PropertyKey, jest.Mock>();
  return new Proxy({} as object, {
    get: (_t, prop) => {
      if (!fns.has(prop)) fns.set(prop, jest.fn());
      return fns.get(prop);
    },
  }) as jest.Mocked<T>;
};

describe('AdjustCustomerPointsUseCase', () => {
  let port: jest.Mocked<AdjustCustomerPointsPort>;
  let useCase: AdjustCustomerPointsUseCase;

  beforeEach(() => {
    port = lazyMock<AdjustCustomerPointsPort>();
    useCase = new AdjustCustomerPointsUseCase(port);
  });

  it('should reject when points is missing', async () => {
    await expect(useCase.execute({ customerId: 'c-1' })).rejects.toBeInstanceOf(LoyaltyValidationError);
    expect(port.adjustCustomerPoints).not.toHaveBeenCalled();
  });

  it('should initialize against the requested tier when the customer has no points record', async () => {
    port.findCustomerPoints.mockResolvedValue(null);
    port.adjustCustomerPoints.mockResolvedValue({ customerId: 'c-1' });

    await useCase.execute({ customerId: 'c-1', points: 100, tierId: 'tier-2' });

    expect(port.initializeCustomerPoints).toHaveBeenCalledWith('c-1', 'tier-2');
    expect(port.adjustCustomerPoints).toHaveBeenCalledWith('c-1', 100, 'Manual adjustment by admin');
  });

  it('should skip initialization when the customer already has points', async () => {
    port.findCustomerPoints.mockResolvedValue({ customerId: 'c-1' });
    port.adjustCustomerPoints.mockResolvedValue({ customerId: 'c-1' });

    await useCase.execute({ customerId: 'c-1', points: '50', tierId: 'tier-2', reason: 'Goodwill' });

    expect(port.initializeCustomerPoints).not.toHaveBeenCalled();
    expect(port.adjustCustomerPoints).toHaveBeenCalledWith('c-1', 50, 'Goodwill');
  });

  it('should not initialize when no tierId is given', async () => {
    port.adjustCustomerPoints.mockResolvedValue({ customerId: 'c-1' });

    await useCase.execute({ customerId: 'c-1', points: -20 });

    expect(port.findCustomerPoints).not.toHaveBeenCalled();
    expect(port.adjustCustomerPoints).toHaveBeenCalledWith('c-1', -20, 'Manual adjustment by admin');
  });
});
