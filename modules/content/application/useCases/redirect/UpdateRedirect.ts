/**
 * Update Redirect Use Case
 * Updates a redirect and emits an update event
 */

import type { IContentRedirectRepository } from '../../../domain/repositories/ContentRedirectRepository';
import type { ContentRedirect } from '../../../domain/entities/ContentModel';
import { eventBus } from '../../../../../libs/events/eventBus';
import { RedirectNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';

// ============================================================================
// Command
// ============================================================================

export class UpdateRedirectCommand {
  constructor(
    public readonly redirectId: string,
    public readonly updates: {
      sourceUrl?: string;
      targetUrl?: string;
      statusCode?: string;
      isRegex?: boolean;
      isActive?: boolean;
      notes?: string;
    },
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class UpdateRedirectUseCase {
  constructor(private readonly redirectRepo: IContentRedirectRepository) {}

  async execute(command: UpdateRedirectCommand): Promise<ContentRedirect> {
    const existing = await this.redirectRepo.findRedirectById(command.redirectId);
    if (!existing) {
      throw new RedirectNotFoundError(command.redirectId);
    }

    const sourceUrl = command.updates.sourceUrl ?? existing.sourceUrl;
    const targetUrl = command.updates.targetUrl ?? existing.targetUrl;
    if (sourceUrl === targetUrl) {
      throw new ContentValidationError('Source and target URLs cannot be the same');
    }

    if (command.updates.isRegex ?? existing.isRegex) {
      try {
        new RegExp(sourceUrl);
      } catch {
        throw new ContentValidationError('Invalid regex pattern in source URL');
      }
    }

    const updated = await this.redirectRepo.updateRedirect(command.redirectId, command.updates);

    eventBus.emit('content.redirect.updated', {
      redirectId: command.redirectId,
      sourceUrl: updated.sourceUrl,
      targetUrl: updated.targetUrl,
    });

    return updated;
  }
}
