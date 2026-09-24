import '../../tests/testUtils';
import { ManageB2BUserUseCase } from './ManageB2BUser';
import {
B2BUserAlreadyExistsError, B2BUserNotFoundError, B2BUserStatusError, CompanyNotFoundError, SpendingLimitExceededError,
} from '../../domain/errors/B2BErrors';
import type { CompanyRepository, B2BUserRepository } from '../../domain/repositories/B2BRepository';
import { createB2BUser, createCompany, emitMock, lazyMock } from '../../tests/testUtils';

describe('ManageB2BUserUseCase', () => {
  let userRepo: jest.Mocked<B2BUserRepository>;
  let companyRepo: jest.Mocked<CompanyRepository>;
  let useCase: ManageB2BUserUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    userRepo = lazyMock<B2BUserRepository>();
    companyRepo = lazyMock<CompanyRepository>();
    companyRepo.findById.mockResolvedValue(createCompany());
    useCase = new ManageB2BUserUseCase(userRepo, companyRepo);
  });

  it('should invite a user and emit company.user.invited when the email is unused', async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    const result = await useCase.invite({ companyId: 'co-1', organizationId: 'org-1', email: 'a@b.test' });

    expect(result.status).toBe('invited');
    expect(emitMock).toHaveBeenCalledWith('company.user.invited', expect.objectContaining({ email: 'a@b.test' }));
  });

  it('should throw B2BUserAlreadyExistsError when the email is taken', async () => {
    userRepo.findByEmail.mockResolvedValue(createB2BUser());

    await expect(useCase.invite({ companyId: 'co-1', organizationId: 'org-1', email: 'a@b.test' })).rejects.toThrow(B2BUserAlreadyExistsError);
  });

  it('should throw CompanyNotFoundError when inviting into a missing company', async () => {
    companyRepo.findById.mockResolvedValue(null);

    await expect(useCase.invite({ companyId: 'missing', organizationId: 'org-1', email: 'a@b.test' })).rejects.toThrow(CompanyNotFoundError);
  });

  it('should throw B2BUserNotFoundError when the user does not exist', async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(useCase.get('missing')).rejects.toThrow(B2BUserNotFoundError);
  });

  it('should throw SpendingLimitExceededError when the period spend exceeds the limit', async () => {
    const user = createB2BUser({ spendingLimits: { monthlyLimit: 100 } });
    user.activate();
    userRepo.findById.mockResolvedValue(user);

    await expect(useCase.checkSpendingLimit('u-1', 60, 50, 'monthlyLimit')).rejects.toThrow(SpendingLimitExceededError);
  });

  it('should throw B2BUserStatusError when checking the spending limit of an inactive user', async () => {
    userRepo.findById.mockResolvedValue(createB2BUser());

    await expect(useCase.checkSpendingLimit('u-1', 60, 50, 'monthlyLimit')).rejects.toThrow(B2BUserStatusError);
  });
});
