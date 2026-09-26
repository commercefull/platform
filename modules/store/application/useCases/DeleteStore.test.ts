import { DeleteStoreUseCase } from './DeleteStore';
import type { StoreRepository } from '../../domain/repositories/StoreRepository';
import { eventBus } from '../../../../libs/events/eventBus';

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

const emitMock = jest.mocked(eventBus.emit);

const lazyMock = <T extends object>(): jest.Mocked<T> => {
  const fns = new Map<PropertyKey, jest.Mock>();
  return new Proxy({} as object, {
    get: (_t, prop) => {
      if (!fns.has(prop)) fns.set(prop, jest.fn());
      return fns.get(prop);
    },
  }) as jest.Mocked<T>;
};

describe('DeleteStoreUseCase', () => {
  let repo: jest.Mocked<StoreRepository>;
  let useCase: DeleteStoreUseCase;

  beforeEach(() => {
    repo = lazyMock<StoreRepository>();
    useCase = new DeleteStoreUseCase(repo);
    emitMock.mockClear();
  });

  it('should delete the store and emit store.deleted', async () => {
    await useCase.execute('store-1');

    expect(repo.delete).toHaveBeenCalledWith('store-1');
    expect(emitMock).toHaveBeenCalledWith('store.deleted', { storeId: 'store-1' });
  });
});
