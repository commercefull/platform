import { emitMock, lazyMock } from '../../../tests/testUtils';
import { RegisterOrganizationUseCase } from './RegisterOrganization';
import {
  OrganizationRegistrationFieldsRequiredError,
  InvalidEmailFormatError,
  PasswordTooShortError,
  EmailAlreadyRegisteredError,
} from '../../../domain/errors/IdentityErrors';

beforeEach(() => {
  emitMock.mockClear();
});

describe('RegisterOrganizationUseCase', () => {
  let useCase: RegisterOrganizationUseCase;
  let mockOrgRepo: jest.Mocked<ConstructorParameters<typeof RegisterOrganizationUseCase>[0]>;
  let mockAuthService: jest.Mocked<ConstructorParameters<typeof RegisterOrganizationUseCase>[1]>;
  let mockEmailService: jest.Mocked<ConstructorParameters<typeof RegisterOrganizationUseCase>[2]>;

  beforeEach(() => {
    mockOrgRepo = lazyMock<ConstructorParameters<typeof RegisterOrganizationUseCase>[0]>();
    mockOrgRepo.findByEmail.mockResolvedValue(null);
    mockOrgRepo.create.mockResolvedValue(undefined);
    mockAuthService = lazyMock<ConstructorParameters<typeof RegisterOrganizationUseCase>[1]>();
    mockAuthService.hashPassword.mockResolvedValue('hashed-pw');
    mockEmailService = lazyMock<ConstructorParameters<typeof RegisterOrganizationUseCase>[2]>();
    mockEmailService.sendOrganizationWelcomeEmail.mockResolvedValue(undefined);
    useCase = new RegisterOrganizationUseCase(mockOrgRepo, mockAuthService, mockEmailService);
  });

  it('should register organization (happy path)', async () => {
    const result = await useCase.execute({
      email: 'test@business.com',
      password: 'password123',
      businessName: 'Test Biz',
    });

    expect(result.email).toBe('test@business.com');
    expect(result.status).toBe('pending_approval');
    expect(mockOrgRepo.create).toHaveBeenCalled();
    expect(mockEmailService.sendOrganizationWelcomeEmail).toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalled();
  });

  it('should throw OrganizationRegistrationFieldsRequiredError when fields missing', async () => {
    await expect(useCase.execute({ email: '', password: '', businessName: '' })).rejects.toThrow(
      OrganizationRegistrationFieldsRequiredError,
    );
  });

  it('should throw InvalidEmailFormatError for bad email', async () => {
    await expect(useCase.execute({ email: 'notanemail', password: 'password123', businessName: 'Test' })).rejects.toThrow(
      InvalidEmailFormatError,
    );
  });

  it('should throw PasswordTooShortError for short password', async () => {
    await expect(useCase.execute({ email: 'test@test.com', password: 'short', businessName: 'Test' })).rejects.toThrow(
      PasswordTooShortError,
    );
  });

  it('should throw EmailAlreadyRegisteredError when email exists', async () => {
    mockOrgRepo.findByEmail.mockResolvedValue({ organizationId: 'existing', email: 'test@test.com' });

    await expect(useCase.execute({ email: 'test@test.com', password: 'password123', businessName: 'Test' })).rejects.toThrow(
      EmailAlreadyRegisteredError,
    );
  });
});
