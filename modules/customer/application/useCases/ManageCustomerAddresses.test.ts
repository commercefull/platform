import '../../tests/testUtils';
import { ManageCustomerAddressesUseCase } from './ManageCustomerAddresses';
import { createCustomerAddressRepository, createCustomerAddressRow } from '../../tests/testUtils';

describe('ManageCustomerAddressesUseCase', () => {
  const addressRepository = createCustomerAddressRepository();
  const useCase = new ManageCustomerAddressesUseCase(addressRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the addresses for the given customer', async () => {
    addressRepository.findByCustomerId.mockResolvedValue([createCustomerAddressRow()]);

    const result = await useCase.findByCustomerId('cust-1');

    expect(result).toHaveLength(1);
    expect(addressRepository.findByCustomerId).toHaveBeenCalledWith('cust-1');
  });

  it('should delegate address creation', async () => {
    addressRepository.create.mockResolvedValue(createCustomerAddressRow());
    const { customerAddressId: _addressId, createdAt: _created, updatedAt: _updated, ...params } =
      createCustomerAddressRow();

    const result = await useCase.create(params);

    expect(result.customerAddressId).toBe('addr-1');
    expect(addressRepository.create).toHaveBeenCalledWith(params);
  });
});

