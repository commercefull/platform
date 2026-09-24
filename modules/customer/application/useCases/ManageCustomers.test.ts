import '../../tests/testUtils';
import { ManageCustomersUseCase } from './ManageCustomers';
import { createCustomerRepository, createCustomerRow } from '../../tests/testUtils';

describe('ManageCustomersUseCase', () => {
  const customerRepository = createCustomerRepository();
  const useCase = new ManageCustomersUseCase(customerRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the customer for the given id', async () => {
    customerRepository.findById.mockResolvedValue(createCustomerRow());

    const result = await useCase.findById('cust-1');

    expect(result?.customerId).toBe('cust-1');
    expect(customerRepository.findById).toHaveBeenCalledWith('cust-1');
  });

  it('should return the customer for the given email', async () => {
    customerRepository.findByEmail.mockResolvedValue(createCustomerRow());

    const result = await useCase.findByEmail('jane@example.com');

    expect(result?.email).toBe('jane@example.com');
  });

  it('should forward filters and pagination to findAll', async () => {
    customerRepository.findAll.mockResolvedValue({ data: [createCustomerRow()], total: 1, limit: 10, offset: 0, hasMore: false, length: 1 });

    const result = await useCase.findAll({ status: 'active' }, { limit: 10 });

    expect(result.total).toBe(1);
    expect(customerRepository.findAll).toHaveBeenCalledWith({ status: 'active' }, { limit: 10 });
  });

  it('should persist the customer through save', async () => {
    const customer = createCustomerRow();
    customerRepository.save.mockResolvedValue(customer);

    const result = await useCase.save(customer);

    expect(result.customerId).toBe('cust-1');
    expect(customerRepository.save).toHaveBeenCalledWith(customer);
  });

  it('should delegate delete to the repository', async () => {
    customerRepository.delete.mockResolvedValue(undefined);

    await useCase.delete('cust-1');

    expect(customerRepository.delete).toHaveBeenCalledWith('cust-1');
  });

  it('should return the stored password hash', async () => {
    customerRepository.getPasswordHash.mockResolvedValue('hash-abc');

    const result = await useCase.getPasswordHash('cust-1');

    expect(result).toBe('hash-abc');
  });

  it('should delegate password hash updates', async () => {
    customerRepository.updatePasswordHash.mockResolvedValue(undefined);

    await useCase.updatePasswordHash('cust-1', 'new-hash');

    expect(customerRepository.updatePasswordHash).toHaveBeenCalledWith('cust-1', 'new-hash');
  });
});

