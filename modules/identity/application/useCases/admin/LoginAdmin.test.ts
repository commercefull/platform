jest.mock('../../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { LoginAdminUseCase } from './LoginAdmin';
import { EmailAndPasswordRequiredError, InvalidCredentialsError, AccountNotActiveError } from '../../../domain/errors/IdentityErrors';
import { eventBus } from '../../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('LoginAdminUseCase', () => {
  let useCase: LoginAdminUseCase;
  let mockAdminRepo: Record<string, jest.Mock>;
  let mockAuth: Record<string, jest.Mock>;
  let mockSession: Record<string, jest.Mock>;

  beforeEach(() => {
    mockAdminRepo = {
      findByEmail: jest.fn().mockResolvedValue({
        adminId: 'a1', email: 'admin@test.com', name: 'Admin', passwordHash: 'hash',
        role: 'admin', permissions: ['read'], status: 'active',
      }),
      updateLastLogin: jest.fn().mockResolvedValue(undefined),
    };
    mockAuth = { verifyPassword: jest.fn().mockResolvedValue(true) };
    mockSession = { createSession: jest.fn().mockResolvedValue('session-1') };
    useCase = new LoginAdminUseCase(mockAdminRepo as never, mockAuth as never, mockSession as never);
  });

  it('should login admin successfully (happy path)', async () => {
    const result = await useCase.execute({ email: 'admin@test.com', password: 'pass123' });

    expect(result.adminId).toBe('a1');
    expect(result.sessionId).toBe('session-1');
    expect(mockAdminRepo.updateLastLogin).toHaveBeenCalledWith('a1');
    expect(eventBus.emit).toHaveBeenCalledWith('admin.logged_in', expect.objectContaining({ adminId: 'a1' }));
  });

  it('should throw EmailAndPasswordRequiredError when fields missing', async () => {
    await expect(useCase.execute({ email: '', password: 'pass' })).rejects.toThrow(EmailAndPasswordRequiredError);
    await expect(useCase.execute({ email: 'a@b.com', password: '' })).rejects.toThrow(EmailAndPasswordRequiredError);
  });

  it('should throw InvalidCredentialsError when admin not found', async () => {
    mockAdminRepo.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute({ email: 'unknown@test.com', password: 'pass' })).rejects.toThrow(InvalidCredentialsError);
    expect(eventBus.emit).toHaveBeenCalledWith('admin.login_failed', expect.objectContaining({ reason: 'user_not_found' }));
  });

  it('should throw InvalidCredentialsError when password is wrong', async () => {
    mockAuth.verifyPassword.mockResolvedValue(false);

    await expect(useCase.execute({ email: 'admin@test.com', password: 'wrong' })).rejects.toThrow(InvalidCredentialsError);
    expect(eventBus.emit).toHaveBeenCalledWith('admin.login_failed', expect.objectContaining({ reason: 'invalid_password' }));
  });

  it('should throw AccountNotActiveError when admin is suspended', async () => {
    mockAdminRepo.findByEmail.mockResolvedValue({ adminId: 'a1', email: 'a@b.com', name: 'A', passwordHash: 'h', role: 'admin', permissions: [], status: 'suspended' });

    await expect(useCase.execute({ email: 'a@b.com', password: 'pass' })).rejects.toThrow(AccountNotActiveError);
  });
});
