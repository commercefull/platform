import { emitMock, lazyMock } from '../../../tests/testUtils';
import { RegisterAdminUseCase } from './RegisterAdmin';
import {
  AdminFieldsRequiredError,
  PasswordTooShortError,
  OnlySuperAdminCanCreateError,
  EmailAlreadyRegisteredError,
} from '../../../domain/errors/IdentityErrors';

beforeEach(() => {
  emitMock.mockClear();
});

describe('RegisterAdminUseCase', () => {
  let useCase: RegisterAdminUseCase;
  let mockAdminRepo: jest.Mocked<ConstructorParameters<typeof RegisterAdminUseCase>[0]>;
  let mockAuth: jest.Mocked<ConstructorParameters<typeof RegisterAdminUseCase>[1]>;

  beforeEach(() => {
    mockAdminRepo = lazyMock<ConstructorParameters<typeof RegisterAdminUseCase>[0]>();
    mockAdminRepo.findByEmail.mockResolvedValue(null);
    mockAdminRepo.findById.mockResolvedValue({ adminId: 'creator', email: 'c@t.com', name: 'C', role: 'super_admin', permissions: [], status: 'active', createdAt: new Date() });
    mockAdminRepo.create.mockResolvedValue({ adminId: 'a2', email: 'new@test.com', name: 'New Admin', role: 'admin', permissions: [], status: 'active', createdAt: new Date() });
    mockAuth = lazyMock<ConstructorParameters<typeof RegisterAdminUseCase>[1]>();
    mockAuth.hashPassword.mockResolvedValue('hashed');
    useCase = new RegisterAdminUseCase(mockAdminRepo, mockAuth);
  });

  it('should register admin successfully (happy path)', async () => {
    const result = await useCase.execute({
      email: 'new@test.com',
      password: 'password123',
      name: 'New Admin',
      role: 'admin',
      createdBy: 'creator',
    });

    expect(result.adminId).toBe('a2');
    expect(emitMock).toHaveBeenCalledWith('admin.registered', expect.objectContaining({ adminId: 'a2' }));
  });

  it('should throw AdminFieldsRequiredError when required fields missing', async () => {
    await expect(useCase.execute({ email: '', password: 'p', name: 'n', role: 'admin', createdBy: 'c' })).rejects.toThrow(
      AdminFieldsRequiredError,
    );
  });

  it('should throw PasswordTooShortError when password < 8 chars', async () => {
    await expect(useCase.execute({ email: 'a@b.com', password: 'short', name: 'N', role: 'admin', createdBy: 'c' })).rejects.toThrow(
      PasswordTooShortError,
    );
  });

  it('should throw OnlySuperAdminCanCreateError when creator is not super_admin', async () => {
    mockAdminRepo.findById.mockResolvedValue({ adminId: 'creator', email: 'c@t.com', name: 'C', role: 'admin', permissions: [], status: 'active', createdAt: new Date() });

    await expect(
      useCase.execute({ email: 'a@b.com', password: 'password123', name: 'N', role: 'admin', createdBy: 'creator' }),
    ).rejects.toThrow(OnlySuperAdminCanCreateError);
  });

  it('should throw EmailAlreadyRegisteredError when email exists', async () => {
    mockAdminRepo.findByEmail.mockResolvedValue({ adminId: 'existing', email: 'a@b.com', name: 'E', role: 'admin', permissions: [], status: 'active', createdAt: new Date() });

    await expect(
      useCase.execute({ email: 'a@b.com', password: 'password123', name: 'N', role: 'admin', createdBy: 'creator' }),
    ).rejects.toThrow(EmailAlreadyRegisteredError);
  });
});
