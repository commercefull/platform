import { createListMediaRepository, createMediaRecord } from '../../tests/testUtils';
import { ListMediaUseCase } from './ListMedia';

describe('ListMediaUseCase', () => {
  it('should list media with default pagination when no input is given', async () => {
    const repository = createListMediaRepository([createMediaRecord(), createMediaRecord({ mediaId: 'm2', fileName: 'doc.pdf' })]);

    const result = await new ListMediaUseCase(repository).execute({});

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.hasMore).toBe(false);
    expect(repository.findAll).toHaveBeenCalledWith({}, { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' });
  });

  it('should pass filters through when they are provided', async () => {
    const repository = createListMediaRepository();

    await new ListMediaUseCase(repository).execute({ folderId: 'f1', mediaType: 'image', tags: ['hero'], search: 'test' });

    expect(repository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ folderId: 'f1', mediaType: 'image', tags: ['hero'], search: 'test' }),
      expect.any(Object),
    );
    expect(repository.count).toHaveBeenCalledWith(
      expect.objectContaining({ folderId: 'f1', mediaType: 'image', tags: ['hero'], search: 'test' }),
    );
  });

  it('should report hasMore when more pages remain', async () => {
    const repository = createListMediaRepository([createMediaRecord()]);
    repository.count.mockResolvedValue(50);

    const result = await new ListMediaUseCase(repository).execute({ page: 1, limit: 10 });

    expect(result.hasMore).toBe(true);
  });

  it('should use the requested page and ordering when provided', async () => {
    const repository = createListMediaRepository();

    await new ListMediaUseCase(repository).execute({ page: 2, limit: 10, sortBy: 'fileName', sortOrder: 'asc' });

    expect(repository.findAll).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ page: 2, limit: 10, sortBy: 'fileName', sortOrder: 'asc' }),
    );
  });
});
