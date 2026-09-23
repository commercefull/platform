import { createSocialAccountProps, createSocialProfileData, createMockSocialAccountRepo } from '../../tests/testUtils';
import { SocialLoginUseCase } from './SocialLogin';
import { SocialAccount } from '../../domain/entities/SocialAccount';
import { EmailRequiredError } from '../../domain/errors/IdentityErrors';

describe('SocialLoginUseCase', () => {
  it('should login with existing social account', async () => {
    const account = SocialAccount.create(createSocialAccountProps());
    const repo = createMockSocialAccountRepo(account);
    const findOrCreateUser = jest.fn();
    const useCase = new SocialLoginUseCase(repo, findOrCreateUser);

    const result = await useCase.execute({
      provider: 'google',
      profile: createSocialProfileData(),
      userType: 'customer',
      ip: '127.0.0.1',
    });

    expect(result.isNewUser).toBe(false);
    expect(result.userId).toBe('u-1');
    expect(result.provider).toBe('google');
    expect(result.socialAccountId).toBe('sa-1');
    expect(repo.updateTokens).toHaveBeenCalled();
    expect(repo.recordLogin).toHaveBeenCalled();
    expect(findOrCreateUser).not.toHaveBeenCalled();
  });

  it('should create new user when social account does not exist', async () => {
    const repo = createMockSocialAccountRepo(null);
    const findOrCreateUser = jest.fn().mockResolvedValue({ userId: 'u-new', isNew: true });
    const useCase = new SocialLoginUseCase(repo, findOrCreateUser);

    const result = await useCase.execute({
      provider: 'google',
      profile: createSocialProfileData(),
      userType: 'customer',
    });

    expect(result.isNewUser).toBe(true);
    expect(result.userId).toBe('u-new');
    expect(repo.create).toHaveBeenCalled();
    expect(findOrCreateUser).toHaveBeenCalled();
  });

  it('should throw EmailRequiredError when profile has no email and no existing account', async () => {
    const repo = createMockSocialAccountRepo(null);
    const findOrCreateUser = jest.fn();
    const useCase = new SocialLoginUseCase(repo, findOrCreateUser);

    await expect(
      useCase.execute({
        provider: 'google',
        profile: createSocialProfileData({ email: undefined }),
        userType: 'customer',
      }),
    ).rejects.toThrow(EmailRequiredError);
  });
});

// ============================================================================
// LinkSocialAccountUseCase
// ============================================================================

