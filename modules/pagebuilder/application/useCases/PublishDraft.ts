import { PageDraft } from '../../domain/entities/PageDraft';
import { PageDraftRepository } from '../../domain/repositories/PageDraftRepository';
import {
  PageDraftNotFoundError,
  DraftAlreadyPublishedError,
  DraftNotReadyToPublishError,
} from '../../domain/errors/PageBuilderErrors';
import { eventBus } from '../../../../libs/events/eventBus';

export class PublishDraftUseCase {
  constructor(private readonly repo: PageDraftRepository) {}

  async publish(draftId: string): Promise<PageDraft> {
    const draft = await this.repo.findById(draftId);
    if (!draft) throw new PageDraftNotFoundError(draftId);

    if (draft.isPublished()) {
      throw new DraftAlreadyPublishedError(draftId);
    }

    if (draft.blocks.length === 0) {
      throw new DraftNotReadyToPublishError('Cannot publish a draft with no blocks');
    }

    draft.publish();
    const saved = await this.repo.save(draft);
    eventBus.emit('pagebuilder.draft.published', { draftId, storeId: draft.storeId, slug: draft.slug });
    return saved;
  }

  async unpublish(draftId: string): Promise<PageDraft> {
    const draft = await this.repo.findById(draftId);
    if (!draft) throw new PageDraftNotFoundError(draftId);

    draft.unpublish();
    const saved = await this.repo.save(draft);
    eventBus.emit('pagebuilder.draft.unpublished', { draftId });
    return saved;
  }
}

