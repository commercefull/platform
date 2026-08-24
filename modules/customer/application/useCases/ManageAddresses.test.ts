/**
 * Unit Tests for ManageAddresses Use Case
 */

jest.mock('../../../../libs/uuid', () => ({
  __esModule: true,
  generateUUID: jest.fn(() => 'addr-uuid-123'),
}));

import {
  ManageAddressesUseCase,
  AddAddressCommand,
  UpdateAddressCommand,
  DeleteAddressCommand,
  SetDefaultAddressCommand,
} from './ManageAddresses';
import { CustomerNotFoundError } from '../../domain/errors/CustomerErrors';
import { generateUUID } from '../../../../libs/uuid';

describe('ManageAddressesUseCase', () => {
  let useCase: ManageAddressesUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue({ customerId: 'cust-1' }),
      addAddress: jest.fn(),
      updateAddress: jest.fn(),
      deleteAddress: jest.fn(),
      setDefaultAddress: jest.fn(),
      getAddresses: jest.fn(),
    };
    useCase = new ManageAddressesUseCase(mockRepo as never as ConstructorParameters<typeof ManageAddressesUseCase>[0]);
    jest.mocked(generateUUID).mockReturnValue('addr-uuid-123');
  });

  describe('addAddress', () => {
    it('should add a new address', async () => {
      const result = await useCase.addAddress(
        new AddAddressCommand(
          'cust-1',
          '123 Main St',
          'Portland',
          'OR',
          '97201',
          'US',
          'US',
          'shipping',
        ),
      );

      expect(result.addressId).toBe('addr-uuid-123');
      expect(result.addressLine1).toBe('123 Main St');
      expect(result.city).toBe('Portland');
      expect(mockRepo.addAddress).toHaveBeenCalledWith('cust-1', expect.objectContaining({
        customerAddressId: 'addr-uuid-123',
        addressLine1: '123 Main St',
      }));
    });

    it('should throw CustomerNotFoundError when customer does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        useCase.addAddress(
          new AddAddressCommand('cust-x', '123 Main St', 'Portland', 'OR', '97201', 'US', 'US', 'shipping'),
        ),
      ).rejects.toThrow(CustomerNotFoundError);
    });
  });

  describe('updateAddress', () => {
    it('should update an existing address', async () => {
      mockRepo.updateAddress.mockResolvedValue({
        customerAddressId: 'addr-1',
        addressLine1: '456 Oak Ave',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        country: 'US',
        addressType: 'shipping',
        isDefault: false,
      });

      const result = await useCase.updateAddress(
        new UpdateAddressCommand('cust-1', 'addr-1', { addressLine1: '456 Oak Ave' }),
      );

      expect(result.addressId).toBe('addr-1');
      expect(result.addressLine1).toBe('456 Oak Ave');
      expect(mockRepo.updateAddress).toHaveBeenCalledWith('addr-1', { addressLine1: '456 Oak Ave' });
    });

    it('should throw CustomerNotFoundError when customer does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        useCase.updateAddress(new UpdateAddressCommand('cust-x', 'addr-1', {})),
      ).rejects.toThrow(CustomerNotFoundError);
    });
  });

  describe('deleteAddress', () => {
    it('should delete an address', async () => {
      await useCase.deleteAddress(new DeleteAddressCommand('cust-1', 'addr-1'));

      expect(mockRepo.deleteAddress).toHaveBeenCalledWith('addr-1');
    });

    it('should throw CustomerNotFoundError when customer does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        useCase.deleteAddress(new DeleteAddressCommand('cust-x', 'addr-1')),
      ).rejects.toThrow(CustomerNotFoundError);
    });
  });

  describe('setDefaultAddress', () => {
    it('should set default address', async () => {
      await useCase.setDefaultAddress(
        new SetDefaultAddressCommand('cust-1', 'addr-1', 'shipping'),
      );

      expect(mockRepo.setDefaultAddress).toHaveBeenCalledWith('cust-1', 'addr-1', 'shipping');
    });

    it('should throw CustomerNotFoundError when customer does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        useCase.setDefaultAddress(new SetDefaultAddressCommand('cust-x', 'addr-1', 'shipping')),
      ).rejects.toThrow(CustomerNotFoundError);
    });
  });

  describe('getAddresses', () => {
    it('should return all addresses for a customer', async () => {
      mockRepo.getAddresses.mockResolvedValue([
        {
          customerAddressId: 'addr-1',
          addressLine1: '123 Main St',
          city: 'Portland',
          state: 'OR',
          postalCode: '97201',
          country: 'US',
          addressType: 'shipping',
          isDefault: true,
        },
        {
          customerAddressId: 'addr-2',
          addressLine1: '456 Oak Ave',
          city: 'Seattle',
          state: 'WA',
          postalCode: '98101',
          country: 'US',
          addressType: 'billing',
          isDefault: false,
        },
      ]);

      const result = await useCase.getAddresses('cust-1');

      expect(result).toHaveLength(2);
      expect(result[0].addressId).toBe('addr-1');
      expect(result[1].addressId).toBe('addr-2');
    });

    it('should throw CustomerNotFoundError when customer does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(useCase.getAddresses('cust-x')).rejects.toThrow(CustomerNotFoundError);
    });
  });
});
