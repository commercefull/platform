/**
 * Set Primary Category Use Case
 * Marks a page's categorization as primary
 */

import { eventBus } from '../../../../../libs/events/eventBus';
import { ContentValidationError } from '../../../domain/errors/ContentErrors';
import type { CategorizationRecord, CategorizationWritePort } from './ports';

// ============================================================================
// Command
// ============================================================================

export class SetPrimaryCategoryCommand {
  constructor(
    public readonly pageId: string,
    public readonly categorizationId: string,
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class SetPrimaryCategoryUseCase {
  constructor(private readonly categorizationRepo: CategorizationWritePort) {}

  async execute(command: SetPrimaryCategoryCommand): Promise<CategorizationRecord> {
    if (!command.categorizationId) {
      throw new ContentValidationError('Categorization ID is required');
    }

    const updated = await this.categorizationRepo.setPrimaryCategory(command.pageId, command.categorizationId);

    eventBus.emit('content.page.primary_category_set', {
      pageId: command.pageId,
      categorizationId: command.categorizationId,
    });

    return updated;
  }
}
