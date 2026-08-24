jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { DeleteCustomerUseCase, DeleteCustomerCommand } from './DeleteCustomer';
import { CustomerNotFoundError, CustomerValidationError } from '../../domain/errors/CustomerErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('DeleteCustomerUseCase', () => {
  let useCase: DeleteCustomerUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue({ customerId: 'c1', email: 'test@test.com' }),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new DeleteCustomerUseCase(mockRepo as never);
  });

  it('should delete customer (happy path)', async () => {
    const result = await useCase.execute(new DeleteCustomerCommand('c1', 'GDPR request'));

    expect(result.success).toBe(true);
    expect(result.customerId).toBe('c1');
    expect(mockRepo.delete).toHaveBeenCalledWith('c1');
    expect(eventBus.emit).toHaveBeenCalledWith('customer.deleted', expect.objectContaining({ customerId: 'c1', reason: 'GDPR request' }));
  });

  it('should throw CustomerValidationError when customerId is empty', async () => {
    await expect(useCase.execute(new DeleteCustomerCommand(''))).rejects.toThrow(CustomerValidationError);
  });

  it('should throw CustomerNotFoundError when customer does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new DeleteCustomerCommand('missing'))).rejects.toThrow(CustomerNotFoundError);
  });
});
