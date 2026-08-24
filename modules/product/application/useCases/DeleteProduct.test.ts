import { DeleteProductUseCase } from './DeleteProduct';

describe('DeleteProductUseCase', () => {
  let useCase: DeleteProductUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      delete: jest.fn().mockResolvedValue(undefined),
      hardDelete: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new DeleteProductUseCase(mockRepo as never);
  });

  it('should soft delete product (happy path)', async () => {
    await useCase.execute('p1');

    expect(mockRepo.delete).toHaveBeenCalledWith('p1');
    expect(mockRepo.hardDelete).not.toHaveBeenCalled();
  });

  it('should hard delete when permanent=true', async () => {
    await useCase.execute('p1', true);

    expect(mockRepo.hardDelete).toHaveBeenCalledWith('p1');
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });
});
