jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { DeactivateCustomerUseCase, DeactivateCustomerCommand } from './DeactivateCustomer';
import { CustomerNotFoundError, CustomerValidationError } from '../../domain/errors/CustomerErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('DeactivateCustomerUseCase', () => {
  let useCase: DeactivateCustomerUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue({ customerId: 'c1', isActive: true, updatedAt: new Date() }),
      save: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new DeactivateCustomerUseCase(mockRepo as never);
  });

  it('should deactivate customer (happy path)', async () => {
    const result = await useCase.execute(new DeactivateCustomerCommand('c1', 'User request'));

    expect(result.success).toBe(true);
    expect(result.customerId).toBe('c1');
    expect(mockRepo.save).toHaveBeenCalled();
    expect(eventBus.emit).toHaveBeenCalledWith('customer.deactivated', expect.objectContaining({ customerId: 'c1', reason: 'User request' }));
  });

  it('should throw CustomerValidationError when customerId is empty', async () => {
    await expect(useCase.execute(new DeactivateCustomerCommand(''))).rejects.toThrow(CustomerValidationError);
  });

  it('should throw CustomerNotFoundError when customer does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new DeactivateCustomerCommand('missing'))).rejects.toThrow(CustomerNotFoundError);
  });

  it('should throw CustomerValidationError when already deactivated', async () => {
    mockRepo.findById.mockResolvedValue({ customerId: 'c1', isActive: false, updatedAt: new Date() });

    await expect(useCase.execute(new DeactivateCustomerCommand('c1'))).rejects.toThrow(CustomerValidationError);
  });
});
