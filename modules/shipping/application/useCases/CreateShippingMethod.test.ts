jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { CreateShippingMethodUseCase} from './CreateShippingMethod';
import { ShippingValidationError } from '../../domain/errors/ShippingErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('CreateShippingMethodUseCase', () => {
  let useCase: CreateShippingMethodUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findMethodByCode: jest.fn().mockResolvedValue(null),
      saveMethod: jest.fn().mockImplementation(async (m: unknown) => m),
    };
    useCase = new CreateShippingMethodUseCase(mockRepo as never);
  });

  it('should create shipping method (happy path)', async () => {
    const result = await useCase.execute({
      name: 'Standard Shipping', code: 'std', type: 'flat_rate' as never, basePrice: 9.99,
    });

    expect(result.shippingMethod.name).toBe('Standard Shipping');
    expect(eventBus.emit).toHaveBeenCalledWith('shipping.method_created', expect.objectContaining({ name: 'Standard Shipping' }));
  });

  it('should throw ShippingValidationError when code already exists', async () => {
    mockRepo.findMethodByCode.mockResolvedValue({ shippingMethodId: 'existing', code: 'std' });

    await expect(useCase.execute({
      name: 'Test', code: 'std', type: 'flat_rate' as never, basePrice: 5,
    })).rejects.toThrow(ShippingValidationError);
  });
});
