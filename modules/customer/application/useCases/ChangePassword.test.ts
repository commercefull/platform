jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: { compare: jest.fn(), hash: jest.fn() },
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { ChangePasswordUseCase, ChangePasswordCommand } from './ChangePassword';
import { CustomerNotFoundError, CustomerValidationError, InvalidCredentialsError } from '../../domain/errors/CustomerErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    const bcryptModule = jest.requireMock('bcryptjs');
    bcryptModule.compare.mockResolvedValue(true);
    bcryptModule.hash.mockResolvedValue('new-hash');
    mockRepo = {
      findById: jest.fn().mockResolvedValue({ customerId: 'c1', email: 'test@test.com' }),
      getPasswordHash: jest.fn().mockResolvedValue('old-hash'),
      updatePassword: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ChangePasswordUseCase(mockRepo as never);
  });

  it('should change password (happy path)', async () => {
    const result = await useCase.execute(new ChangePasswordCommand('c1', 'oldPass', 'newPassword123'));

    expect(result.success).toBe(true);
    expect(mockRepo.updatePassword).toHaveBeenCalledWith('c1', 'new-hash');
    expect(eventBus.emit).toHaveBeenCalledWith('customer.password_changed', expect.objectContaining({ customerId: 'c1' }));
  });

  it('should throw CustomerValidationError when customerId is empty', async () => {
    await expect(useCase.execute(new ChangePasswordCommand('', 'old', 'newpass123'))).rejects.toThrow(CustomerValidationError);
  });

  it('should throw CustomerValidationError when currentPassword is empty', async () => {
    await expect(useCase.execute(new ChangePasswordCommand('c1', '', 'newpass123'))).rejects.toThrow(CustomerValidationError);
  });

  it('should throw CustomerValidationError when newPassword is too short', async () => {
    await expect(useCase.execute(new ChangePasswordCommand('c1', 'old', 'short'))).rejects.toThrow(CustomerValidationError);
  });

  it('should throw CustomerNotFoundError when customer does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new ChangePasswordCommand('missing', 'old', 'newpass123'))).rejects.toThrow(CustomerNotFoundError);
  });

  it('should throw InvalidCredentialsError when current password is wrong', async () => {
    const bcryptModule = jest.requireMock('bcryptjs');
    bcryptModule.compare.mockResolvedValue(false);

    await expect(useCase.execute(new ChangePasswordCommand('c1', 'wrong', 'newpass123'))).rejects.toThrow(InvalidCredentialsError);
  });
});
