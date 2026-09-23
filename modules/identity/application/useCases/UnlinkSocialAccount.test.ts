import { createSocialAccountProps, createMockSocialAccountRepo } from '../../tests/testUtils';
import { UnlinkSocialAccountUseCase } from './UnlinkSocialAccount';
import { SocialAccount } from '../../domain/entities/SocialAccount';
import {
  SocialAccountNotLinkedError,
  CannotUnlinkOnlyLoginMethodError,
} from '../../domain/errors/IdentityErrors';

describe('UnlinkSocialAccountUseCase', () => {
  it('should unlink social account successfully', async () => {
    const account = SocialAccount.create(createSocialAccountProps());
    const repo = createMockSocialAccountRepo(account, [], 2);
    const useCase = new UnlinkSocialAccountUseCase(repo);

    await useCase.execute({
      userId: 'u-1',
      userType: 'customer',
      provider: 'google',
    });

    expect(repo.deactivate).toHaveBeenCalledWith('sa-1');
  });

  it('should throw SocialAccountNotLinkedError when no linked account found', async () => {
    const repo = createMockSocialAccountRepo(null);
    const useCase = new UnlinkSocialAccountUseCase(repo);

    await expect(
      useCase.execute({
        userId: 'u-1',
        userType: 'customer',
        provider: 'google',
      }),
    ).rejects.toThrow(SocialAccountNotLinkedError);
  });

  it('should throw CannotUnlinkOnlyLoginMethodError when only one linked account', async () => {
    const account = SocialAccount.create(createSocialAccountProps());
    const repo = createMockSocialAccountRepo(account, [], 1);
    const useCase = new UnlinkSocialAccountUseCase(repo);

    await expect(
      useCase.execute({
        userId: 'u-1',
        userType: 'customer',
        provider: 'google',
      }),
    ).rejects.toThrow(CannotUnlinkOnlyLoginMethodError);
  });
});

// ============================================================================
// GetLinkedAccountsUseCase
// ============================================================================

