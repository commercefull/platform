import type {
  OrganizationRepository,
  OrganizationCreateParams,
  OrganizationUpdateParams,
  OrganizationAddressCreateParams,
  OrganizationPaymentInfoCreateParams,
} from '../../domain/repositories/OrganizationRepository';
import { OrganizationEmailAlreadyExistsError } from '../../domain/errors/OrganizationErrors';

export class ManageOrganizationsUseCase {
  constructor(private readonly organizationRepo: OrganizationRepository) {}

  async findById(organizationId: string) {
    return this.organizationRepo.findById(organizationId);
  }
  async findByEmail(email: string) {
    return this.organizationRepo.findByEmail(email);
  }
  async findAll(limit?: number, offset?: number) {
    return this.organizationRepo.findAll(limit, offset);
  }
  async findByStatus(status: string, limit?: number) {
    return this.organizationRepo.findByStatus(status, limit);
  }
  async create(params: OrganizationCreateParams) {
    return this.organizationRepo.create(params);
  }
  async createWithPassword(params: OrganizationCreateParams & { password: string }) {
    const existing = await this.organizationRepo.findByEmail(params.email);
    if (existing) {
      throw new OrganizationEmailAlreadyExistsError(params.email);
    }
    return this.organizationRepo.createWithPassword(params);
  }
  async update(organizationId: string, params: OrganizationUpdateParams) {
    return this.organizationRepo.update(organizationId, params);
  }
  async delete(organizationId: string) {
    return this.organizationRepo.delete(organizationId);
  }
  async getStoresByOrganization(organizationId: string) {
    return this.organizationRepo.getStoresByOrganization(organizationId);
  }

  async findAddressesByOrganizationId(organizationId: string) {
    return this.organizationRepo.findAddressesByOrganizationId(organizationId);
  }
  async findAddressById(addressId: string) {
    return this.organizationRepo.findAddressById(addressId);
  }
  async createAddress(params: OrganizationAddressCreateParams) {
    return this.organizationRepo.createAddress(params);
  }
  async deleteAddress(addressId: string) {
    return this.organizationRepo.deleteAddress(addressId);
  }

  async findPaymentInfoByOrganizationId(organizationId: string) {
    return this.organizationRepo.findPaymentInfoByOrganizationId(organizationId);
  }
  async findPaymentInfoById(paymentInfoId: string) {
    return this.organizationRepo.findPaymentInfoById(paymentInfoId);
  }
  async createPaymentInfo(params: OrganizationPaymentInfoCreateParams) {
    return this.organizationRepo.createPaymentInfo(params);
  }
}
