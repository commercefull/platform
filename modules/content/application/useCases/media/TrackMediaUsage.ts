/**
 * Track Media Usage Use Case
 * Records where a media asset is referenced and emits a tracking event
 */

import { eventBus } from '../../../../../libs/events/eventBus';
import { ContentValidationError } from '../../../domain/errors/ContentErrors';

// ============================================================================
// Ports
// ============================================================================

export interface MediaUsageRecord {
  contentMediaUsageId: string;
  mediaId: string;
  entityType: string;
  entityId: string;
}

export interface MediaUsageWritePort {
  createUsage(params: {
    mediaId: string;
    entityType: 'contentPage' | 'contentBlock' | 'product' | 'category' | 'organization' | 'blog';
    entityId: string;
    field?: string;
    sortOrder?: number;
  }): Promise<MediaUsageRecord>;
}

// ============================================================================
// Command
// ============================================================================

export class TrackMediaUsageCommand {
  constructor(
    public readonly mediaId: string,
    public readonly entityType: 'contentPage' | 'contentBlock' | 'product' | 'category' | 'organization' | 'blog',
    public readonly entityId: string,
    public readonly field?: string,
    public readonly sortOrder?: number,
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class TrackMediaUsageUseCase {
  constructor(private readonly mediaUsageRepo: MediaUsageWritePort) {}

  async execute(command: TrackMediaUsageCommand): Promise<MediaUsageRecord> {
    if (!command.mediaId || !command.entityType || !command.entityId) {
      throw new ContentValidationError('Media ID, entity type, and entity ID are required');
    }

    const usage = await this.mediaUsageRepo.createUsage({
      mediaId: command.mediaId,
      entityType: command.entityType,
      entityId: command.entityId,
      field: command.field,
      sortOrder: command.sortOrder,
    });

    eventBus.emit('content.media.usage_tracked', {
      mediaId: command.mediaId,
      entityType: command.entityType,
      entityId: command.entityId,
    });

    return usage;
  }
}
