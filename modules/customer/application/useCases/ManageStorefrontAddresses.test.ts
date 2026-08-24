jest.mock('../../infrastructure/repositories/CustomerDataRepository', () => ({
  __esModule: true,
  default: {
    addresses: {
      findActiveByCustomerId: jest.fn().mockResolvedValue([{ addressId: 'a1', customerId: 'c1' }]),
      findActiveById: jest.fn().mockResolvedValue({ addressId: 'a1', customerId: 'c1' }),
      create: jest.fn().mockResolvedValue({ addressId: 'a2' }),
      update: jest.fn().mockResolvedValue(undefined),
      softDelete: jest.fn().mockResolvedValue(undefined),
      unsetDefaultsExcept: jest.fn().mockResolvedValue(undefined),
    },
    wishlist: {},
    customers: {},
  },
}));

import { ManageStorefrontAddressesUseCase } from './ManageStorefrontAddresses';
import customerDataRepository from '../../infrastructure/repositories/CustomerDataRepository';

const mockRepo = customerDataRepository as unknown as { addresses: Record<string, jest.Mock> };

describe('ManageStorefrontAddressesUseCase', () => {
  let useCase: ManageStorefrontAddressesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageStorefrontAddressesUseCase();
  });

  it('should find active by customer ID', async () => {
    const result = await useCase.findActiveByCustomerId('c1');
    expect(result).toHaveLength(1);
  });

  it('should find active by ID', async () => {
    const result = await useCase.findActiveById('a1', 'c1');
    expect(result).toEqual({ addressId: 'a1', customerId: 'c1' });
  });

  it('should create address', async () => {
    const result = await useCase.create({ customerId: 'c1', firstName: 'John', lastName: 'Doe', addressLine1: '123 Main', city: 'NYC', postalCode: '10001', country: 'US' });
    expect(result).toEqual({ addressId: 'a2' });
  });

  it('should soft delete address', async () => {
    await useCase.softDelete('a1', 'c1');
    expect(mockRepo.addresses.softDelete).toHaveBeenCalledWith('a1', 'c1');
  });

  it('should unset defaults except', async () => {
    await useCase.unsetDefaultsExcept('c1', 'a1');
    expect(mockRepo.addresses.unsetDefaultsExcept).toHaveBeenCalledWith('c1', 'a1');
  });
});
