import { createBasket, createBasketItem, createBasketRepository, emitMock } from '../../tests/testUtils';
import { MergeBasketsCommand, MergeBasketsUseCase } from './MergeBaskets';
import { BasketNotFoundError, BasketValidationError } from '../../domain/errors/BasketErrors';
import type { BasketRepository } from '../../domain/repositories/BasketRepository';

function repositoryWithTwoBaskets(): jest.Mocked<BasketRepository> {
  const source = createBasket({ basketId: 'source-1', items: [createBasketItem({ basketId: 'source-1' })] });
  const target = createBasket({ basketId: 'target-1' });
  const repository = createBasketRepository();
  repository.findById.mockImplementation(id =>
    Promise.resolve(id === 'source-1' ? source : id === 'target-1' ? target : null),
  );
  repository.mergeBaskets.mockResolvedValue(target);
  return repository;
}

describe('MergeBasketsUseCase', () => {
  it('should merge the source basket into the target when both baskets exist', async () => {
    const repository = repositoryWithTwoBaskets();

    const result = await new MergeBasketsUseCase(repository).execute(new MergeBasketsCommand('source-1', 'target-1'));

    expect(repository.mergeBaskets).toHaveBeenCalledWith('source-1', 'target-1');
    expect(result.basketId).toBe('target-1');
  });

  it('should emit basket.merged with the number of merged items when the baskets are merged', async () => {
    const repository = repositoryWithTwoBaskets();

    await new MergeBasketsUseCase(repository).execute(new MergeBasketsCommand('source-1', 'target-1'));

    expect(emitMock).toHaveBeenCalledWith(
      'basket.merged',
      expect.objectContaining({ sourceBasketId: 'source-1', targetBasketId: 'target-1', itemsMerged: 1 }),
    );
  });

  it('should throw BasketValidationError when the source and target are the same basket', async () => {
    const repository = repositoryWithTwoBaskets();

    await expect(new MergeBasketsUseCase(repository).execute(new MergeBasketsCommand('source-1', 'source-1'))).rejects.toThrow(
      BasketValidationError,
    );
    expect(repository.findById).not.toHaveBeenCalled();
    expect(repository.mergeBaskets).not.toHaveBeenCalled();
  });

  it('should throw BasketNotFoundError when the source basket does not exist', async () => {
    const repository = repositoryWithTwoBaskets();

    await expect(new MergeBasketsUseCase(repository).execute(new MergeBasketsCommand('missing', 'target-1'))).rejects.toThrow(
      BasketNotFoundError,
    );
  });

  it('should throw BasketNotFoundError when the target basket does not exist', async () => {
    const repository = repositoryWithTwoBaskets();

    await expect(new MergeBasketsUseCase(repository).execute(new MergeBasketsCommand('source-1', 'missing'))).rejects.toThrow(
      BasketNotFoundError,
    );
  });
});
