import { CreatePromotionRecordUseCase } from './CreatePromotionRecord';
import { PromotionValidationError } from '../../domain/errors/PromotionErrors';
import { lazyMock, createPromotion } from '../../tests/testUtils';
import type { CreatePromotionRecordPort } from './CreatePromotionRecord';
import type { CreatePromotionInput } from '../../domain/repositories/PromotionRepository';

const makeInput = (overrides: Partial<CreatePromotionInput> = {}): CreatePromotionInput =>
  ({
    name: 'Summer Sale',
    status: 'active',
    scope: 'cart',
    startDate: new Date('2025-01-01'),
    ...overrides,
  }) as CreatePromotionInput;

describe('CreatePromotionRecordUseCase', () => {
  it('should create a promotion and apply defaults', async () => {
    const promotions = lazyMock<CreatePromotionRecordPort>();
    const promotion = createPromotion();
    promotions.create.mockImplementation(async (input) => {
      expect(input.priority).toBe(10);
      expect(input.isExclusive).toBe(false);
      return promotion;
    });
    const useCase = new CreatePromotionRecordUseCase(promotions);

    const result = await useCase.execute(makeInput());

    expect(result).toBe(promotion);
  });

  it('should preserve caller-provided defaults', async () => {
    const promotions = lazyMock<CreatePromotionRecordPort>();
    promotions.create.mockImplementation(async (input) => {
      expect(input.priority).toBe(5);
      expect(input.isExclusive).toBe(true);
      return createPromotion();
    });
    const useCase = new CreatePromotionRecordUseCase(promotions);

    await useCase.execute(makeInput({ priority: 5, isExclusive: true }));
  });

  it('should reject when required fields are missing', async () => {
    const promotions = lazyMock<CreatePromotionRecordPort>();
    const useCase = new CreatePromotionRecordUseCase(promotions);

    await expect(useCase.execute(makeInput({ name: undefined }))).rejects.toBeInstanceOf(
      PromotionValidationError,
    );
    await expect(useCase.execute(makeInput({ status: undefined }))).rejects.toBeInstanceOf(
      PromotionValidationError,
    );
    await expect(useCase.execute(makeInput({ scope: undefined }))).rejects.toBeInstanceOf(
      PromotionValidationError,
    );
    await expect(useCase.execute(makeInput({ startDate: undefined }))).rejects.toBeInstanceOf(
      PromotionValidationError,
    );
    expect(promotions.create).not.toHaveBeenCalled();
  });
});
