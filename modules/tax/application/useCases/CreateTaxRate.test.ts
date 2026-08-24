import { CreateTaxRateUseCase} from './CreateTaxRate';
import { InvalidTaxRateError, TaxValidationError } from '../../domain/errors/TaxErrors';

describe('CreateTaxRateUseCase', () => {
  let useCase: CreateTaxRateUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      createTaxRate: jest.fn().mockResolvedValue({
        taxRateId: 'txr-1', name: 'US Federal', rate: 0.07, country: 'US', isActive: true, createdAt: new Date(),
      }),
    };
    useCase = new CreateTaxRateUseCase(mockRepo as never);
  });

  it('should create a tax rate (happy path)', async () => {
    const result = await useCase.execute({ name: 'US Federal', rate: 0.07, type: 'percentage', country: 'US' });

    expect(result.taxRateId).toBe('txr-1');
    expect(result.rate).toBe(0.07);
    expect(mockRepo.createTaxRate).toHaveBeenCalled();
  });

  it('should throw TaxValidationError when required fields missing', async () => {
    await expect(useCase.execute({ name: '', rate: 0.1, type: 'percentage', country: 'US' })).rejects.toThrow(TaxValidationError);
    await expect(useCase.execute({ name: 'Test', rate: undefined as never, type: 'percentage', country: 'US' })).rejects.toThrow(TaxValidationError);
    await expect(useCase.execute({ name: 'Test', rate: 0.1, type: 'percentage', country: '' })).rejects.toThrow(TaxValidationError);
  });

  it('should throw InvalidTaxRateError when rate is out of range', async () => {
    await expect(useCase.execute({ name: 'Test', rate: -0.1, type: 'percentage', country: 'US' })).rejects.toThrow(InvalidTaxRateError);
    await expect(useCase.execute({ name: 'Test', rate: 1.5, type: 'percentage', country: 'US' })).rejects.toThrow(InvalidTaxRateError);
  });
});
