/**
 * UpsertTemplateTranslation Use Case
 *
 * Creates or updates a translated template for a given locale.
 *
 * Validates: Requirements 7.7, 7.8
 */

import * as notificationTemplateTranslationRepo from '../../infrastructure/repositories/notificationTemplateTranslationRepo';

// ============================================================================
// Command
// ============================================================================

export class UpsertTemplateTranslationCommand {
  constructor(
    public readonly templateId: string,
    public readonly locale: string,
    public readonly body: string,
    public readonly subject?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface UpsertTemplateTranslationResponse {
  notificationTemplateTranslationId: string;
  templateId: string;
  locale: string;
  subject?: string;
  body: string;
  updatedAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class UpsertTemplateTranslationUseCase {
  constructor(
    private readonly translationRepo: typeof notificationTemplateTranslationRepo = notificationTemplateTranslationRepo,
  ) {}

  async execute(command: UpsertTemplateTranslationCommand): Promise<UpsertTemplateTranslationResponse> {
    if (!command.templateId) throw new Error('templateId is required');
    if (!command.locale) throw new Error('locale is required');
    if (!command.body) throw new Error('body is required');

    const translation = await this.translationRepo.upsert({
      templateId: command.templateId,
      locale: command.locale,
      subject: command.subject,
      body: command.body,
    });

    if (!translation) throw new Error('Failed to upsert template translation');

    return {
      notificationTemplateTranslationId: translation.notificationTemplateTranslationId,
      templateId: translation.templateId,
      locale: translation.locale,
      subject: translation.subject,
      body: translation.body,
      updatedAt: translation.updatedAt.toISOString(),
    };
  }
}
