import { StoreRepository, StoreFilters } from '../../domain/repositories/StoreRepository';
import { Store } from '../../domain/entities/Store';

export class ManageStoresAdminUseCase {
  constructor(private readonly storeRepository: StoreRepository) {}

  async findById(id: string) {
    return this.storeRepository.findById(id);
  }
  async findBySlug(slug: string) {
    return this.storeRepository.findBySlug(slug);
  }
  async findAll(filters?: StoreFilters) {
    return this.storeRepository.findAll(filters);
  }
  async save(store: Store) {
    return this.storeRepository.save(store);
  }
  async delete(id: string) {
    return this.storeRepository.delete(id);
  }
  async count(filters?: StoreFilters) {
    return this.storeRepository.count(filters);
  }
  async findByBusiness(organizationId: string) {
    return this.storeRepository.findByBusiness(organizationId);
  }
  async findActive() {
    return this.storeRepository.findActive();
  }
  async findFeatured() {
    return this.storeRepository.findFeatured();
  }
  async findByType(storeType: string) {
    return this.storeRepository.findByType(storeType);
  }
}
