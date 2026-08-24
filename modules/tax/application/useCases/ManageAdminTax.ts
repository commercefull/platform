import taxQueryRepository from '../../infrastructure/repositories/TaxQueryRepository';

const adminTaxRepo = taxQueryRepository.admin;

export class ManageAdminTaxUseCase {
  async findAllTaxRates() {
    return adminTaxRepo.findAllTaxRates();
  }
  async createTaxRate(params: Parameters<typeof adminTaxRepo.createTaxRate>[0]) {
    return adminTaxRepo.createTaxRate(params);
  }
  async updateTaxRate(...args: Parameters<typeof adminTaxRepo.updateTaxRate>) {
    return adminTaxRepo.updateTaxRate(...args);
  }
  async softDeleteTaxRate(taxRateId: string) {
    return adminTaxRepo.softDeleteTaxRate(taxRateId);
  }
  async findAllTaxZones() {
    return adminTaxRepo.findAllTaxZones();
  }
  async createTaxZone(params: Parameters<typeof adminTaxRepo.createTaxZone>[0]) {
    return adminTaxRepo.createTaxZone(params);
  }
  async updateTaxZone(...args: Parameters<typeof adminTaxRepo.updateTaxZone>) {
    return adminTaxRepo.updateTaxZone(...args);
  }
  async softDeleteTaxZone(taxZoneId: string) {
    return adminTaxRepo.softDeleteTaxZone(taxZoneId);
  }
  async findAllTaxClasses() {
    return adminTaxRepo.findAllTaxClasses();
  }
  async createTaxClass(params: Parameters<typeof adminTaxRepo.createTaxClass>[0]) {
    return adminTaxRepo.createTaxClass(params);
  }
  async updateTaxClass(...args: Parameters<typeof adminTaxRepo.updateTaxClass>) {
    return adminTaxRepo.updateTaxClass(...args);
  }
  async softDeleteTaxClass(taxClassId: string) {
    return adminTaxRepo.softDeleteTaxClass(taxClassId);
  }
}
