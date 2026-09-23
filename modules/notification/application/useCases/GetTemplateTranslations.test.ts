import { createNotificationTemplateTranslation, createNotificationTemplateTranslationRepository } from '../../tests/testUtils';
import { GetTemplateTranslationsUseCase } from './GetTemplateTranslations';

describe('GetTemplateTranslationsUseCase', () => {
  let useCase: GetTemplateTranslationsUseCase;
  let translationRepo: ReturnType<typeof createNotificationTemplateTranslationRepository>;

  beforeEach(() => {
    translationRepo = createNotificationTemplateTranslationRepository();
    useCase = new GetTemplateTranslationsUseCase(translationRepo);
  });

  it('should return all translations for a template', async () => {
    const translations = [
      createNotificationTemplateTranslation({ locale: 'en-US' }),
      createNotificationTemplateTranslation({ notificationTemplateTranslationId: 'tr-2', locale: 'fr-FR' }),
    ];
    translationRepo.findByTemplate.mockResolvedValue(translations);

    const result = await useCase.findByTemplate('tpl-1');

    expect(result).toEqual(translations);
    expect(translationRepo.findByTemplate).toHaveBeenCalledWith('tpl-1');
  });

  it('should return an empty list when the template has no translations', async () => {
    translationRepo.findByTemplate.mockResolvedValue([]);

    const result = await useCase.findByTemplate('tpl-none');

    expect(result).toEqual([]);
  });
});
