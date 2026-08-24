jest.mock('../../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { RevokeTokenUseCase } from './RevokeToken';
import { TokenRequiredOnlyError, UserIdRequiredError } from '../../../domain/errors/IdentityErrors';
import { eventBus } from '../../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('RevokeTokenUseCase', () => {
  let useCase: RevokeTokenUseCase;
  let mockBlacklist: Record<string, jest.Mock>;
  let mockRefresh: Record<string, jest.Mock>;

  beforeEach(() => {
    mockBlacklist = { add: jest.fn().mockResolvedValue(undefined) };
    mockRefresh = { revoke: jest.fn().mockResolvedValue(undefined), revokeAllForCustomer: jest.fn().mockResolvedValue(3), revokeAllForMerchant: jest.fn().mockResolvedValue(5) };
    useCase = new RevokeTokenUseCase(mockBlacklist as never, mockRefresh as never);
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
    await expect(useCase.revokeOne({ token: '', tokenType: 'access', userId: 'c1', userType: 'customer' })).rejects.toThrow(TokenRequiredOnlyError);
  });

  it('should revoke all tokens for customer', async () => {
    const result = await useCase.revokeAll({ userId: 'c1', userType: 'customer' });

    expect(result.revokedCount).toBe(3);
    expect(mockRefresh.revokeAllForCustomer).toHaveBeenCalledWith('c1');
    expect(eventBus.emit).toHaveBeenCalledWith('customer.all_tokens_revoked', expect.objectContaining({ userId: 'c1' }));
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
