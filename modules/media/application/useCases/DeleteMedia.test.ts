import { createDeleteMediaRepository } from '../../tests/testUtils';
import { DeleteMediaUseCase } from './DeleteMedia';
import { MediaAssetNotFoundError, MediaValidationError } from '../../domain/errors/MediaErrors';

describe('DeleteMediaUseCase', () => {
  it('should delete the media when it exists and is unused', async () => {
    const repository = createDeleteMediaRepository();

    const result = await new DeleteMediaUseCase(repository).execute({ mediaId: 'm1', deletedBy: 'admin-1' });

    expect(result.deleted).toBe(true);
    expect(result.mediaId).toBe('m1');
    expect(repository.delete).toHaveBeenCalledWith('m1', { deletedBy: 'admin-1' });
  });

  it('should delete without checking usages when force is set', async () => {
    const repository = createDeleteMediaRepository();
    repository.findUsages.mockResolvedValue({ length: 3 });

    const result = await new DeleteMediaUseCase(repository).execute({ mediaId: 'm1', force: true });

    expect(result.deleted).toBe(true);
    expect(repository.findUsages).not.toHaveBeenCalled();
    expect(repository.delete).toHaveBeenCalled();
  });

  it('should throw MediaAssetNotFoundError when the media does not exist', async () => {
    const repository = createDeleteMediaRepository();
    repository.findById.mockResolvedValue(null);

    await expect(new DeleteMediaUseCase(repository).execute({ mediaId: 'missing' })).rejects.toThrow(
      MediaAssetNotFoundError,
    );
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('should throw MediaValidationError when the media is still in use', async () => {
    const repository = createDeleteMediaRepository();
    repository.findUsages.mockResolvedValue({ length: 2 });

    await expect(new DeleteMediaUseCase(repository).execute({ mediaId: 'm1' })).rejects.toThrow(MediaValidationError);
    expect(repository.delete).not.toHaveBeenCalled();
  });
});
