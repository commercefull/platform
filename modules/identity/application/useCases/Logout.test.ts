import { createActiveUser, createMockUserRepo } from '../../tests/testUtils';
import { LogoutUseCase, LogoutCommand } from './Logout';

describe('LogoutUseCase', () => {
  it('should logout successfully by clearing refresh token', async () => {
    const user = createActiveUser();
    user.setRefreshToken('some-token', new Date(Date.now() + 86400000));
    const repo = createMockUserRepo(user);
    const useCase = new LogoutUseCase(repo);

    await useCase.execute(new LogoutCommand('u-1'));

    expect(repo.findById).toHaveBeenCalledWith('u-1');
    expect(repo.save).toHaveBeenCalled();
  });

  it('should do nothing when user does not exist', async () => {
    const repo = createMockUserRepo(null);
    const useCase = new LogoutUseCase(repo);

    await useCase.execute(new LogoutCommand('nonexistent'));

    expect(repo.save).not.toHaveBeenCalled();
  });
});
