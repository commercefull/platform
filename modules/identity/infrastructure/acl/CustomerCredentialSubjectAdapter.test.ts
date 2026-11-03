import { CustomerCredentialSubjectAdapter } from './CustomerCredentialSubjectAdapter';
import type { CustomerCredentialRepository } from '../../../customer/domain/repositories/CustomerCredentialRepository';
import type { CustomerRepository } from '../../../customer/domain/repositories/CustomerRepository';
import type { CustomerRecord } from '../../../customer/domain/entities/CustomerModel';

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn(), registerHandler: jest.fn() },
}));
jest.mock('../../../../libs/uuid', () => ({
  generateUUID: jest.fn(() => 'new-cust-id'),
}));
jest.mock('../../../../libs/hash', () => ({
  hashString: jest.fn(async () => 'hashed-password'),
  compareString: jest.fn(async () => true),
}));
jest.mock('../../../../libs/db', () => ({
  withTransaction: jest.fn(async (fn: () => Promise<unknown>) => fn()),
}));

describe('CustomerCredentialSubjectAdapter', () => {
  let adapter: CustomerCredentialSubjectAdapter;
  let mockCredentials: jest.Mocked<
    Pick<
      CustomerCredentialRepository,
      | 'authenticate'
      | 'changePassword'
      | 'createEmailVerificationToken'
      | 'verifyEmailVerificationToken'
      | 'createPasswordResetToken'
      | 'verifyPasswordResetToken'
    >
  >;
  let mockCustomers: jest.Mocked<Pick<CustomerRepository, 'findById' | 'findByEmail' | 'save' | 'updatePassword' | 'updateLastLogin'>>;

  beforeEach(() => {
    mockCredentials = {
      authenticate: jest.fn(),
      changePassword: jest.fn(),
      createEmailVerificationToken: jest.fn(),
      verifyEmailVerificationToken: jest.fn(),
      createPasswordResetToken: jest.fn(),
      verifyPasswordResetToken: jest.fn(),
    };
    mockCustomers = {
      findById: jest.fn(),
      findByEmail: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation(async c => c),
      updatePassword: jest.fn().mockResolvedValue(undefined),
      updateLastLogin: jest.fn().mockResolvedValue(undefined),
    };
    adapter = new CustomerCredentialSubjectAdapter(mockCredentials, mockCustomers as unknown as CustomerRepository);
  });

  it('implements CredentialSubjectPort', () => {
    expect(typeof adapter.authenticate).toBe('function');
    expect(typeof adapter.findById).toBe('function');
    expect(typeof adapter.findByEmail).toBe('function');
    expect(typeof adapter.createWithPassword).toBe('function');
    expect(typeof adapter.updateLoginTimestamp).toBe('function');
    expect(typeof adapter.changePassword).toBe('function');
    expect(typeof adapter.createPasswordResetToken).toBe('function');
    expect(typeof adapter.verifyPasswordResetToken).toBe('function');
  });

  it('should authenticate and map to CredentialSubject', async () => {
    mockCredentials.authenticate.mockResolvedValue({
      customerId: 'cust-1',
      email: 'test@test.com',
      firstName: 'John',
      lastName: 'Doe',
    } as unknown as CustomerRecord);

    const result = await adapter.authenticate('test@test.com', 'password');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('cust-1');
    expect(result!.email).toBe('test@test.com');
    expect(result!.firstName).toBe('John');
    expect(result!.lastName).toBe('Doe');
  });

  it('should return null when authentication fails', async () => {
    mockCredentials.authenticate.mockResolvedValue(null);

    const result = await adapter.authenticate('test@test.com', 'wrong');

    expect(result).toBeNull();
  });

  it('should find by id and map to CredentialSubject', async () => {
    mockCustomers.findById.mockResolvedValue({
      customerId: 'cust-1',
      email: 'test@test.com',
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
      isVerified: true,
      lastLoginAt: new Date('2024-01-01'),
    } as unknown as CustomerRecord);

    const result = await adapter.findById('cust-1');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('cust-1');
    expect(result!.isActive).toBe(true);
    expect(result!.isVerified).toBe(true);
  });

  it('should return null when id not found', async () => {
    mockCustomers.findById.mockResolvedValue(null);

    const result = await adapter.findById('nonexistent');

    expect(result).toBeNull();
  });

  it('should find by email and map to CredentialSubject', async () => {
    mockCustomers.findByEmail.mockResolvedValue({
      customerId: 'cust-1',
      email: 'test@test.com',
      isActive: true,
    } as unknown as CustomerRecord);

    const result = await adapter.findByEmail('test@test.com');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('cust-1');
    expect(result!.email).toBe('test@test.com');
  });

  it('should create via RegisterCustomerUseCase and map to CredentialSubject', async () => {
    const result = await adapter.createWithPassword({
      email: 'new@test.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Smith',
    });

    expect(mockCustomers.findByEmail).toHaveBeenCalledWith('new@test.com');
    expect(mockCustomers.save).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@test.com', firstName: 'Jane', lastName: 'Smith' }),
    );
    expect(mockCustomers.updatePassword).toHaveBeenCalledWith('new-cust-id', 'hashed-password');
    expect(result.id).toBe('new-cust-id');
    expect(result.email).toBe('new@test.com');
    expect(result.firstName).toBe('Jane');
  });

  it('should create a passwordless account when password is empty', async () => {
    const result = await adapter.createWithPassword({
      email: 'sso@test.com',
      password: '',
      firstName: '',
      lastName: '',
      isVerified: true,
    });

    expect(result.id).toBe('new-cust-id');
    expect(result.isVerified).toBe(true);
    expect(mockCustomers.save).toHaveBeenCalledWith(expect.objectContaining({ password: '' }));
    expect(mockCustomers.updatePassword).not.toHaveBeenCalled();
  });

  it('should delegate updateLoginTimestamp', async () => {
    mockCustomers.updateLastLogin.mockResolvedValue(undefined);

    await adapter.updateLoginTimestamp('cust-1');

    expect(mockCustomers.updateLastLogin).toHaveBeenCalledWith('cust-1');
  });

  it('should delegate changePassword', async () => {
    mockCredentials.changePassword.mockResolvedValue(true);

    await adapter.changePassword('cust-1', 'newpass');

    expect(mockCredentials.changePassword).toHaveBeenCalledWith('cust-1', 'newpass');
  });

  it('should delegate createPasswordResetToken', async () => {
    mockCredentials.createPasswordResetToken.mockResolvedValue('reset-token-123');

    const result = await adapter.createPasswordResetToken('cust-1');

    expect(result).toBe('reset-token-123');
  });

  it('should delegate verifyPasswordResetToken', async () => {
    mockCredentials.verifyPasswordResetToken.mockResolvedValue('cust-1');

    const result = await adapter.verifyPasswordResetToken('token');

    expect(result).toBe('cust-1');
  });

  it('should return null for invalid reset token', async () => {
    mockCredentials.verifyPasswordResetToken.mockResolvedValue(null);

    const result = await adapter.verifyPasswordResetToken('invalid');

    expect(result).toBeNull();
  });
});
