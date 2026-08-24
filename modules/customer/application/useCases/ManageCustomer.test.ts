jest.mock('../../infrastructure/repositories/CustomerDataRepository', () => ({
  __esModule: true,
  default: {
    customers: {
      findById: jest.fn().mockResolvedValue({ customerId: 'c1' }),
      findByEmail: jest.fn().mockResolvedValue({ customerId: 'c1' }),
      findAll: jest.fn().mockResolvedValue({ data: [{ customerId: 'c1' }], total: 1 }),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(1),
      updateLastLogin: jest.fn().mockResolvedValue(undefined),
      getPasswordHash: jest.fn().mockResolvedValue('hash'),
      updatePasswordHash: jest.fn().mockResolvedValue(undefined),
      recordLogin: jest.fn().mockResolvedValue(undefined),
      recordFailedLogin: jest.fn().mockResolvedValue(undefined),
    },
    addresses: {
      findByCustomerId: jest.fn().mockResolvedValue([{ addressId: 'a1' }]),
      findById: jest.fn().mockResolvedValue({ addressId: 'a1' }),
      create: jest.fn().mockResolvedValue({ addressId: 'a2' }),
      update: jest.fn().mockResolvedValue(undefined),
      softDelete: jest.fn().mockResolvedValue(undefined),
      findActiveByCustomerId: jest.fn().mockResolvedValue([{ addressId: 'a1' }]),
      findActiveById: jest.fn().mockResolvedValue({ addressId: 'a1' }),
    },
    wishlist: {
      findByCustomer: jest.fn().mockResolvedValue([{ productId: 'p1' }]),
      findExisting: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    },
  },
}));

import { ManageCustomersUseCase, ManageCustomerAddressesUseCase, ManageWishlistUseCase } from './ManageCustomer';
import customerDataRepository from '../../infrastructure/repositories/CustomerDataRepository';

const mockRepo = customerDataRepository as unknown as { customers: Record<string, jest.Mock>; addresses: Record<string, jest.Mock>; wishlist: Record<string, jest.Mock> };

describe('ManageCustomersUseCase', () => {
  let useCase: ManageCustomersUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageCustomersUseCase();
  });

  it('should find by ID', async () => {
    const result = await useCase.findById('c1');
    expect(result).toEqual({ customerId: 'c1' });
    expect(mockRepo.customers.findById).toHaveBeenCalledWith('c1');
  });

  it('should find by email', async () => {
    await useCase.findByEmail('test@test.com');
    expect(mockRepo.customers.findByEmail).toHaveBeenCalledWith('test@test.com');
  });

  it('should find all', async () => {
    const result = await useCase.findAll();
    expect(result.data).toHaveLength(1);
  });

  it('should save customer', async () => {
    await useCase.save({ customerId: 'c1' } as never);
    expect(mockRepo.customers.save).toHaveBeenCalled();
  });

  it('should delete customer', async () => {
    await useCase.delete('c1');
    expect(mockRepo.customers.delete).toHaveBeenCalledWith('c1');
  });

  it('should get password hash', async () => {
    const result = await useCase.getPasswordHash('c1');
    expect(result).toBe('hash');
  });
});

describe('ManageCustomerAddressesUseCase', () => {
  let useCase: ManageCustomerAddressesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageCustomerAddressesUseCase();
  });

  it('should find by customer ID', async () => {
    const result = await useCase.findByCustomerId('c1');
    expect(result).toHaveLength(1);
  });

  it('should create address', async () => {
    await useCase.create({ customerId: 'c1' } as never);
    expect(mockRepo.addresses.create).toHaveBeenCalled();
  });
});

describe('ManageWishlistUseCase', () => {
  let useCase: ManageWishlistUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageWishlistUseCase();
  });

  it('should find by customer', async () => {
    const result = await useCase.findByCustomer('c1');
    expect(result).toHaveLength(1);
  });

  it('should create wishlist item', async () => {
    await useCase.create('c1', 'p1');
    expect(mockRepo.wishlist.create).toHaveBeenCalledWith('c1', 'p1');
  });
});
