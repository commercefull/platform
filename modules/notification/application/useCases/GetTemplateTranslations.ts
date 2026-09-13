import { notificationConfigRepository } from '../wired';

const notificationTemplateTranslationRepo = notificationConfigRepository.templateTranslations;

export class GetTemplateTranslationsUseCase {
  async findByTemplate(templateId: string) {
    return notificationTemplateTranslationRepo.findByTemplate(templateId);
  }
}
