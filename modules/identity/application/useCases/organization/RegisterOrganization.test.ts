jest.mock('../../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { RegisterOrganizationUseCase} from './RegisterOrganization';
import {
  OrganizationRegistrationFieldsRequiredError,
  InvalidEmailFormatError,
  PasswordTooShortError,
  EmailAlreadyRegisteredError,
} from '../../../domain/errors/IdentityErrors';
import { eventBus } from '../../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('RegisterOrganizationUseCase', () => {
  let useCase: RegisterOrganizationUseCase;
  let mockOrgRepo: Record<string, jest.Mock>;
  let mockAuthService: Record<string, jest.Mock>;
  let mockEmailService: Record<string, jest.Mock>;

  beforeEach(() => {
    mockOrgRepo = {
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(undefined),
    };
    mockAuthService = {
      hashPassword: jest.fn().mockResolvedValue('hashed-pw'),
    };
    mockEmailService = {
      sendOrganizationWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new RegisterOrganizationUseCase(mockOrgRepo as never, mockAuthService as never, mockEmailService as never);
  });

  it('should register organization (happy path)', async () => {
    const result = await useCase.execute({
      email: 'test@business.com', password: 'password123', businessName: 'Test Biz',
    });

    expect(result.email).toBe('test@business.com');
    expect(result.status).toBe('pending_approval');
    expect(mockOrgRepo.create).toHaveBeenCalled();
    expect(mockEmailService.sendOrganizationWelcomeEmail).toHaveBeenCalled();
    expect(eventBus.emit).toHaveBeenCalled();
  });

  it('should throw OrganizationRegistrationFieldsRequiredError when fields missing', async () => {
    await expect(useCase.execute({ email: '', password: '', businessName: '' })).rejects.toThrow(OrganizationRegistrationFieldsRequiredError);
  });

  it('should throw InvalidEmailFormatError for bad email', async () => {
    await expect(useCase.execute({ email: 'notanemail', password: 'password123', businessName: 'Test' })).rejects.toThrow(InvalidEmailFormatError);
  });

  it('should throw PasswordTooShortError for short password', async () => {
    await expect(useCase.execute({ email: 'test@test.com', password: 'short', businessName: 'Test' })).rejects.toThrow(PasswordTooShortError);
  });

  it('should throw EmailAlreadyRegisteredError when email exists', async () => {
    mockOrgRepo.findByEmail.mockResolvedValue({ organizationId: 'existing' });

    await expect(useCase.execute({ email: 'test@test.com', password: 'password123', businessName: 'Test' })).rejects.toThrow(EmailAlreadyRegisteredError);
  });
});
