jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { VerifyCustomerUseCase, VerifyCustomerCommand } from './VerifyCustomer';
import { CustomerNotFoundError, CustomerValidationError, CustomerAlreadyVerifiedError } from '../../domain/errors/CustomerErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('VerifyCustomerUseCase', () => {
  let useCase: VerifyCustomerUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue({ customerId: 'c1', email: 'test@test.com', isVerified: false }),
      verifyEmail: jest.fn().mockResolvedValue(undefined),
      verifyPhone: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new VerifyCustomerUseCase(mockRepo as never);
  });

  it('should verify customer email (happy path)', async () => {
    const result = await useCase.execute(new VerifyCustomerCommand('c1', 'email'));

    expect(result.success).toBe(true);
    expect(result.customerId).toBe('c1');
    expect(mockRepo.verifyEmail).toHaveBeenCalledWith('c1');
    expect(eventBus.emit).toHaveBeenCalledWith('customer.verified', expect.objectContaining({ customerId: 'c1' }));
  });

  it('should verify customer phone', async () => {
    await useCase.execute(new VerifyCustomerCommand('c1', 'phone'));

    expect(mockRepo.verifyPhone).toHaveBeenCalledWith('c1');
  });

  it('should throw CustomerValidationError when customerId is empty', async () => {
    await expect(useCase.execute(new VerifyCustomerCommand(''))).rejects.toThrow(CustomerValidationError);
  });

  it('should throw CustomerNotFoundError when customer does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new VerifyCustomerCommand('missing'))).rejects.toThrow(CustomerNotFoundError);
  });

  it('should throw CustomerAlreadyVerifiedError when already verified', async () => {
    mockRepo.findById.mockResolvedValue({ customerId: 'c1', email: 'test@test.com', isVerified: true });

    await expect(useCase.execute(new VerifyCustomerCommand('c1'))).rejects.toThrow(CustomerAlreadyVerifiedError);
  });
});
