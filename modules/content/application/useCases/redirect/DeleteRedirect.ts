/**
 * Delete Redirect Use Case
 * Deletes a redirect and emits a deletion event
 */

import type { IContentRedirectRepository } from '../../../domain/repositories/ContentRedirectRepository';
import { eventBus } from '../../../../../libs/events/eventBus';
import { RedirectNotFoundError } from '../../../domain/errors/ContentErrors';

// ============================================================================
// Use Case
// ============================================================================

export class DeleteRedirectUseCase {
  constructor(private readonly redirectRepo: IContentRedirectRepository) {}

  async execute(redirectId: string): Promise<void> {
    const redirect = await this.redirectRepo.findRedirectById(redirectId);
    if (!redirect) {
      throw new RedirectNotFoundError(redirectId);
    }

    await this.redirectRepo.deleteRedirect(redirectId);

    eventBus.emit('content.redirect.deleted', { redirectId, sourceUrl: redirect.sourceUrl });
  }
}
