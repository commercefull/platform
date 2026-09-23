import { createCoupon, createCouponRepository } from '../../tests/testUtils';
import { CreateCouponUseCase, CreateCouponCommand } from './CreateCoupon';
import { CouponCodeAlreadyExistsError, CouponValidationError } from '../../domain/errors/CouponErrors';

describe('CreateCouponUseCase', () => {
  it('should create and save the coupon when the code is available', async () => {
    const repository = createCouponRepository(null);

    const result = await new CreateCouponUseCase(repository).execute(
      new CreateCouponCommand('SAVE10', '10% Off', 'percentage', 10, 'admin-1'),
    );

    expect(result.couponId).toBe('test-uuid');
    expect(result.code).toBe('SAVE10');
    expect(repository.save).toHaveBeenCalled();
  });

  it('should uppercase the code when creating the coupon', async () => {
    const repository = createCouponRepository(null);

    const result = await new CreateCouponUseCase(repository).execute(
      new CreateCouponCommand('save10', '10% Off', 'percentage', 10, 'admin-1'),
    );

    expect(result.code).toBe('SAVE10');
  });

  it('should throw CouponCodeAlreadyExistsError when the code is taken', async () => {
    const repository = createCouponRepository(createCoupon());

    await expect(
      new CreateCouponUseCase(repository).execute(new CreateCouponCommand('SAVE10', '10% Off', 'percentage', 10, 'admin-1')),
    ).rejects.toThrow(CouponCodeAlreadyExistsError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should throw CouponValidationError when the name is empty', async () => {
    const repository = createCouponRepository(null);

    await expect(
      new CreateCouponUseCase(repository).execute(new CreateCouponCommand('SAVE10', '', 'percentage', 10, 'admin-1')),
    ).rejects.toThrow(CouponValidationError);
  });

  it('should throw CouponValidationError when the percentage value exceeds 100', async () => {
    const repository = createCouponRepository(null);

    await expect(
      new CreateCouponUseCase(repository).execute(new CreateCouponCommand('SAVE10', 'Big', 'percentage', 150, 'admin-1')),
    ).rejects.toThrow(CouponValidationError);
  });

  it('should throw CouponValidationError when a fixed_amount coupon has no currency', async () => {
    const repository = createCouponRepository(null);

    await expect(
      new CreateCouponUseCase(repository).execute(new CreateCouponCommand('SAVE10', 'Flat', 'fixed_amount', 10, 'admin-1')),
    ).rejects.toThrow(CouponValidationError);
  });

  it('should throw CouponValidationError when a multi_use coupon has no usage limit', async () => {
    const repository = createCouponRepository(null);

    await expect(
      new CreateCouponUseCase(repository).execute(
        new CreateCouponCommand('SAVE10', 'Multi', 'percentage', 10, 'admin-1', undefined, undefined, undefined, undefined, 'multi_use'),
      ),
    ).rejects.toThrow(CouponValidationError);
  });
});
