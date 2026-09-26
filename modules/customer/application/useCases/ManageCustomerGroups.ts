import type { CustomerGroup, CustomerGroupMembership } from '../../../../libs/db/types';
import type { CustomerRepository } from '../../domain/repositories/CustomerRepository';

export type CustomerGroupCreateParams = Omit<CustomerGroup, 'customerGroupId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;
export type CustomerGroupUpdateParams = Partial<Omit<CustomerGroup, 'customerGroupId' | 'code' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export interface CustomerGroupPort {
  findById(id: string): Promise<CustomerGroup | null>;
  findByCode(code: string): Promise<CustomerGroup | null>;
  findAll(activeOnly?: boolean): Promise<CustomerGroup[]>;
  create(params: CustomerGroupCreateParams): Promise<CustomerGroup>;
  update(id: string, params: CustomerGroupUpdateParams): Promise<CustomerGroup | null>;
  delete(id: string): Promise<boolean>;
}

export interface CustomerGroupMembershipPort {
  findById(id: string): Promise<CustomerGroupMembership | null>;
  findByCustomerId(customerId: string, activeOnly?: boolean): Promise<CustomerGroupMembership[]>;
  findByGroupId(customerGroupId: string, activeOnly?: boolean): Promise<CustomerGroupMembership[]>;
  isCustomerInGroup(customerId: string, customerGroupId: string): Promise<boolean>;
}

export class ManageCustomerGroupsUseCase {
  constructor(
    private readonly groups: CustomerGroupPort,
    private readonly memberships: CustomerGroupMembershipPort,
    private readonly customers: Pick<CustomerRepository, 'findById'>,
  ) {}

  // Groups
  async findGroupById(id: string) {
    return this.groups.findById(id);
  }
  async findGroupByCode(code: string) {
    return this.groups.findByCode(code);
  }
  async findAllGroups(activeOnly?: boolean) {
    return this.groups.findAll(activeOnly);
  }
  async createGroup(params: CustomerGroupCreateParams) {
    return this.groups.create(params);
  }
  async updateGroup(id: string, params: CustomerGroupUpdateParams) {
    return this.groups.update(id, params);
  }
  async deleteGroup(id: string) {
    return this.groups.delete(id);
  }

  // Memberships
  async findMembershipsByGroup(customerGroupId: string, activeOnly?: boolean) {
    return this.memberships.findByGroupId(customerGroupId, activeOnly);
  }
  async findMembershipsByCustomer(customerId: string, activeOnly?: boolean) {
    return this.memberships.findByCustomerId(customerId, activeOnly);
  }
  async isCustomerInGroup(customerId: string, customerGroupId: string) {
    return this.memberships.isCustomerInGroup(customerId, customerGroupId);
  }

  /** Customers belonging to a group (membership join) */
  async findCustomersInGroup(customerGroupId: string) {
    const memberships = await this.memberships.findByGroupId(customerGroupId, true);
    const customers = await Promise.all(memberships.map(m => this.customers.findById(m.customerId)));
    return customers.filter(Boolean);
  }
}
