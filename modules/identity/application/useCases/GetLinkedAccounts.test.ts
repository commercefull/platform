import { createSocialAccountProps, createMockSocialAccountRepo } from '../../tests/testUtils';
import { GetLinkedAccountsUseCase } from './GetLinkedAccounts';
import { SocialAccount } from '../../domain/entities/SocialAccount';

describe('GetLinkedAccountsUseCase', () => {
  it('should return only active linked accounts', async () => {
    const activeAccount = SocialAccount.create(createSocialAccountProps({ isActive: true, socialAccountId: 'sa-1' }));
    const inactiveAccount = SocialAccount.create(createSocialAccountProps({ isActive: false, socialAccountId: 'sa-2' }));
    const repo = createMockSocialAccountRepo(null, [activeAccount, inactiveAccount]);
    const useCase = new GetLinkedAccountsUseCase(repo);

    const result = await useCase.execute('u-1', 'customer');

    expect(result).toHaveLength(1);
    expect(result[0].socialAccountId).toBe('sa-1');
  });

  it('should return empty array when no accounts found', async () => {
    const repo = createMockSocialAccountRepo(null, []);
    const useCase = new GetLinkedAccountsUseCase(repo);

    const result = await useCase.execute('u-1', 'customer');

    expect(result).toEqual([]);
  });
});
