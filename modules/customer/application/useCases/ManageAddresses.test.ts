import '../../tests/testUtils';
import {
  ManageAddressesUseCase,
  AddAddressCommand,
  UpdateAddressCommand,
  DeleteAddressCommand,
  SetDefaultAddressCommand,
} from './ManageAddresses';
import { CustomerAddressNotFoundError, CustomerNotFoundError } from '../../domain/errors/CustomerErrors';
import { createCustomerRepository, createCustomerRow, createCustomerAddressRow, uuidMock } from '../../tests/testUtils';

describe('ManageAddressesUseCase', () => {
  const customerRepository = createCustomerRepository();
  const useCase = new ManageAddressesUseCase(customerRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    uuidMock.mockReturnValue('new-addr-id');
    customerRepository.findById.mockResolvedValue(createCustomerRow());
    customerRepository.getAddresses.mockResolvedValue([createCustomerAddressRow({ customerAddressId: 'addr-1' })]);
  });

  describe('addAddress', () => {
    it('should create the address with a generated id and persist it', async () => {
      customerRepository.addAddress.mockResolvedValue(createCustomerAddressRow());

      const result = await useCase.addAddress(
        new AddAddressCommand('cust-1', '123 Main St', 'Springfield', 'IL', '12345', 'United States', 'US', 'shipping'),
      );

      expect(result.addressId).toBe('new-addr-id');
      expect(customerRepository.addAddress).toHaveBeenCalledWith(
        'cust-1',
        expect.objectContaining({ customerAddressId: 'new-addr-id', addressLine1: '123 Main St', addressType: 'shipping' }),
      );
    });

    it('should throw CustomerNotFoundError when the customer does not exist', async () => {
      customerRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.addAddress(new AddAddressCommand('missing', '123 St', 'City', 'ST', '1', 'US', 'US', 'shipping')),
      ).rejects.toThrow(CustomerNotFoundError);
      expect(customerRepository.addAddress).not.toHaveBeenCalled();
    });
  });

  describe('updateAddress', () => {
    it('should update the address and return the mapped response', async () => {
      customerRepository.updateAddress.mockResolvedValue(
        createCustomerAddressRow({ customerAddressId: 'addr-1', city: 'Portland' }),
      );

      const result = await useCase.updateAddress(new UpdateAddressCommand('cust-1', 'addr-1', { city: 'Portland' }));

      expect(result.city).toBe('Portland');
      expect(customerRepository.updateAddress).toHaveBeenCalledWith('addr-1', { city: 'Portland' });
    });

    it('should throw CustomerNotFoundError when the customer does not exist', async () => {
      customerRepository.findById.mockResolvedValue(null);

      await expect(useCase.updateAddress(new UpdateAddressCommand('missing', 'addr-1', {}))).rejects.toThrow(
        CustomerNotFoundError,
      );
    });

    it('should throw CustomerAddressNotFoundError when the address is not owned by the customer', async () => {
      await expect(useCase.updateAddress(new UpdateAddressCommand('cust-1', 'foreign-addr', { city: 'X' }))).rejects.toThrow(
        CustomerAddressNotFoundError,
      );
      expect(customerRepository.updateAddress).not.toHaveBeenCalled();
    });
  });

  describe('deleteAddress', () => {
    it('should delete the address', async () => {
      customerRepository.deleteAddress.mockResolvedValue(undefined);

      await useCase.deleteAddress(new DeleteAddressCommand('cust-1', 'addr-1'));

      expect(customerRepository.deleteAddress).toHaveBeenCalledWith('addr-1');
    });

    it('should throw CustomerNotFoundError when the customer does not exist', async () => {
      customerRepository.findById.mockResolvedValue(null);

      await expect(useCase.deleteAddress(new DeleteAddressCommand('missing', 'addr-1'))).rejects.toThrow(
        CustomerNotFoundError,
      );
    });

    it('should throw CustomerAddressNotFoundError when the address is not owned by the customer', async () => {
      await expect(useCase.deleteAddress(new DeleteAddressCommand('cust-1', 'foreign-addr'))).rejects.toThrow(
        CustomerAddressNotFoundError,
      );
      expect(customerRepository.deleteAddress).not.toHaveBeenCalled();
    });
  });

  describe('setDefaultAddress', () => {
    it('should set the default address for the given type', async () => {
      customerRepository.setDefaultAddress.mockResolvedValue(undefined);

      await useCase.setDefaultAddress(new SetDefaultAddressCommand('cust-1', 'addr-1', 'shipping'));

      expect(customerRepository.setDefaultAddress).toHaveBeenCalledWith('cust-1', 'addr-1', 'shipping');
    });
  });

  describe('getAddresses', () => {
    it('should return all mapped addresses for the customer', async () => {
      customerRepository.getAddresses.mockResolvedValue([
        createCustomerAddressRow({ customerAddressId: 'addr-1' }),
        createCustomerAddressRow({ customerAddressId: 'addr-2', addressType: 'billing' }),
      ]);

      const result = await useCase.getAddresses('cust-1');

      expect(result).toHaveLength(2);
      expect(result[0].addressId).toBe('addr-1');
      expect(result[1].addressType).toBe('billing');
    });

    it('should throw CustomerNotFoundError when the customer does not exist', async () => {
      customerRepository.findById.mockResolvedValue(null);

      await expect(useCase.getAddresses('missing')).rejects.toThrow(CustomerNotFoundError);
    });
  });
});
