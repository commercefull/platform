import { createCreateLocaleRepository, createCreatedLocale } from '../../tests/testUtils';
import { CreateLocaleUseCase } from './CreateLocale';
import { LocaleCodeAlreadyExistsError, LocalizationValidationError } from '../../domain/errors/LocalizationErrors';

describe('CreateLocaleUseCase', () => {
  it('should create the locale when the code is available', async () => {
    const repository = createCreateLocaleRepository();

    const result = await new CreateLocaleUseCase(repository).execute({ code: 'en-US', name: 'English (US)' });

    expect(result.localeId).toMatch(/^loc_/);
    expect(result.code).toBe('en-US');
    expect(repository.createLocale).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'en-US',
        direction: 'ltr',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm:ss',
        numberFormat: { decimal: '.', thousands: ',', precision: 2 },
        isDefault: false,
        isActive: true,
      }),
    );
  });

  it('should pass optional fields through when provided', async () => {
    const repository = createCreateLocaleRepository();

    await new CreateLocaleUseCase(repository).execute({
      code: 'ar-EG',
      name: 'Arabic (Egypt)',
      direction: 'rtl',
      isDefault: true,
    });

    expect(repository.createLocale).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ar-EG', direction: 'rtl', isDefault: true }),
    );
  });

  it('should throw LocalizationValidationError when required fields are missing', async () => {
    const repository = createCreateLocaleRepository();

    await expect(new CreateLocaleUseCase(repository).execute({ code: '', name: 'English' })).rejects.toThrow(
      LocalizationValidationError,
    );
    await expect(new CreateLocaleUseCase(repository).execute({ code: 'en-US', name: '' })).rejects.toThrow(
      LocalizationValidationError,
    );
    expect(repository.createLocale).not.toHaveBeenCalled();
  });

  it('should throw LocaleCodeAlreadyExistsError when the code is taken', async () => {
    const repository = createCreateLocaleRepository(createCreatedLocale());

    await expect(new CreateLocaleUseCase(repository).execute({ code: 'en-US', name: 'English' })).rejects.toThrow(
      LocaleCodeAlreadyExistsError,
    );
    expect(repository.createLocale).not.toHaveBeenCalled();
  });
});
