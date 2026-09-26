/**
 * Delete Media Use Case
 * Deletes a media asset and emits a deletion event
 */

import type { IContentMediaRepository } from '../../../domain/repositories/ContentMediaRepository';
import { eventBus } from '../../../../../libs/events/eventBus';
import { MediaAssetNotFoundError } from '../../../domain/errors/ContentErrors';

// ============================================================================
// Use Case
// ============================================================================

export class DeleteMediaUseCase {
  constructor(private readonly mediaRepo: IContentMediaRepository) {}

  async execute(mediaId: string): Promise<void> {
    const media = await this.mediaRepo.findMediaById(mediaId);
    if (!media) {
      throw new MediaAssetNotFoundError(mediaId);
    }

    await this.mediaRepo.deleteMedia(mediaId);

    eventBus.emit('content.media.deleted', { mediaId, fileName: media.fileName });
  }
}
