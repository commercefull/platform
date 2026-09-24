import '../../tests/testUtils';
import { ManageStorefrontAddressesUseCase } from './ManageStorefrontAddresses';
import { createCustomerAddressRepository, createCustomerAddressRow } from '../../tests/testUtils';

describe('ManageStorefrontAddressesUseCase', () => {
  const addressRepository = createCustomerAddressRepository();
  const useCase = new ManageStorefrontAddressesUseCase(addressRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the active addresses for the customer', async () => {
    addressRepository.findActiveByCustomerId.mockResolvedValue([createCustomerAddressRow()]);

    const result = await useCase.findActiveByCustomerId('cust-1');

    expect(result).toHaveLength(1);
    expect(addressRepository.findActiveByCustomerId).toHaveBeenCalledWith('cust-1');
  });

  it('should return the active address for the given id', async () => {
    addressRepository.findActiveById.mockResolvedValue(createCustomerAddressRow());

    const result = await useCase.findActiveById('addr-1', 'cust-1');

    expect(result?.customerAddressId).toBe('addr-1');
    expect(addressRepository.findActiveById).toHaveBeenCalledWith('addr-1', 'cust-1');
  });

  it('should delegate address creation', async () => {
    addressRepository.create.mockResolvedValue(createCustomerAddressRow());

    const result = await useCase.create({ customerId: 'cust-1', addressLine1: '123 St' });

    expect(result.customerAddressId).toBe('addr-1');
    expect(addressRepository.create).toHaveBeenCalledWith({ customerId: 'cust-1', addressLine1: '123 St' });
  });

  it('should delegate soft deletion', async () => {
    addressRepository.softDelete.mockResolvedValue(true);

    const result = await useCase.softDelete('addr-1', 'cust-1');

    expect(result).toBe(true);
    expect(addressRepository.softDelete).toHaveBeenCalledWith('addr-1', 'cust-1');
  });

  it('should delegate unsetting other defaults', async () => {
    addressRepository.unsetDefaultsExcept.mockResolvedValue(undefined);

    await useCase.unsetDefaultsExcept('cust-1', 'addr-1');

    expect(addressRepository.unsetDefaultsExcept).toHaveBeenCalledWith('cust-1', 'addr-1');
  });
});
