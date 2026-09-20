import type { Roles } from '../roles';

export interface HttpUser {
  userId?: string;
  id?: string;
  _id?: string;
  customerId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role?: string;
  roles?: Roles;
  type?: 'admin' | 'organization' | 'b2b' | 'customer';
  status?: boolean;
  organizationId?: string;
  companyId?: string;
  storeId?: string;
  storeRole?: string;
  storeIds?: string[];
  facilityId?: string;
  providerId?: string;
  gender?: string;
  defaultCurrencyId?: string;
  defaultFacilityId?: string;
  permissions?: string[];
}

export interface HttpCompanyUser {
  companyId?: string;
  userId?: string;
  [key: string]: unknown;
}

export interface HttpCustomerContext {
  customerId?: string;
  [key: string]: unknown;
}
