import { createSocialAccountProps, createSocialProfileData, createMockSocialAccountRepo } from '../../tests/testUtils';
import { LinkSocialAccountUseCase } from './LinkSocialAccount';
import { SocialAccount } from '../../domain/entities/SocialAccount';
import { SocialAccountAlreadyLinkedError } from '../../domain/errors/IdentityErrors';

describe('LinkSocialAccountUseCase', () => {
  it('should throw SocialAccountAlreadyLinkedError when provider is linked to another user', async () => {
    const existingAccount = SocialAccount.create(createSocialAccountProps({ userId: 'other-user' }));
    const repo = createMockSocialAccountRepo(existingAccount);
    const useCase = new LinkSocialAccountUseCase(repo);

    await expect(
      useCase.execute({
        userId: 'u-1',
        userType: 'customer',
        provider: 'google',
        profile: createSocialProfileData(),
      }),
    ).rejects.toThrow(SocialAccountAlreadyLinkedError);
  });

  it('should update tokens when provider is already linked to same user', async () => {
    const existingAccount = SocialAccount.create(createSocialAccountProps({ userId: 'u-1' }));
    const repo = createMockSocialAccountRepo(existingAccount);
    const useCase = new LinkSocialAccountUseCase(repo);

    const result = await useCase.execute({
      userId: 'u-1',
      userType: 'customer',
      provider: 'google',
      profile: createSocialProfileData({ accessToken: 'new-token' }),
    });

    expect(result.socialAccountId).toBe('sa-1');
    expect(repo.updateTokens).toHaveBeenCalledWith('sa-1', 'new-token', 'refresh-token', expect.any(Date));
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('should create new link when no existing link found', async () => {
    const repo = createMockSocialAccountRepo(null);
    const useCase = new LinkSocialAccountUseCase(repo);

    const result = await useCase.execute({
      userId: 'u-1',
      userType: 'customer',
      provider: 'google',
      profile: createSocialProfileData(),
    });

    expect(result.socialAccountId).toBe('sa-1');
    expect(result.isPrimary).toBe(false);
    expect(repo.create).toHaveBeenCalled();
  });
});

// ============================================================================
// UnlinkSocialAccountUseCase
// ============================================================================

