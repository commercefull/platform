import notificationConfigRepository from '../../infrastructure/repositories/NotificationConfigRepository';

const notificationTemplateTranslationRepo = notificationConfigRepository.templateTranslations;

export class GetTemplateTranslationsUseCase {
  async findByTemplate(templateId: string) {
    return notificationTemplateTranslationRepo.findByTemplate(templateId);
  }
}
