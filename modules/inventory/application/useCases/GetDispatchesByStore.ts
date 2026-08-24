import storeDispatchRepository from '../../infrastructure/repositories/StoreDispatchAggregateRepository';

export class GetDispatchesByStoreUseCase {
  async execute(storeId: string, limit = 10, offset = 0) {
    const result = await storeDispatchRepository.findAll(
      { fromStoreId: storeId },
      { limit, offset },
    );
    return result;
  }
}
