import { StoreDispatchRepository } from '../../domain/repositories/StoreDispatchRepository';

export class GetStoreDispatchUseCase {
  constructor(private readonly dispatchRepository: StoreDispatchRepository) {}

  async execute(dispatchId: string): Promise<Record<string, any> | null> {
    const dispatch = await this.dispatchRepository.findById(dispatchId);
    return dispatch ? dispatch.toJSON() : null;
  }
}
