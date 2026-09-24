import '../../tests/testUtils';
import { PublishDraftUseCase } from './PublishDraft';
import {
  DraftAlreadyPublishedError, DraftNotReadyToPublishError, PageDraftNotFoundError,
} from '../../domain/errors/PageBuilderErrors';
import type { PageDraftRepository } from '../../domain/repositories/PageDraftRepository';
import { createPageDraft, emitMock, lazyMock } from '../../tests/testUtils';

describe('PublishDraftUseCase', () => {
  let repo: jest.Mocked<PageDraftRepository>;
  let useCase: PublishDraftUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = lazyMock<PageDraftRepository>();
    repo.save.mockImplementation(async d => d);
    useCase = new PublishDraftUseCase(repo);
  });

  it('should publish a draft with blocks and emit pagebuilder.draft.published', async () => {
    const draft = createPageDraft({ blocks: [{ blockId: 'b-1', typeId: 'heading', region: 'main', order: 0, content: {}, settings: {} }] });
    repo.findById.mockResolvedValue(draft);

    const result = await useCase.publish('d-1');

    expect(result.status).toBe('published');
    expect(emitMock).toHaveBeenCalledWith('pagebuilder.draft.published', expect.objectContaining({ draftId: 'd-1' }));
  });

  it('should throw DraftNotReadyToPublishError when the draft has no blocks', async () => {
    repo.findById.mockResolvedValue(createPageDraft());

    await expect(useCase.publish('d-1')).rejects.toThrow(DraftNotReadyToPublishError);
  });

  it('should throw DraftAlreadyPublishedError when the draft is already published', async () => {
    const draft = createPageDraft({ blocks: [{ blockId: 'b-1', typeId: 'heading', region: 'main', order: 0, content: {}, settings: {} }] });
    draft.publish();
    repo.findById.mockResolvedValue(draft);

    await expect(useCase.publish('d-1')).rejects.toThrow(DraftAlreadyPublishedError);
  });

  it('should throw PageDraftNotFoundError when publishing a missing draft', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.publish('missing')).rejects.toThrow(PageDraftNotFoundError);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('should throw PageDraftNotFoundError when unpublishing a missing draft', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.unpublish('missing')).rejects.toThrow(PageDraftNotFoundError);
    expect(repo.save).not.toHaveBeenCalled();
  });
});

