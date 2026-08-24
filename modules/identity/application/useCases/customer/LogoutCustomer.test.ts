jest.mock('../../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { LogoutCustomerUseCase} from './LogoutCustomer';
import { CustomerIdAndTokenRequiredError } from '../../../domain/errors/IdentityErrors';
import { eventBus } from '../../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('LogoutCustomerUseCase', () => {
  let useCase: LogoutCustomerUseCase;
  let mockTokenBlacklistRepo: Record<string, jest.Mock>;
  let mockRefreshTokenRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockTokenBlacklistRepo = { add: jest.fn().mockResolvedValue(undefined) };
    mockRefreshTokenRepo = {
      revokeAllForCustomer: jest.fn().mockResolvedValue(3),
      revoke: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new LogoutCustomerUseCase(mockTokenBlacklistRepo as never, mockRefreshTokenRepo as never);
  });

  it('should logout customer (happy path)', async () => {
    const result = await useCase.execute({ customerId: 'c1', accessToken: 'tok123', refreshToken: 'ref456' });

    expect(result.success).toBe(true);
    expect(mockTokenBlacklistRepo.add).toHaveBeenCalled();
    expect(mockRefreshTokenRepo.revoke).toHaveBeenCalledWith('ref456');
    expect(eventBus.emit).toHaveBeenCalledWith('customer.logged_out', expect.objectContaining({ customerId: 'c1' }));
  });

  it('should logout all sessions when logoutAll is true', async () => {
    await useCase.execute({ customerId: 'c1', accessToken: 'tok123', logoutAll: true });

    expect(mockRefreshTokenRepo.revokeAllForCustomer).toHaveBeenCalledWith('c1');
    expect(mockRefreshTokenRepo.revoke).not.toHaveBeenCalled();
  });

  it('should throw CustomerIdAndTokenRequiredError when customerId is empty', async () => {
    await expect(useCase.execute({ customerId: '', accessToken: 'tok' })).rejects.toThrow(CustomerIdAndTokenRequiredError);
  });

  it('should throw CustomerIdAndTokenRequiredError when accessToken is empty', async () => {
    await expect(useCase.execute({ customerId: 'c1', accessToken: '' })).rejects.toThrow(CustomerIdAndTokenRequiredError);
  });
});
