import '../../tests/testUtils';
import { ReactivateCustomerUseCase, ReactivateCustomerCommand } from './ReactivateCustomer';
import { CustomerNotFoundError, CustomerValidationError } from '../../domain/errors/CustomerErrors';
import { createCustomerRepository, createCustomerRow, emitMock } from '../../tests/testUtils';

describe('ReactivateCustomerUseCase', () => {
  const customerRepository = createCustomerRepository();
  const useCase = new ReactivateCustomerUseCase(customerRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    customerRepository.findById.mockResolvedValue(createCustomerRow({ isActive: false }));
    customerRepository.save.mockImplementation(async c => c);
  });

  it('should reactivate the customer and emit customer.reactivated', async () => {
    const result = await useCase.execute(new ReactivateCustomerCommand('cust-1'));

    expect(result.success).toBe(true);
    expect(customerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: true }));
    expect(emitMock).toHaveBeenCalledWith('customer.reactivated', { customerId: 'cust-1' });
  });

  it('should throw CustomerValidationError when customerId is empty', async () => {
    await expect(useCase.execute(new ReactivateCustomerCommand(''))).rejects.toThrow(CustomerValidationError);
    expect(customerRepository.save).not.toHaveBeenCalled();
  });

  it('should throw CustomerNotFoundError when the customer does not exist', async () => {
    customerRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(new ReactivateCustomerCommand('missing'))).rejects.toThrow(CustomerNotFoundError);
    expect(customerRepository.save).not.toHaveBeenCalled();
  });

  it('should throw CustomerValidationError when the customer is already active', async () => {
    customerRepository.findById.mockResolvedValue(createCustomerRow({ isActive: true }));

    await expect(useCase.execute(new ReactivateCustomerCommand('cust-1'))).rejects.toThrow(CustomerValidationError);
    expect(customerRepository.save).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
