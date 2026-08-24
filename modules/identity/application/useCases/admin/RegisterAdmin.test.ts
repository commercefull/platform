jest.mock('../../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { RegisterAdminUseCase } from './RegisterAdmin';
import { AdminFieldsRequiredError, PasswordTooShortError, OnlySuperAdminCanCreateError, EmailAlreadyRegisteredError } from '../../../domain/errors/IdentityErrors';
import { eventBus } from '../../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('RegisterAdminUseCase', () => {
  let useCase: RegisterAdminUseCase;
  let mockAdminRepo: Record<string, jest.Mock>;
  let mockAuth: Record<string, jest.Mock>;

  beforeEach(() => {
    mockAdminRepo = {
      findByEmail: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue({ adminId: 'creator', role: 'super_admin' }),
      create: jest.fn().mockResolvedValue({ adminId: 'a2', email: 'new@test.com', name: 'New Admin', role: 'admin', createdAt: new Date() }),
    };
    mockAuth = { hashPassword: jest.fn().mockResolvedValue('hashed') };
    useCase = new RegisterAdminUseCase(mockAdminRepo as never, mockAuth as never);
  });

  it('should register admin successfully (happy path)', async () => {
    const result = await useCase.execute({ email: 'new@test.com', password: 'password123', name: 'New Admin', role: 'admin', createdBy: 'creator' });

    expect(result.adminId).toBe('a2');
    expect(eventBus.emit).toHaveBeenCalledWith('admin.registered', expect.objectContaining({ adminId: 'a2' }));
  });

  it('should throw AdminFieldsRequiredError when required fields missing', async () => {
    await expect(useCase.execute({ email: '', password: 'p', name: 'n', role: 'admin', createdBy: 'c' })).rejects.toThrow(AdminFieldsRequiredError);
  });

  it('should throw PasswordTooShortError when password < 8 chars', async () => {
    await expect(useCase.execute({ email: 'a@b.com', password: 'short', name: 'N', role: 'admin', createdBy: 'c' })).rejects.toThrow(PasswordTooShortError);
  });

  it('should throw OnlySuperAdminCanCreateError when creator is not super_admin', async () => {
    mockAdminRepo.findById.mockResolvedValue({ adminId: 'creator', role: 'admin' });

    await expect(useCase.execute({ email: 'a@b.com', password: 'password123', name: 'N', role: 'admin', createdBy: 'creator' })).rejects.toThrow(OnlySuperAdminCanCreateError);
  });

  it('should throw EmailAlreadyRegisteredError when email exists', async () => {
    mockAdminRepo.findByEmail.mockResolvedValue({ adminId: 'existing' });

    await expect(useCase.execute({ email: 'a@b.com', password: 'password123', name: 'N', role: 'admin', createdBy: 'creator' })).rejects.toThrow(EmailAlreadyRegisteredError);
  });
});
