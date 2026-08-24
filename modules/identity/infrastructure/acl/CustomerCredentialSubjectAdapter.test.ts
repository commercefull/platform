/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */

describe('CustomerCredentialSubjectAdapter', () => {
  let adapter: import('./CustomerCredentialSubjectAdapter').CustomerCredentialSubjectAdapter;
  let mockCustomerRepo: any;

  beforeEach(() => {
    mockCustomerRepo = {
      authenticateCustomer: jest.fn(),
      findCustomerById: jest.fn(),
      findCustomerByEmail: jest.fn(),
      createCustomerWithPassword: jest.fn(),
      updateCustomerLoginTimestamp: jest.fn(),
      changePassword: jest.fn(),
      createPasswordResetToken: jest.fn(),
      verifyPasswordResetToken: jest.fn(),
    };
    const { CustomerCredentialSubjectAdapter } = require('./CustomerCredentialSubjectAdapter');
    adapter = new CustomerCredentialSubjectAdapter(mockCustomerRepo);
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
    mockCustomerRepo.authenticateCustomer.mockResolvedValue({
      customerId: 'cust-1',
      email: 'test@test.com',
      firstName: 'John',
      lastName: 'Doe',
    });

    const result = await adapter.authenticate('test@test.com', 'password');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('cust-1');
    expect(result!.email).toBe('test@test.com');
    expect(result!.firstName).toBe('John');
    expect(result!.lastName).toBe('Doe');
  });

  it('should return null when authentication fails', async () => {
    mockCustomerRepo.authenticateCustomer.mockResolvedValue(null);

    const result = await adapter.authenticate('test@test.com', 'wrong');

    expect(result).toBeNull();
  });

  it('should find by id and map to CredentialSubject', async () => {
    mockCustomerRepo.findCustomerById.mockResolvedValue({
      customerId: 'cust-1',
      email: 'test@test.com',
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
      isVerified: true,
      lastLoginAt: new Date('2024-01-01'),
    });

    const result = await adapter.findById('cust-1');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('cust-1');
    expect(result!.isActive).toBe(true);
    expect(result!.isVerified).toBe(true);
  });

  it('should return null when id not found', async () => {
    mockCustomerRepo.findCustomerById.mockResolvedValue(null);

    const result = await adapter.findById('nonexistent');

    expect(result).toBeNull();
  });

  it('should find by email and map to CredentialSubject', async () => {
    mockCustomerRepo.findCustomerByEmail.mockResolvedValue({
      customerId: 'cust-1',
      email: 'test@test.com',
      isActive: true,
    });

    const result = await adapter.findByEmail('test@test.com');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('cust-1');
    expect(result!.email).toBe('test@test.com');
  });

  it('should create with password and map to CredentialSubject', async () => {
    mockCustomerRepo.createCustomerWithPassword.mockResolvedValue({
      customerId: 'cust-new',
      email: 'new@test.com',
      firstName: 'Jane',
      lastName: 'Smith',
      isActive: true,
      isVerified: false,
    });

    const result = await adapter.createWithPassword({
      email: 'new@test.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Smith',
    });

    expect(result.id).toBe('cust-new');
    expect(result.email).toBe('new@test.com');
  });

  it('should delegate updateLoginTimestamp', async () => {
    mockCustomerRepo.updateCustomerLoginTimestamp.mockResolvedValue({});

    await adapter.updateLoginTimestamp('cust-1');

    expect(mockCustomerRepo.updateCustomerLoginTimestamp).toHaveBeenCalledWith('cust-1');
  });

  it('should delegate changePassword', async () => {
    mockCustomerRepo.changePassword.mockResolvedValue(true);

    await adapter.changePassword('cust-1', 'newpass');

    expect(mockCustomerRepo.changePassword).toHaveBeenCalledWith('cust-1', 'newpass');
  });

  it('should delegate createPasswordResetToken', async () => {
    mockCustomerRepo.createPasswordResetToken.mockResolvedValue('reset-token-123');

    const result = await adapter.createPasswordResetToken('cust-1');

    expect(result).toBe('reset-token-123');
  });

  it('should delegate verifyPasswordResetToken', async () => {
    mockCustomerRepo.verifyPasswordResetToken.mockResolvedValue('cust-1');

    const result = await adapter.verifyPasswordResetToken('token');

    expect(result).toBe('cust-1');
  });

  it('should return null for invalid reset token', async () => {
    mockCustomerRepo.verifyPasswordResetToken.mockResolvedValue(null);

    const result = await adapter.verifyPasswordResetToken('invalid');

    expect(result).toBeNull();
  });
});
