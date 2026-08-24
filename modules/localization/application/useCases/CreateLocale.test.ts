import { CreateLocaleUseCase} from './CreateLocale';
import { LocaleCodeAlreadyExistsError, LocalizationValidationError } from '../../domain/errors/LocalizationErrors';

describe('CreateLocaleUseCase', () => {
  let useCase: CreateLocaleUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findLocaleByCode: jest.fn().mockResolvedValue(null),
      createLocale: jest.fn().mockResolvedValue({
        localeId: 'loc1', code: 'en-US', name: 'English (US)', isDefault: true, isActive: true, createdAt: new Date(),
      }),
    };
    useCase = new CreateLocaleUseCase(mockRepo as never);
  });

  it('should create locale (happy path)', async () => {
    const result = await useCase.execute({ code: 'en-US', name: 'English (US)' });

    expect(result.code).toBe('en-US');
    expect(result.isDefault).toBe(true);
  });

  it('should throw LocalizationValidationError when code is empty', async () => {
    await expect(useCase.execute({ code: '', name: 'English' })).rejects.toThrow(LocalizationValidationError);
  });

  it('should throw LocaleCodeAlreadyExistsError when code exists', async () => {
    mockRepo.findLocaleByCode.mockResolvedValue({ localeId: 'existing' });

    await expect(useCase.execute({ code: 'en-US', name: 'English' })).rejects.toThrow(LocaleCodeAlreadyExistsError);
  });
});
