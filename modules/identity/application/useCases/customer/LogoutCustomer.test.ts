import { emitMock, lazyMock } from '../../../tests/testUtils';
import { LogoutCustomerUseCase } from './LogoutCustomer';
import { CustomerIdAndTokenRequiredError } from '../../../domain/errors/IdentityErrors';

beforeEach(() => {
  emitMock.mockClear();
});

describe('LogoutCustomerUseCase', () => {
  let useCase: LogoutCustomerUseCase;
  let mockTokenBlacklistRepo: jest.Mocked<ConstructorParameters<typeof LogoutCustomerUseCase>[0]>;
  let mockRefreshTokenRepo: jest.Mocked<ConstructorParameters<typeof LogoutCustomerUseCase>[1]>;

  beforeEach(() => {
    mockTokenBlacklistRepo = lazyMock<ConstructorParameters<typeof LogoutCustomerUseCase>[0]>();
    mockTokenBlacklistRepo.add.mockResolvedValue(undefined);
    mockRefreshTokenRepo = lazyMock<ConstructorParameters<typeof LogoutCustomerUseCase>[1]>();
    mockRefreshTokenRepo.revokeAllForCustomer.mockResolvedValue(3);
    mockRefreshTokenRepo.revoke.mockResolvedValue(undefined);
    useCase = new LogoutCustomerUseCase(mockTokenBlacklistRepo, mockRefreshTokenRepo);
  });

  it('should logout customer (happy path)', async () => {
    const result = await useCase.execute({ customerId: 'c1', accessToken: 'tok123', refreshToken: 'ref456' });

    expect(result.success).toBe(true);
    expect(mockTokenBlacklistRepo.add).toHaveBeenCalled();
    expect(mockRefreshTokenRepo.revoke).toHaveBeenCalledWith('ref456');
    expect(emitMock).toHaveBeenCalledWith('customer.logged_out', expect.objectContaining({ customerId: 'c1' }));
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
