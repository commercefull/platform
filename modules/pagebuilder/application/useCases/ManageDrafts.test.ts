import '../../tests/testUtils';
import { ManageDraftsUseCase } from './ManageDrafts';
import {
  PageDraftNotFoundError, PageDraftValidationError,
} from '../../domain/errors/PageBuilderErrors';
import type { PageDraftRepository } from '../../domain/repositories/PageDraftRepository';
import { emitMock, lazyMock } from '../../tests/testUtils';

describe('ManageDraftsUseCase', () => {
  let repo: jest.Mocked<PageDraftRepository>;
  let useCase: ManageDraftsUseCase;

  beforeEach(() => {
    jest.resetAllMocks();
    repo = lazyMock<PageDraftRepository>();
    repo.save.mockImplementation(async d => d);
    useCase = new ManageDraftsUseCase(repo);
  });

  it('should create a draft and emit pagebuilder.draft.created', async () => {
    const result = await useCase.create({ organizationId: 'org-1', title: 'Home', slug: 'home', pageType: 'page' });

    expect(result.status).toBe('draft');
    expect(emitMock).toHaveBeenCalledWith('pagebuilder.draft.created', expect.objectContaining({ slug: 'home' }));
  });

  it('should throw PageDraftValidationError when the title is blank', async () => {
    await expect(useCase.create({ organizationId: 'org-1', title: ' ', slug: 'x', pageType: 'page' }))
      .rejects.toThrow(PageDraftValidationError);
  });

  it('should throw PageDraftValidationError when the slug is missing', async () => {
    await expect(useCase.create({ organizationId: 'org-1', title: 'T', slug: '', pageType: 'page' }))
      .rejects.toThrow(PageDraftValidationError);
  });

  it('should throw PageDraftNotFoundError when the draft does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(useCase.getById('missing')).rejects.toThrow(PageDraftNotFoundError);
  });
});

