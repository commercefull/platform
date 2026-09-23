import { DeleteProductUseCase } from './DeleteProduct';
import { lazyMock } from '../../tests/testUtils';

describe('DeleteProductUseCase', () => {
  let useCase: DeleteProductUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof DeleteProductUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof DeleteProductUseCase>[0]>();
    useCase = new DeleteProductUseCase(mockRepo);
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
