import '../../tests/testUtils';
import { PreviewDraftUseCase } from './PreviewDraft';
import { PageDraftNotFoundError } from '../../domain/errors/PageBuilderErrors';
import type { PageDraftRepository } from '../../domain/repositories/PageDraftRepository';
import type { ThemeRepository } from '../../../theme/domain/repositories/ThemeRepository';
import { createPageDraft, lazyMock, registerBuiltInBlocks } from '../../tests/testUtils';

describe('PreviewDraftUseCase', () => {
  let repo: jest.Mocked<PageDraftRepository>;
  let themeRepo: jest.Mocked<ThemeRepository>;
  let useCase: PreviewDraftUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    registerBuiltInBlocks();
    repo = lazyMock<PageDraftRepository>();
    themeRepo = lazyMock<ThemeRepository>();
    useCase = new PreviewDraftUseCase(repo, themeRepo);
  });

  it('should throw PageDraftNotFoundError when the draft does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.preview('missing')).rejects.toThrow(PageDraftNotFoundError);
  });

  it('should return the draft with fallback theme data when no store is assigned', async () => {
    repo.findById.mockResolvedValue(createPageDraft({ themeId: 'theme-1' }));

    const result = await useCase.preview('d-1');

    expect(result.draft.draftId).toBe('draft-1');
    expect(result.theme.themeId).toBe('theme-1');
    expect(result.theme.name).toBe('Unknown');
    expect(result.theme.headTags).toEqual([]);
    expect(result.blockTypes.size).toBe(0);
  });

  it('should map registered block types for the draft blocks', async () => {
    repo.findById.mockResolvedValue(
      createPageDraft({
        blocks: [
          { blockId: 'b-1', typeId: 'heading', region: 'main', order: 0, content: {}, settings: {} },
          { blockId: 'b-2', typeId: 'unknown-type', region: 'main', order: 1, content: {}, settings: {} },
        ],
      }),
    );

    const result = await useCase.preview('d-1');

    expect(result.blocks).toHaveLength(2);
    expect(result.blockTypes.get('heading')?.name).toBe('Heading');
    expect(result.blockTypes.has('unknown-type')).toBe(false);
  });
});
