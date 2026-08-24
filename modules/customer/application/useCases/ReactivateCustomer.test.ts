jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { ReactivateCustomerUseCase, ReactivateCustomerCommand } from './ReactivateCustomer';
import { CustomerNotFoundError, CustomerValidationError } from '../../domain/errors/CustomerErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('ReactivateCustomerUseCase', () => {
  let useCase: ReactivateCustomerUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue({ customerId: 'c1', isActive: false, updatedAt: new Date() }),
      save: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ReactivateCustomerUseCase(mockRepo as never);
  });

  it('should reactivate customer (happy path)', async () => {
    const result = await useCase.execute(new ReactivateCustomerCommand('c1'));

    expect(result.success).toBe(true);
    expect(result.customerId).toBe('c1');
    expect(eventBus.emit).toHaveBeenCalledWith('customer.reactivated', expect.objectContaining({ customerId: 'c1' }));
  });

  it('should throw CustomerValidationError when customerId is empty', async () => {
    await expect(useCase.execute(new ReactivateCustomerCommand(''))).rejects.toThrow(CustomerValidationError);
  });

  it('should throw CustomerNotFoundError when customer does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new ReactivateCustomerCommand('missing'))).rejects.toThrow(CustomerNotFoundError);
  });

  it('should throw CustomerValidationError when already active', async () => {
    mockRepo.findById.mockResolvedValue({ customerId: 'c1', isActive: true, updatedAt: new Date() });

    await expect(useCase.execute(new ReactivateCustomerCommand('c1'))).rejects.toThrow(CustomerValidationError);
  });
});
