/**
 * Organization Repository Port
 *
 * Domain interface for organization data access (organizations, addresses, payment info, authentication).
 */

import type {
  Organization,
  OrganizationAddress,
  OrganizationPaymentInfo,
} from 'libs/db/types';

export type OrganizationCreateParams = Partial<Omit<Organization, 'organizationId' | 'createdAt' | 'updatedAt'>> & {
  name: string;
  email: string;
  password: string;
  slug?: string;
  status?: string;
};

export type OrganizationUpdateParams = Partial<Omit<Organization, 'organizationId' | 'createdAt' | 'updatedAt'>>;

export type OrganizationAddressCreateParams = Partial<Omit<OrganizationAddress, 'organizationAddressId' | 'createdAt' | 'updatedAt'>> & {
  organizationId: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type OrganizationPaymentInfoCreateParams = Partial<Omit<OrganizationPaymentInfo, 'organizationPaymentInfoId' | 'createdAt' | 'updatedAt'>> & {
  organizationId: string;
  paymentType: string;
  currency: string;
};

export interface OrganizationRepository {
  // Organization CRUD
  findById(organizationId: string): Promise<Organization | null>;
  findByEmail(email: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  findAll(limit?: number, offset?: number): Promise<Organization[]>;
  findByStatus(status: string, limit?: number): Promise<Organization[]>;
  create(params: OrganizationCreateParams): Promise<Organization>;
  createWithPassword(params: OrganizationCreateParams & { password: string }): Promise<Organization>;
  update(organizationId: string, params: OrganizationUpdateParams): Promise<Organization>;
  delete(organizationId: string): Promise<boolean>;
  getStoresByOrganization(organizationId: string): Promise<unknown[]>;

  // Addresses
  findAddressesByOrganizationId(organizationId: string): Promise<OrganizationAddress[]>;
  findAddressById(addressId: string): Promise<OrganizationAddress | null>;
  createAddress(params: OrganizationAddressCreateParams): Promise<OrganizationAddress>;
  deleteAddress(addressId: string): Promise<boolean>;

  // Payment Info
  findPaymentInfoByOrganizationId(organizationId: string): Promise<OrganizationPaymentInfo[]>;
  findPaymentInfoById(paymentInfoId: string): Promise<OrganizationPaymentInfo | null>;
  createPaymentInfo(params: OrganizationPaymentInfoCreateParams): Promise<OrganizationPaymentInfo>;

  // Authentication
  authenticate(credentials: { email: string; password: string }): Promise<{ organizationId: string; email: string; name: string; status: string } | null>;
  hashPassword(password: string): Promise<string>;
  changePassword(organizationId: string, newPassword: string): Promise<boolean>;
  createPasswordResetToken(organizationId: string): Promise<string>;
  verifyPasswordResetToken(token: string): Promise<string | null>;
  updateLastLogin(organizationId: string): Promise<void>;
}
