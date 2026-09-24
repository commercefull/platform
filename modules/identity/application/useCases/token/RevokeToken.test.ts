import { emitMock, lazyMock } from '../../../tests/testUtils';
import { RevokeTokenUseCase } from './RevokeToken';
import { TokenRequiredOnlyError, UserIdRequiredError } from '../../../domain/errors/IdentityErrors';

beforeEach(() => {
  emitMock.mockClear();
});

describe('RevokeTokenUseCase', () => {
  let useCase: RevokeTokenUseCase;
  let mockBlacklist: jest.Mocked<ConstructorParameters<typeof RevokeTokenUseCase>[0]>;
  let mockRefresh: jest.Mocked<ConstructorParameters<typeof RevokeTokenUseCase>[1]>;

  beforeEach(() => {
    mockBlacklist = lazyMock<ConstructorParameters<typeof RevokeTokenUseCase>[0]>();
    mockBlacklist.add.mockResolvedValue(undefined);
    mockRefresh = lazyMock<ConstructorParameters<typeof RevokeTokenUseCase>[1]>();
    mockRefresh.revoke.mockResolvedValue(undefined);
    mockRefresh.revokeAllForCustomer.mockResolvedValue(3);
    mockRefresh.revokeAllForMerchant.mockResolvedValue(5);
    useCase = new RevokeTokenUseCase(mockBlacklist, mockRefresh);
  });

  it('should revoke access token (happy path)', async () => {
    const result = await useCase.revokeOne({ token: 'tok', tokenType: 'access', userId: 'c1', userType: 'customer' });

    expect(result.success).toBe(true);
    expect(result.revokedCount).toBe(1);
    expect(mockBlacklist.add).toHaveBeenCalledWith(expect.objectContaining({ token: 'tok', type: 'access', customerId: 'c1' }));
  });

  it('should revoke refresh token', async () => {
    const result = await useCase.revokeOne({ token: 'tok', tokenType: 'refresh', userId: 'o1', userType: 'organization' });

    expect(result.revokedCount).toBe(1);
    expect(mockRefresh.revoke).toHaveBeenCalledWith('tok');
  });

  it('should throw TokenRequiredOnlyError when token missing', async () => {
    await expect(useCase.revokeOne({ token: '', tokenType: 'access', userId: 'c1', userType: 'customer' })).rejects.toThrow(
      TokenRequiredOnlyError,
    );
  });

  it('should revoke all tokens for customer', async () => {
    const result = await useCase.revokeAll({ userId: 'c1', userType: 'customer' });

    expect(result.revokedCount).toBe(3);
    expect(mockRefresh.revokeAllForCustomer).toHaveBeenCalledWith('c1');
    expect(emitMock).toHaveBeenCalledWith('customer.all_tokens_revoked', expect.objectContaining({ userId: 'c1' }));
  });

  it('should revoke all tokens for organization', async () => {
    const result = await useCase.revokeAll({ userId: 'o1', userType: 'organization' });

    expect(result.revokedCount).toBe(5);
    expect(mockRefresh.revokeAllForMerchant).toHaveBeenCalledWith('o1');
  });

  it('should throw UserIdRequiredError when userId missing', async () => {
    await expect(useCase.revokeAll({ userId: '', userType: 'customer' })).rejects.toThrow(UserIdRequiredError);
  });
});
