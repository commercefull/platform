import type { NotificationTemplateTranslationRepository } from '../../domain/repositories/NotificationTemplateTranslationRepository';

export class GetTemplateTranslationsUseCase {
  constructor(private readonly notificationTemplateTranslationRepo: NotificationTemplateTranslationRepository) {}

  async findByTemplate(templateId: string) {
    return this.notificationTemplateTranslationRepo.findByTemplate(templateId);
  }
}
