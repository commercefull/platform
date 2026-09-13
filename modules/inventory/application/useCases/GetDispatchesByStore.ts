import { StoreDispatchRepository } from '../../domain/repositories/StoreDispatchRepository';

export class GetDispatchesByStoreUseCase {
  constructor(private readonly storeDispatchRepository: StoreDispatchRepository) {}

  async execute(storeId: string, limit = 10, offset = 0) {
    const result = await this.storeDispatchRepository.findAll({ fromStoreId: storeId }, { limit, offset });
    return result;
  }
}
