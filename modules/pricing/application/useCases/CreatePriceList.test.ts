import { CreatePriceListUseCase} from './CreatePriceList';
import { PricingValidationError } from '../../domain/errors/PricingErrors';

describe('CreatePriceListUseCase', () => {
  let useCase: CreatePriceListUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      createPriceList: jest.fn().mockResolvedValue({
        priceListId: 'pl-1', name: 'Retail', type: 'standard', currencyCode: 'USD', isDefault: false, createdAt: new Date(),
      }),
    };
    useCase = new CreatePriceListUseCase(mockRepo as never);
  });

  it('should create a price list (happy path)', async () => {
    const result = await useCase.execute({ name: 'Retail', currencyCode: 'USD', type: 'standard' });

    expect(result.priceListId).toBe('pl-1');
    expect(result.name).toBe('Retail');
  });

  it('should throw PricingValidationError when name is empty', async () => {
    await expect(useCase.execute({ name: '', currencyCode: 'USD', type: 'standard' })).rejects.toThrow(PricingValidationError);
  });

  it('should throw PricingValidationError when currencyCode is empty', async () => {
    await expect(useCase.execute({ name: 'Test', currencyCode: '', type: 'standard' })).rejects.toThrow(PricingValidationError);
  });
});
