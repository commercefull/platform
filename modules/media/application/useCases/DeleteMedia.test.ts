import { DeleteMediaUseCase} from './DeleteMedia';
import { MediaAssetNotFoundError, MediaValidationError } from '../../domain/errors/MediaErrors';

describe('DeleteMediaUseCase', () => {
  let useCase: DeleteMediaUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn().mockResolvedValue({ mediaId: 'm1' }),
      findUsages: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new DeleteMediaUseCase(mockRepo as never);
  });

  it('should delete media (happy path)', async () => {
    const result = await useCase.execute({ mediaId: 'm1' });

    expect(result.deleted).toBe(true);
    expect(mockRepo.delete).toHaveBeenCalled();
  });

  it('should delete media with force when in use', async () => {
    mockRepo.findUsages.mockResolvedValue({ length: 3 });
    const result = await useCase.execute({ mediaId: 'm1', force: true });

    expect(result.deleted).toBe(true);
  });

  it('should throw MediaAssetNotFoundError when media not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ mediaId: 'missing' })).rejects.toThrow(MediaAssetNotFoundError);
  });

  it('should throw MediaValidationError when media is in use', async () => {
    mockRepo.findUsages.mockResolvedValue({ length: 2 });

    await expect(useCase.execute({ mediaId: 'm1' })).rejects.toThrow(MediaValidationError);
  });
});
