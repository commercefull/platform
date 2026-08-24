import { ListMediaUseCase} from './ListMedia';

describe('ListMediaUseCase', () => {
  let useCase: ListMediaUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn().mockResolvedValue([
        { mediaId: 'm1', fileName: 'image1.jpg', mimeType: 'image/jpeg', fileSize: 1024, url: '/img1.jpg', mediaType: 'image', createdAt: new Date() },
        { mediaId: 'm2', fileName: 'doc1.pdf', mimeType: 'application/pdf', fileSize: 2048, url: '/doc1.pdf', mediaType: 'document', createdAt: new Date() },
      ]),
      count: jest.fn().mockResolvedValue(2),
    };
    useCase = new ListMediaUseCase(mockRepo as never);
  });

  it('should list media (happy path)', async () => {
    const result = await useCase.execute({});

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.hasMore).toBe(false);
  });

  it('should pass filters to repository', async () => {
    await useCase.execute({ folderId: 'f1', mediaType: 'image', search: 'test' });

    expect(mockRepo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ folderId: 'f1', mediaType: 'image', search: 'test' }),
      expect.any(Object),
    );
  });

  it('should use custom pagination', async () => {
    await useCase.execute({ page: 2, limit: 10 });

    expect(mockRepo.findAll).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ page: 2, limit: 10 }),
    );
  });
});
