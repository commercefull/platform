import '../../tests/testUtils';
import { ManageBlocksUseCase } from './ManageBlocks';
import {
  PageDraftNotFoundError, BlockTypeNotRegisteredError, BlockNotFoundError,
  BlockPlacementError, PageDraftValidationError,
} from '../../domain/errors/PageBuilderErrors';
import type { PageDraftRepository } from '../../domain/repositories/PageDraftRepository';
import { createPageDraft, emitMock, lazyMock, registerBuiltInBlocks } from '../../tests/testUtils';
import { blockSchemaRegistry } from '../../domain/services/BlockSchemaRegistry';

describe('ManageBlocksUseCase', () => {
  let repo: jest.Mocked<PageDraftRepository>;
  let useCase: ManageBlocksUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    registerBuiltInBlocks();
    repo = lazyMock<PageDraftRepository>();
    repo.save.mockImplementation(async d => d);
    repo.findById.mockResolvedValue(createPageDraft());
    useCase = new ManageBlocksUseCase(repo);
  });

  it('should add a registered block and emit pagebuilder.block.added', async () => {
    const result = await useCase.addBlock({ draftId: 'd-1', typeId: 'heading', region: 'main', content: { text: 'Hi' } });

    expect(result.blocks).toHaveLength(1);
    expect(emitMock).toHaveBeenCalledWith('pagebuilder.block.added', expect.objectContaining({ typeId: 'heading' }));
  });

  it('should throw BlockTypeNotRegisteredError when the type is unknown', async () => {
    await expect(useCase.addBlock({ draftId: 'd-1', typeId: 'nope', region: 'main' }))
      .rejects.toThrow(BlockTypeNotRegisteredError);
  });

  it('should throw PageDraftNotFoundError when the draft does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.addBlock({ draftId: 'missing', typeId: 'heading', region: 'main' }))
      .rejects.toThrow(PageDraftNotFoundError);
  });

  it('should throw BlockNotFoundError when removing a missing block', async () => {
    await expect(useCase.removeBlock('d-1', 'nope')).rejects.toThrow(BlockNotFoundError);
  });

  it('should throw PageDraftValidationError when required block fields are missing', async () => {
    // 'heading' requires the 'text' field; passing explicit empty content skips defaults
    await expect(useCase.addBlock({ draftId: 'd-1', typeId: 'heading', region: 'main', content: {} }))
      .rejects.toThrow(PageDraftValidationError);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('should throw BlockPlacementError when a block exceeds its max-per-page limit', async () => {
    if (!blockSchemaRegistry.has('test-single')) {
      blockSchemaRegistry.register({
        typeId: 'test-single',
        name: 'Single',
        description: 'One per page',
        icon: 'square',
        category: 'content',
        fields: [],
        defaultContent: {},
        maxPerPage: 1,
      });
    }
    const draft = createPageDraft({
      blocks: [{ blockId: 'b-1', typeId: 'test-single', region: 'main', order: 0, content: {}, settings: {} }],
    });
    repo.findById.mockResolvedValue(draft);

    await expect(useCase.addBlock({ draftId: 'd-1', typeId: 'test-single', region: 'main' }))
      .rejects.toThrow(BlockPlacementError);
    expect(repo.save).not.toHaveBeenCalled();
  });
});

