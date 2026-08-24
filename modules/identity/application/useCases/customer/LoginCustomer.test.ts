jest.mock('../../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { LoginCustomerUseCase } from './LoginCustomer';
import { EmailAndPasswordRequiredError, InvalidCredentialsError, AccountNotActiveError } from '../../../domain/errors/IdentityErrors';
import { eventBus } from '../../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('LoginCustomerUseCase', () => {
  let useCase: LoginCustomerUseCase;
  let mockCustomerRepo: Record<string, jest.Mock>;
  let mockAuth: Record<string, jest.Mock>;
  let mockToken: Record<string, jest.Mock>;

  beforeEach(() => {
    mockCustomerRepo = {
      findByEmail: jest.fn().mockResolvedValue({ customerId: 'c1', email: 'c@test.com', passwordHash: 'hash', status: 'active' }),
      updateLastLogin: jest.fn().mockResolvedValue(undefined),
    };
    mockAuth = { verifyPassword: jest.fn().mockResolvedValue(true) };
    mockToken = { generateAccessToken: jest.fn().mockResolvedValue('access-token'), generateRefreshToken: jest.fn().mockResolvedValue('refresh-token') };
    useCase = new LoginCustomerUseCase(mockCustomerRepo as never, mockAuth as never, mockToken as never);
  });

  it('should login customer successfully (happy path)', async () => {
    const result = await useCase.execute({ email: 'c@test.com', password: 'pass123' });

    expect(result.customerId).toBe('c1');
    expect(result.accessToken).toBe('access-token');
    expect(result.expiresIn).toBe(86400);
    expect(eventBus.emit).toHaveBeenCalledWith('customer.logged_in', expect.objectContaining({ customerId: 'c1' }));
  });

  it('should set 30-day expiry with rememberMe', async () => {
    const result = await useCase.execute({ email: 'c@test.com', password: 'pass123', rememberMe: true });

    expect(result.expiresIn).toBe(2592000);
  });

  it('should throw EmailAndPasswordRequiredError when fields missing', async () => {
    await expect(useCase.execute({ email: '', password: 'p' })).rejects.toThrow(EmailAndPasswordRequiredError);
  });

  it('should throw InvalidCredentialsError when customer not found', async () => {
    mockCustomerRepo.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute({ email: 'x@test.com', password: 'p' })).rejects.toThrow(InvalidCredentialsError);
  });

  it('should throw InvalidCredentialsError when password wrong', async () => {
    mockAuth.verifyPassword.mockResolvedValue(false);

    await expect(useCase.execute({ email: 'c@test.com', password: 'wrong' })).rejects.toThrow(InvalidCredentialsError);
  });

  it('should throw AccountNotActiveError when status is not active', async () => {
    mockCustomerRepo.findByEmail.mockResolvedValue({ customerId: 'c1', email: 'c@t.com', passwordHash: 'h', status: 'suspended' });

    await expect(useCase.execute({ email: 'c@t.com', password: 'pass' })).rejects.toThrow(AccountNotActiveError);
  });
});
