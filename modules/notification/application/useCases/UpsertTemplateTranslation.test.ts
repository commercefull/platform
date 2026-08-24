jest.mock('../../infrastructure/repositories/NotificationConfigRepository', () => ({
  __esModule: true,
  default: {
    templateTranslations: {
      upsert: jest.fn().mockResolvedValue({
        notificationTemplateTranslationId: 'tt1', templateId: 't1', locale: 'en-US',
        subject: 'Hello', body: 'Welcome', updatedAt: new Date(),
      }),
    },
    templates: {},
    preferences: {},
    devices: {},
  },
}));

import { UpsertTemplateTranslationUseCase, UpsertTemplateTranslationCommand } from './UpsertTemplateTranslation';
import { NotificationValidationError } from '../../domain/errors/NotificationErrors';

describe('UpsertTemplateTranslationUseCase', () => {
  let useCase: UpsertTemplateTranslationUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new UpsertTemplateTranslationUseCase();
  });

  it('should upsert template translation (happy path)', async () => {
    const result = await useCase.execute(new UpsertTemplateTranslationCommand(
      't1', 'en-US', 'Welcome', 'Hello',
    ));

    expect(result.notificationTemplateTranslationId).toBe('tt1');
    expect(result.locale).toBe('en-US');
  });

  it('should throw NotificationValidationError when templateId is empty', async () => {
    await expect(useCase.execute(new UpsertTemplateTranslationCommand('', 'en-US', 'body'))).rejects.toThrow(NotificationValidationError);
  });

  it('should throw NotificationValidationError when locale is empty', async () => {
    await expect(useCase.execute(new UpsertTemplateTranslationCommand('t1', '', 'body'))).rejects.toThrow(NotificationValidationError);
  });

  it('should throw NotificationValidationError when body is empty', async () => {
    await expect(useCase.execute(new UpsertTemplateTranslationCommand('t1', 'en-US', ''))).rejects.toThrow(NotificationValidationError);
  });
});
