import { CreateCurrencyUseCase} from './CreateCurrency';
import { CurrencyCodeAlreadyExistsError, LocalizationValidationError } from '../../domain/errors/LocalizationErrors';

describe('CreateCurrencyUseCase', () => {
  let useCase: CreateCurrencyUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findCurrencyByCode: jest.fn().mockResolvedValue(null),
      createCurrency: jest.fn().mockResolvedValue({
        currencyId: 'cur1', code: 'USD', name: 'US Dollar', symbol: '$',
        exchangeRate: 1, isDefault: true, createdAt: new Date(),
      }),
    };
    useCase = new CreateCurrencyUseCase(mockRepo as never);
  });

  it('should create currency (happy path)', async () => {
    const result = await useCase.execute({ code: 'USD', name: 'US Dollar', symbol: '$' });

    expect(result.code).toBe('USD');
    expect(result.symbol).toBe('$');
  });

  it('should throw LocalizationValidationError when code is empty', async () => {
    await expect(useCase.execute({ code: '', name: 'Dollar', symbol: '$' })).rejects.toThrow(LocalizationValidationError);
  });

  it('should throw CurrencyCodeAlreadyExistsError when code exists', async () => {
    mockRepo.findCurrencyByCode.mockResolvedValue({ currencyId: 'existing' });

    await expect(useCase.execute({ code: 'USD', name: 'Dollar', symbol: '$' })).rejects.toThrow(CurrencyCodeAlreadyExistsError);
  });
});
