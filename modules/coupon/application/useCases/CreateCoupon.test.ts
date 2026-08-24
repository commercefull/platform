jest.mock('../../../../libs/uuid', () => ({
  __esModule: true,
  generateUUID: jest.fn().mockReturnValue('coupon-uuid'),
}));

import { CreateCouponUseCase, CreateCouponCommand } from './CreateCoupon';
import { CouponCodeAlreadyExistsError } from '../../domain/errors/CouponErrors';

describe('CreateCouponUseCase', () => {
  let useCase: CreateCouponUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findByCode: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation(async (c: unknown) => c),
    };
    useCase = new CreateCouponUseCase(mockRepo as never);
  });

  it('should create coupon (happy path)', async () => {
    const result = await useCase.execute(new CreateCouponCommand(
      'SAVE10', '10% Off', 'percentage', 10, 'admin-1',
    ));

    expect(result.code).toBe('SAVE10');
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should throw CouponCodeAlreadyExistsError when code exists', async () => {
    mockRepo.findByCode.mockResolvedValue({ couponId: 'existing' });

    await expect(useCase.execute(new CreateCouponCommand(
      'SAVE10', '10% Off', 'percentage', 10, 'admin-1',
    ))).rejects.toThrow(CouponCodeAlreadyExistsError);
  });
});
