import '../../tests/testUtils';
import { DeactivateCustomerUseCase, DeactivateCustomerCommand } from './DeactivateCustomer';
import { CustomerNotFoundError, CustomerValidationError } from '../../domain/errors/CustomerErrors';
import { createCustomerRepository, createCustomerRow, emitMock } from '../../tests/testUtils';

describe('DeactivateCustomerUseCase', () => {
  const customerRepository = createCustomerRepository();
  const useCase = new DeactivateCustomerUseCase(customerRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    customerRepository.findById.mockResolvedValue(createCustomerRow());
    customerRepository.save.mockImplementation(async c => c);
  });

  it('should deactivate the customer and emit customer.deactivated', async () => {
    const result = await useCase.execute(new DeactivateCustomerCommand('cust-1', 'requested'));

    expect(result.success).toBe(true);
    expect(customerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
    expect(emitMock).toHaveBeenCalledWith('customer.deactivated', { customerId: 'cust-1', reason: 'requested' });
  });

  it('should throw CustomerValidationError when customerId is empty', async () => {
    await expect(useCase.execute(new DeactivateCustomerCommand(''))).rejects.toThrow(CustomerValidationError);
    expect(customerRepository.save).not.toHaveBeenCalled();
  });

  it('should throw CustomerNotFoundError when the customer does not exist', async () => {
    customerRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(new DeactivateCustomerCommand('missing'))).rejects.toThrow(CustomerNotFoundError);
    expect(customerRepository.save).not.toHaveBeenCalled();
  });

  it('should throw CustomerValidationError when the customer is already deactivated', async () => {
    customerRepository.findById.mockResolvedValue(createCustomerRow({ isActive: false }));

    await expect(useCase.execute(new DeactivateCustomerCommand('cust-1'))).rejects.toThrow(CustomerValidationError);
    expect(customerRepository.save).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
