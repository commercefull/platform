jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: { compare: jest.fn(), hash: jest.fn() },
  compare: jest.fn(),
  hash: jest.fn(),
}));

import { AuthenticateCustomerUseCase, AuthenticateCustomerCommand } from './AuthenticateCustomer';
import { EmailRequiredError, PasswordRequiredError } from '../../domain/errors/CustomerErrors';

describe('AuthenticateCustomerUseCase', () => {
  let useCase: AuthenticateCustomerUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    const bcryptModule = jest.requireMock('bcryptjs');
    bcryptModule.compare.mockResolvedValue(true);
    mockRepo = {
      findByEmail: jest.fn().mockResolvedValue({
        customerId: 'c1', email: 'test@test.com', firstName: 'John', lastName: 'Doe', isVerified: true,
      }),
      getPasswordHash: jest.fn().mockResolvedValue('hashed-pw'),
      recordLogin: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new AuthenticateCustomerUseCase(mockRepo as never);
  });

  it('should authenticate customer (happy path)', async () => {
    const result = await useCase.execute(new AuthenticateCustomerCommand('test@test.com', 'password'));

    expect(result).not.toBeNull();
    expect(result!.customerId).toBe('c1');
    expect(mockRepo.recordLogin).toHaveBeenCalledWith('c1');
  });

  it('should throw EmailRequiredError when email is empty', async () => {
    await expect(useCase.execute(new AuthenticateCustomerCommand('', 'password'))).rejects.toThrow(EmailRequiredError);
  });

  it('should throw PasswordRequiredError when password is empty', async () => {
    await expect(useCase.execute(new AuthenticateCustomerCommand('test@test.com', ''))).rejects.toThrow(PasswordRequiredError);
  });

  it('should return null when customer not found', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);

    const result = await useCase.execute(new AuthenticateCustomerCommand('missing@test.com', 'password'));

    expect(result).toBeNull();
  });

  it('should return null when password hash not found', async () => {
    mockRepo.getPasswordHash.mockResolvedValue(null);

    const result = await useCase.execute(new AuthenticateCustomerCommand('test@test.com', 'password'));

    expect(result).toBeNull();
  });

  it('should return null when password does not match', async () => {
    const bcryptModule = jest.requireMock('bcryptjs');
    bcryptModule.compare.mockResolvedValue(false);

    const result = await useCase.execute(new AuthenticateCustomerCommand('test@test.com', 'wrong'));

    expect(result).toBeNull();
  });
});
