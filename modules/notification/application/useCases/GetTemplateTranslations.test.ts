jest.mock('../../infrastructure/repositories/NotificationConfigRepository', () => ({
  __esModule: true,
  default: {
    templateTranslations: {
      findByTemplate: jest.fn().mockResolvedValue([{ translationId: 't1', locale: 'en-US' }]),
    },
    templates: {},
    preferences: {},
    devices: {},
  },
}));

import { GetTemplateTranslationsUseCase } from './GetTemplateTranslations';
import notificationConfigRepository from '../../infrastructure/repositories/NotificationConfigRepository';

const mockRepo = notificationConfigRepository as unknown as { templateTranslations: Record<string, jest.Mock> };

describe('GetTemplateTranslationsUseCase', () => {
  let useCase: GetTemplateTranslationsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetTemplateTranslationsUseCase();
  });

  it('should find translations by template', async () => {
    const result = await useCase.findByTemplate('t1');
    expect(result).toHaveLength(1);
    expect(mockRepo.templateTranslations.findByTemplate).toHaveBeenCalledWith('t1');
  });
});
