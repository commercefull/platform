import storeDataRepository from '../../infrastructure/repositories/StoreDataRepository';

const storeRepo = storeDataRepository.stores;

export class ManageStoresAdminUseCase {
  async findById(id: string) {
    return storeRepo.findById(id);
  }
  async findBySlug(slug: string) {
    return storeRepo.findBySlug(slug);
  }
  async findAll(filters?: Parameters<typeof storeRepo.findAll>[0]) {
    return storeRepo.findAll(filters);
  }
  async save(store: Parameters<typeof storeRepo.save>[0]) {
    return storeRepo.save(store);
  }
  async delete(id: string) {
    return storeRepo.delete(id);
  }
  async count(filters?: Parameters<typeof storeRepo.count>[0]) {
    return storeRepo.count(filters);
  }
  async findByBusiness(organizationId: string) {
    return storeRepo.findByBusiness(organizationId);
  }
  async findActive() {
    return storeRepo.findActive();
  }
  async findFeatured() {
    return storeRepo.findFeatured();
  }
  async findByType(storeType: string) {
    return storeRepo.findByType(storeType);
  }
}
