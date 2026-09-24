import { lazyMock, createContentPage, createContentBlock, emitMock } from '../../../tests/testUtils';
import { DuplicatePageUseCase, DuplicatePageCommand } from './DuplicatePage';
import { ContentPageNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';

beforeEach(() => {
  emitMock.mockClear();
});

describe('DuplicatePageUseCase', () => {
  let useCase: DuplicatePageUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof DuplicatePageUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof DuplicatePageUseCase>[0]>();
    mockRepo.findPageById.mockResolvedValue(createContentPage({ contentPageId: 'p1', title: 'Original', slug: 'original' }));
    mockRepo.createPage.mockResolvedValue(createContentPage({ contentPageId: 'p2', title: 'Copy', slug: 'copy' }));
    mockRepo.findBlocksByPageId.mockResolvedValue([]);
    mockRepo.createBlock.mockImplementation(async (params) => createContentBlock(params));
    useCase = new DuplicatePageUseCase(mockRepo);
  });

  it('should duplicate a page with its blocks', async () => {
    mockRepo.findBlocksByPageId.mockResolvedValue([
      createContentBlock({ contentBlockId: 'b1', blockTypeId: 'bt-1', title: 'Block 1', sortOrder: 0, content: {}, isVisible: true }),
    ]);

    const result = await useCase.execute(new DuplicatePageCommand('p1', 'Copy', 'copy'));

    expect(result.contentPageId).toBe('p2');
    expect(result.blocksCopied).toBe(1);
    expect(emitMock).toHaveBeenCalled();
  });

  it('should throw ContentValidationError when required fields missing', async () => {
    await expect(useCase.execute(new DuplicatePageCommand('', 'Copy', 'copy'))).rejects.toThrow(ContentValidationError);
    await expect(useCase.execute(new DuplicatePageCommand('p1', '', 'copy'))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentPageNotFoundError when original does not exist', async () => {
    mockRepo.findPageById.mockResolvedValue(null);

    await expect(useCase.execute(new DuplicatePageCommand('missing', 'Copy', 'copy'))).rejects.toThrow(ContentPageNotFoundError);
  });
});
