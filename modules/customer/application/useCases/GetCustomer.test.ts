/**
 * Unit Tests for GetCustomer Use Case
 */

import { GetCustomerUseCase, GetCustomerCommand } from './GetCustomer';
import { CustomerValidationError } from '../../domain/errors/CustomerErrors';

describe('GetCustomerUseCase', () => {
  let useCase: GetCustomerUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      getAddresses: jest.fn(),
      getCustomerGroupIds: jest.fn(),
    };
    useCase = new GetCustomerUseCase(mockRepo as never as ConstructorParameters<typeof GetCustomerUseCase>[0]);
  });

  function createCustomerRecord() {
    return {
      customerId: 'cust-1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-1234',
      dateOfBirth: new Date('1990-01-15'),
      isActive: true,
      isVerified: true,
      timezone: 'en',
      taxExempt: false,
      tags: ['vip'],
      failedLoginAttempts: 5,
      lastLoginAt: new Date('2024-06-01'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-06-01'),
    };
  }

  it('should throw when neither customerId nor email provided', () => {
    expect(() => new GetCustomerCommand()).toThrow(CustomerValidationError);
  });

  it('should find customer by ID and map to response', async () => {
    mockRepo.findById.mockResolvedValue(createCustomerRecord());
    mockRepo.getAddresses.mockResolvedValue([]);
    mockRepo.getCustomerGroupIds.mockResolvedValue(['grp-1']);

    const result = await useCase.execute(new GetCustomerCommand('cust-1'));

    expect(result).not.toBeNull();
    expect(result!.customerId).toBe('cust-1');
    expect(result!.email).toBe('john@example.com');
    expect(result!.fullName).toBe('John Doe');
    expect(result!.isActive).toBe(true);
    expect(result!.isVerified).toBe(true);
    expect(result!.groupIds).toEqual(['grp-1']);
    expect(result!.tags).toEqual(['vip']);
    expect(mockRepo.findById).toHaveBeenCalledWith('cust-1');
  });

  it('should find customer by email', async () => {
    mockRepo.findByEmail.mockResolvedValue(createCustomerRecord());
    mockRepo.getAddresses.mockResolvedValue([]);
    mockRepo.getCustomerGroupIds.mockResolvedValue([]);

    const result = await useCase.execute(new GetCustomerCommand(undefined, 'john@example.com'));

    expect(result).not.toBeNull();
    expect(result!.customerId).toBe('cust-1');
    expect(mockRepo.findByEmail).toHaveBeenCalledWith('john@example.com');
  });

  it('should return null when customer not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    const result = await useCase.execute(new GetCustomerCommand('cust-x'));

    expect(result).toBeNull();
  });

  it('should map addresses to response format', async () => {
    mockRepo.findById.mockResolvedValue(createCustomerRecord());
    mockRepo.getAddresses.mockResolvedValue([
      {
        customerAddressId: 'addr-1',
        addressLine1: '123 Main St',
        addressLine2: 'Apt 2',
        city: 'Portland',
        state: 'OR',
        postalCode: '97201',
        country: 'US',
        addressType: 'shipping',
        isDefault: true,
        phone: '555-9999',
      },
    ]);
    mockRepo.getCustomerGroupIds.mockResolvedValue([]);

    const result = await useCase.execute(new GetCustomerCommand('cust-1'));

    expect(result!.addresses).toHaveLength(1);
    expect(result!.addresses[0].addressId).toBe('addr-1');
    expect(result!.addresses[0].addressLine1).toBe('123 Main St');
    expect(result!.addresses[0].isDefault).toBe(true);
  });

  it('should handle null firstName/lastName gracefully', async () => {
    const record = createCustomerRecord() as Record<string, unknown>;
    record.firstName = null;
    record.lastName = null;
    mockRepo.findById.mockResolvedValue(record);
    mockRepo.getAddresses.mockResolvedValue([]);
    mockRepo.getCustomerGroupIds.mockResolvedValue([]);

    const result = await useCase.execute(new GetCustomerCommand('cust-1'));

    expect(result!.firstName).toBe('');
    expect(result!.lastName).toBe('');
    expect(result!.fullName).toBe('');
  });
});
