import '../../tests/testUtils';
import { DeleteCustomerUseCase, DeleteCustomerCommand } from './DeleteCustomer';
import { CustomerNotFoundError, CustomerValidationError } from '../../domain/errors/CustomerErrors';
import { createCustomerRepository, createCustomerRow, emitMock } from '../../tests/testUtils';

describe('DeleteCustomerUseCase', () => {
  const customerRepository = createCustomerRepository();
  const useCase = new DeleteCustomerUseCase(customerRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    customerRepository.findById.mockResolvedValue(createCustomerRow());
    customerRepository.delete.mockResolvedValue(undefined);
  });

  it('should delete the customer and emit customer.deleted', async () => {
    const result = await useCase.execute(new DeleteCustomerCommand('cust-1'));

    expect(result.success).toBe(true);
    expect(customerRepository.delete).toHaveBeenCalledWith('cust-1');
    expect(emitMock).toHaveBeenCalledWith('customer.deleted', expect.objectContaining({ customerId: 'cust-1' }));
  });

  it('should throw CustomerValidationError when customerId is empty', async () => {
    await expect(useCase.execute(new DeleteCustomerCommand(''))).rejects.toThrow(CustomerValidationError);
    expect(customerRepository.delete).not.toHaveBeenCalled();
  });

  it('should throw CustomerNotFoundError when the customer does not exist', async () => {
    customerRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(new DeleteCustomerCommand('missing'))).rejects.toThrow(CustomerNotFoundError);
    expect(customerRepository.delete).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
