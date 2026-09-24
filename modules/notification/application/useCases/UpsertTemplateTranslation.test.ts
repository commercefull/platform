import { createNotificationTemplateTranslation, createNotificationTemplateTranslationRepository } from '../../tests/testUtils';
import { UpsertTemplateTranslationUseCase, UpsertTemplateTranslationCommand } from './UpsertTemplateTranslation';
import { NotificationValidationError } from '../../domain/errors/NotificationErrors';

describe('UpsertTemplateTranslationUseCase', () => {
  let useCase: UpsertTemplateTranslationUseCase;
  let translationRepo: ReturnType<typeof createNotificationTemplateTranslationRepository>;

  beforeEach(() => {
    translationRepo = createNotificationTemplateTranslationRepository();
    translationRepo.upsert.mockResolvedValue(createNotificationTemplateTranslation());
    useCase = new UpsertTemplateTranslationUseCase(translationRepo);
  });

  it('should upsert the translation and return its record when the command is valid', async () => {
    const result = await useCase.execute(new UpsertTemplateTranslationCommand('tpl-1', 'fr-FR', 'Bonjour', 'Sujet'));

    expect(result.notificationTemplateTranslationId).toBe('tr-1');
    expect(result.locale).toBe('en-US');
    expect(translationRepo.upsert).toHaveBeenCalledWith({
      templateId: 'tpl-1',
      locale: 'fr-FR',
      subject: 'Sujet',
      body: 'Bonjour',
    });
  });

  it.each([
    ['templateId', new UpsertTemplateTranslationCommand('', 'fr-FR', 'Bonjour')],
    ['locale', new UpsertTemplateTranslationCommand('tpl-1', '', 'Bonjour')],
    ['body', new UpsertTemplateTranslationCommand('tpl-1', 'fr-FR', '')],
  ])('should throw NotificationValidationError when %s is missing', async (_field, cmd) => {
    await expect(useCase.execute(cmd)).rejects.toThrow(NotificationValidationError);
    expect(translationRepo.upsert).not.toHaveBeenCalled();
  });

  it('should throw NotificationValidationError when the upsert returns null', async () => {
    translationRepo.upsert.mockResolvedValue(null);

    await expect(useCase.execute(new UpsertTemplateTranslationCommand('tpl-1', 'fr-FR', 'Bonjour'))).rejects.toThrow(
      NotificationValidationError,
    );
  });
});
