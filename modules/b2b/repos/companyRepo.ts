/**
 * Company Repository
 * Handles CRUD operations for B2B companies
 */

import { query, queryOne } from '../../../libs/db';

// ============================================================================
// Types
// ============================================================================

export type CompanyStatus = 'pending' | 'active' | 'suspended' | 'closed';
export type CompanyType = 'sole_proprietorship' | 'partnership' | 'corporation' | 'llc' | 'nonprofit' | 'government' | 'other';
export type CompanyTier = 'standard' | 'silver' | 'gold' | 'platinum' | 'enterprise';
export type PaymentTermsType = 'prepaid' | 'net' | 'cod' | 'credit';
export type CompanyUserRole = 'admin' | 'manager' | 'buyer' | 'approver' | 'viewer';
export type AddressType = 'billing' | 'shipping' | 'headquarters' | 'warehouse' | 'other';

export interface B2bCompany {
  b2bCompanyId: string;
  name: string;
  legalName?: string;
  registrationNumber?: string;
  vatNumber?: string;
  taxId?: string;
  dunsNumber?: string;
  status: CompanyStatus;
  companyType: CompanyType;
  industry?: string;
  industryCode?: string;
  employeeCount?: number;
  employeeRange?: string;
  annualRevenue?: number;
  revenueRange?: string;
  creditLimit: number;
  availableCredit: number;
  usedCredit: number;
  paymentTermsDays: number;
  paymentTermsType: PaymentTermsType;
  currency: string;
  primaryContactId?: string;
  billingContactId?: string;
  website?: string;
  phone?: string;
  fax?: string;
  email?: string;
  logoUrl?: string;
  description?: string;
  notes?: string;
  metadata?: Record<string, any>;
  customFields?: Record<string, any>;
  taxExempt: boolean;
  taxExemptCertificate?: string;
  taxExemptExpiry?: Date;
  parentCompanyId?: string;
  accountManagerId?: string;
  tier: CompanyTier;
  discountRate: number;
  requiresApproval: boolean;
  orderMinimum?: number;
  orderMaximum?: number;
  approvedAt?: Date;
  approvedBy?: string;
  lastOrderAt?: Date;
  totalOrders: number;
  lifetimeValue: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface B2bCompanyUser {
  b2bCompanyUserId: string;
  b2bCompanyId: string;
  customerId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  role: CompanyUserRole;
  permissions: string[];
  isActive: boolean;
  isPrimaryContact: boolean;
  isBillingContact: boolean;
  canPlaceOrders: boolean;
  canViewPrices: boolean;
  canApproveOrders: boolean;
  canManageUsers: boolean;
  canManageCompany: boolean;
  orderLimit?: number;
  monthlyLimit?: number;
  currentMonthSpend: number;
  requiresApproval: boolean;
  approverId?: string;
  inviteToken?: string;
  invitedAt?: Date;
  inviteExpiresAt?: Date;
  acceptedAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface B2bCompanyAddress {
  b2bCompanyAddressId: string;
  b2bCompanyId: string;
  addressType: AddressType;
  label?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  city: string;
  state?: string;
  postalCode?: string;
  countryCode: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  isDefaultBilling: boolean;
  isDefaultShipping: boolean;
  isVerified: boolean;
  verifiedAt?: Date;
  verificationSource?: string;
  deliveryInstructions?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// ============================================================================
// Company CRUD
// ============================================================================

export async function getCompany(companyId: string): Promise<B2bCompany | null> {
  const row = await queryOne<Record<string, any>>('SELECT * FROM "b2bCompany" WHERE "b2bCompanyId" = $1 AND "deletedAt" IS NULL', [
    companyId,
  ]);
  return row ? mapToCompany(row) : null;
}

export async function getCompanyByVat(vatNumber: string): Promise<B2bCompany | null> {
  const row = await queryOne<Record<string, any>>('SELECT * FROM "b2bCompany" WHERE "vatNumber" = $1 AND "deletedAt" IS NULL', [vatNumber]);
  return row ? mapToCompany(row) : null;
}

export async function getCompanies(
  filters?: { status?: CompanyStatus; tier?: CompanyTier; search?: string },
  pagination?: { limit?: number; offset?: number },
): Promise<{ data: B2bCompany[]; total: number }> {
  let whereClause = '"deletedAt" IS NULL';
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.status) {
    whereClause += ` AND "status" = $${paramIndex++}`;
    params.push(filters.status);
  }
  if (filters?.tier) {
    whereClause += ` AND "tier" = $${paramIndex++}`;
    params.push(filters.tier);
  }
  if (filters?.search) {
    whereClause += ` AND ("name" ILIKE $${paramIndex} OR "legalName" ILIKE $${paramIndex} OR "email" ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "b2bCompany" WHERE ${whereClause}`, params);

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "b2bCompany" WHERE ${whereClause} 
     ORDER BY "name" ASC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset],
  );

  return {
    data: (rows || []).map(mapToCompany),
    total: parseInt(countResult?.count || '0'),
  };
}

export async function saveCompany(company: Partial<B2bCompany> & { name?: string; b2bCompanyId?: string }): Promise<B2bCompany> {
  const now = new Date().toISOString();

  if (company.b2bCompanyId) {
    // For updates, fetch existing company to merge data
    const existing = await getCompany(company.b2bCompanyId);
    if (!existing) throw new Error('Company not found');

    const merged = { ...existing, ...company };
    await query(
      `UPDATE "b2bCompany" SET
        "name" = $1, "legalName" = $2, "registrationNumber" = $3, "vatNumber" = $4,
        "taxId" = $5, "dunsNumber" = $6, "status" = $7, "companyType" = $8,
        "industry" = $9, "employeeCount" = $10, "annualRevenue" = $11,
        "creditLimit" = $12, "availableCredit" = $13, "paymentTermsDays" = $14,
        "paymentTermsType" = $15, "currency" = $16, "website" = $17, "phone" = $18,
        "email" = $19, "logoUrl" = $20, "description" = $21, "notes" = $22,
        "tier" = $23, "discountRate" = $24, "requiresApproval" = $25,
        "orderMinimum" = $26, "orderMaximum" = $27, "taxExempt" = $28,
        "metadata" = $29, "updatedAt" = $30
      WHERE "b2bCompanyId" = $31`,
      [
        merged.name,
        merged.legalName,
        merged.registrationNumber,
        merged.vatNumber,
        merged.taxId,
        merged.dunsNumber,
        merged.status || 'pending',
        merged.companyType || 'corporation',
        merged.industry,
        merged.employeeCount,
        merged.annualRevenue,
        merged.creditLimit || 0,
        merged.availableCredit || 0,
        merged.paymentTermsDays || 30,
        merged.paymentTermsType || 'prepaid',
        merged.currency || 'USD',
        merged.website,
        merged.phone,
        merged.email,
        merged.logoUrl,
        merged.description,
        merged.notes,
        merged.tier || 'standard',
        merged.discountRate || 0,
        merged.requiresApproval || false,
        merged.orderMinimum,
        merged.orderMaximum,
        merged.taxExempt || false,
        merged.metadata ? JSON.stringify(merged.metadata) : null,
        now,
        company.b2bCompanyId,
      ],
    );
    return (await getCompany(company.b2bCompanyId))!;
  } else {
    if (!company.name) throw new Error('Company name is required');
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "b2bCompany" (
        "name", "legalName", "registrationNumber", "vatNumber", "taxId", "dunsNumber",
        "status", "companyType", "industry", "employeeCount", "annualRevenue",
        "creditLimit", "availableCredit", "paymentTermsDays", "paymentTermsType",
        "currency", "website", "phone", "email", "logoUrl", "description", "notes",
        "tier", "discountRate", "requiresApproval", "orderMinimum", "orderMaximum",
        "taxExempt", "metadata", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
      RETURNING *`,
      [
        company.name,
        company.legalName,
        company.registrationNumber,
        company.vatNumber,
        company.taxId,
        company.dunsNumber,
        'pending',
        company.companyType || 'corporation',
        company.industry,
        company.employeeCount,
        company.annualRevenue,
        0,
        0,
        company.paymentTermsDays || 30,
        company.paymentTermsType || 'prepaid',
        company.currency || 'USD',
        company.website,
        company.phone,
        company.email,
        company.logoUrl,
        company.description,
        company.notes,
        'standard',
        0,
        false,
        company.orderMinimum,
        company.orderMaximum,
        company.taxExempt || false,
        company.metadata ? JSON.stringify(company.metadata) : null,
        now,
        now,
      ],
    );
    return mapToCompany(result!);
  }
}

export async function approveCompany(companyId: string, approvedBy: string): Promise<void> {
  const now = new Date().toISOString();
  await query(
    `UPDATE "b2bCompany" SET "status" = 'active', "approvedAt" = $1, "approvedBy" = $2, "updatedAt" = $1
     WHERE "b2bCompanyId" = $3`,
    [now, approvedBy, companyId],
  );
}

export async function suspendCompany(companyId: string): Promise<void> {
  await query(`UPDATE "b2bCompany" SET "status" = 'suspended', "updatedAt" = $1 WHERE "b2bCompanyId" = $2`, [
    new Date().toISOString(),
    companyId,
  ]);
}

export async function deleteCompany(companyId: string): Promise<void> {
  await query('UPDATE "b2bCompany" SET "deletedAt" = $1 WHERE "b2bCompanyId" = $2', [new Date().toISOString(), companyId]);
}

export async function updateCompanyCredit(companyId: string, creditLimit: number, availableCredit: number): Promise<void> {
  await query(
    `UPDATE "b2bCompany" SET "creditLimit" = $1, "availableCredit" = $2, "updatedAt" = $3
     WHERE "b2bCompanyId" = $4`,
    [creditLimit, availableCredit, new Date().toISOString(), companyId],
  );
}

// ============================================================================
// Company Users
// ============================================================================

export async function getCompanyUser(companyUserId: string): Promise<B2bCompanyUser | null> {
  const row = await queryOne<Record<string, any>>('SELECT * FROM "b2bCompanyUser" WHERE "b2bCompanyUserId" = $1 AND "deletedAt" IS NULL', [
    companyUserId,
  ]);
  return row ? mapToCompanyUser(row) : null;
}

export async function getCompanyUserByEmail(companyId: string, email: string): Promise<B2bCompanyUser | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "b2bCompanyUser" WHERE "b2bCompanyId" = $1 AND "email" = $2 AND "deletedAt" IS NULL',
    [companyId, email],
  );
  return row ? mapToCompanyUser(row) : null;
}

export async function getCompanyUsers(companyId: string, includeInactive: boolean = false): Promise<B2bCompanyUser[]> {
  let whereClause = '"b2bCompanyId" = $1 AND "deletedAt" IS NULL';
  if (!includeInactive) {
    whereClause += ' AND "isActive" = true';
  }

  const rows = await query<Record<string, any>[]>(`SELECT * FROM "b2bCompanyUser" WHERE ${whereClause} ORDER BY "lastName", "firstName"`, [
    companyId,
  ]);
  return (rows || []).map(mapToCompanyUser);
}

export async function saveCompanyUser(user: Partial<B2bCompanyUser> & { b2bCompanyId: string; email: string }): Promise<B2bCompanyUser> {
  const now = new Date().toISOString();

  if (user.b2bCompanyUserId) {
    await query(
      `UPDATE "b2bCompanyUser" SET
        "firstName" = $1, "lastName" = $2, "phone" = $3, "jobTitle" = $4,
        "department" = $5, "role" = $6, "permissions" = $7, "isActive" = $8,
        "isPrimaryContact" = $9, "isBillingContact" = $10, "canPlaceOrders" = $11,
        "canViewPrices" = $12, "canApproveOrders" = $13, "canManageUsers" = $14,
        "canManageCompany" = $15, "orderLimit" = $16, "monthlyLimit" = $17,
        "requiresApproval" = $18, "approverId" = $19, "updatedAt" = $20
      WHERE "b2bCompanyUserId" = $21`,
      [
        user.firstName,
        user.lastName,
        user.phone,
        user.jobTitle,
        user.department,
        user.role || 'buyer',
        JSON.stringify(user.permissions || []),
        user.isActive !== false,
        user.isPrimaryContact || false,
        user.isBillingContact || false,
        user.canPlaceOrders !== false,
        user.canViewPrices !== false,
        user.canApproveOrders || false,
        user.canManageUsers || false,
        user.canManageCompany || false,
        user.orderLimit,
        user.monthlyLimit,
        user.requiresApproval || false,
        user.approverId,
        now,
        user.b2bCompanyUserId,
      ],
    );
    return (await getCompanyUser(user.b2bCompanyUserId))!;
  } else {
    // Generate invite token
    const inviteToken = generateToken();
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "b2bCompanyUser" (
        "b2bCompanyId", "customerId", "email", "firstName", "lastName", "phone",
        "jobTitle", "department", "role", "permissions", "isActive",
        "isPrimaryContact", "isBillingContact", "canPlaceOrders", "canViewPrices",
        "canApproveOrders", "canManageUsers", "canManageCompany", "orderLimit",
        "monthlyLimit", "requiresApproval", "approverId", "inviteToken",
        "invitedAt", "inviteExpiresAt", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
      RETURNING *`,
      [
        user.b2bCompanyId,
        user.customerId,
        user.email,
        user.firstName,
        user.lastName,
        user.phone,
        user.jobTitle,
        user.department,
        user.role || 'buyer',
        JSON.stringify(user.permissions || []),
        true,
        user.isPrimaryContact || false,
        user.isBillingContact || false,
        user.canPlaceOrders !== false,
        user.canViewPrices !== false,
        user.canApproveOrders || false,
        user.canManageUsers || false,
        user.canManageCompany || false,
        user.orderLimit,
        user.monthlyLimit,
        user.requiresApproval || false,
        user.approverId,
        inviteToken,
        now,
        inviteExpiresAt.toISOString(),
        now,
        now,
      ],
    );
    return mapToCompanyUser(result!);
  }
}

export async function acceptInvite(inviteToken: string, customerId: string): Promise<B2bCompanyUser | null> {
  const now = new Date().toISOString();

  const result = await queryOne<Record<string, any>>(
    `UPDATE "b2bCompanyUser" SET 
      "customerId" = $1, "acceptedAt" = $2, "inviteToken" = NULL, "updatedAt" = $2
     WHERE "inviteToken" = $3 AND "inviteExpiresAt" > NOW() AND "deletedAt" IS NULL
     RETURNING *`,
    [customerId, now, inviteToken],
  );

  return result ? mapToCompanyUser(result) : null;
}

export async function deleteCompanyUser(companyUserId: string): Promise<void> {
  await query('UPDATE "b2bCompanyUser" SET "deletedAt" = $1 WHERE "b2bCompanyUserId" = $2', [new Date().toISOString(), companyUserId]);
}

// ============================================================================
// Company Addresses
// ============================================================================

export async function getCompanyAddress(companyAddressId: string): Promise<B2bCompanyAddress | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "b2bCompanyAddress" WHERE "b2bCompanyAddressId" = $1 AND "deletedAt" IS NULL',
    [companyAddressId],
  );
  return row ? mapToCompanyAddress(row) : null;
}

export async function getCompanyAddresses(companyId: string, addressType?: AddressType): Promise<B2bCompanyAddress[]> {
  let whereClause = '"b2bCompanyId" = $1 AND "deletedAt" IS NULL';
  const params: any[] = [companyId];

  if (addressType) {
    whereClause += ' AND "addressType" = $2';
    params.push(addressType);
  }

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "b2bCompanyAddress" WHERE ${whereClause} ORDER BY "isDefault" DESC, "createdAt" ASC`,
    params,
  );
  return (rows || []).map(mapToCompanyAddress);
}

export async function saveCompanyAddress(
  address: Partial<B2bCompanyAddress> & {
    b2bCompanyId: string;
    addressLine1: string;
    city: string;
    countryCode: string;
  },
): Promise<B2bCompanyAddress> {
  const now = new Date().toISOString();

  if (address.b2bCompanyAddressId) {
    await query(
      `UPDATE "b2bCompanyAddress" SET
        "addressType" = $1, "label" = $2, "contactName" = $3, "contactPhone" = $4,
        "contactEmail" = $5, "company" = $6, "addressLine1" = $7, "addressLine2" = $8,
        "addressLine3" = $9, "city" = $10, "state" = $11, "postalCode" = $12,
        "countryCode" = $13, "country" = $14, "isDefault" = $15, "isDefaultBilling" = $16,
        "isDefaultShipping" = $17, "deliveryInstructions" = $18, "metadata" = $19, "updatedAt" = $20
      WHERE "b2bCompanyAddressId" = $21`,
      [
        address.addressType || 'shipping',
        address.label,
        address.contactName,
        address.contactPhone,
        address.contactEmail,
        address.company,
        address.addressLine1,
        address.addressLine2,
        address.addressLine3,
        address.city,
        address.state,
        address.postalCode,
        address.countryCode,
        address.country,
        address.isDefault || false,
        address.isDefaultBilling || false,
        address.isDefaultShipping || false,
        address.deliveryInstructions,
        address.metadata ? JSON.stringify(address.metadata) : null,
        now,
        address.b2bCompanyAddressId,
      ],
    );
    return (await getCompanyAddress(address.b2bCompanyAddressId))!;
  } else {
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "b2bCompanyAddress" (
        "b2bCompanyId", "addressType", "label", "contactName", "contactPhone", "contactEmail",
        "company", "addressLine1", "addressLine2", "addressLine3", "city", "state",
        "postalCode", "countryCode", "country", "isDefault", "isDefaultBilling",
        "isDefaultShipping", "deliveryInstructions", "metadata", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        address.b2bCompanyId,
        address.addressType || 'shipping',
        address.label,
        address.contactName,
        address.contactPhone,
        address.contactEmail,
        address.company,
        address.addressLine1,
        address.addressLine2,
        address.addressLine3,
        address.city,
        address.state,
        address.postalCode,
        address.countryCode,
        address.country,
        address.isDefault || false,
        address.isDefaultBilling || false,
        address.isDefaultShipping || false,
        address.deliveryInstructions,
        address.metadata ? JSON.stringify(address.metadata) : null,
        now,
        now,
      ],
    );
    return mapToCompanyAddress(result!);
  }
}

export async function deleteCompanyAddress(companyAddressId: string): Promise<void> {
  await query('UPDATE "b2bCompanyAddress" SET "deletedAt" = $1 WHERE "b2bCompanyAddressId" = $2', [
    new Date().toISOString(),
    companyAddressId,
  ]);
}

// ============================================================================
// Helpers
// ============================================================================

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function mapToCompany(row: Record<string, any>): B2bCompany {
  return {
    b2bCompanyId: row.b2bCompanyId,
    name: row.name,
    legalName: row.legalName,
    registrationNumber: row.registrationNumber,
    vatNumber: row.vatNumber,
    taxId: row.taxId,
    dunsNumber: row.dunsNumber,
    status: row.status,
    companyType: row.companyType,
    industry: row.industry,
    industryCode: row.industryCode,
    employeeCount: row.employeeCount ? parseInt(row.employeeCount) : undefined,
    employeeRange: row.employeeRange,
    annualRevenue: row.annualRevenue ? parseFloat(row.annualRevenue) : undefined,
    revenueRange: row.revenueRange,
    creditLimit: parseFloat(row.creditLimit) || 0,
    availableCredit: parseFloat(row.availableCredit) || 0,
    usedCredit: parseFloat(row.usedCredit) || 0,
    paymentTermsDays: parseInt(row.paymentTermsDays) || 30,
    paymentTermsType: row.paymentTermsType,
    currency: row.currency || 'USD',
    primaryContactId: row.primaryContactId,
    billingContactId: row.billingContactId,
    website: row.website,
    phone: row.phone,
    fax: row.fax,
    email: row.email,
    logoUrl: row.logoUrl,
    description: row.description,
    notes: row.notes,
    metadata: row.metadata,
    customFields: row.customFields,
    taxExempt: Boolean(row.taxExempt),
    taxExemptCertificate: row.taxExemptCertificate,
    taxExemptExpiry: row.taxExemptExpiry ? new Date(row.taxExemptExpiry) : undefined,
    parentCompanyId: row.parentCompanyId,
    accountManagerId: row.accountManagerId,
    tier: row.tier,
    discountRate: parseFloat(row.discountRate) || 0,
    requiresApproval: Boolean(row.requiresApproval),
    orderMinimum: row.orderMinimum ? parseFloat(row.orderMinimum) : undefined,
    orderMaximum: row.orderMaximum ? parseFloat(row.orderMaximum) : undefined,
    approvedAt: row.approvedAt ? new Date(row.approvedAt) : undefined,
    approvedBy: row.approvedBy,
    lastOrderAt: row.lastOrderAt ? new Date(row.lastOrderAt) : undefined,
    totalOrders: parseInt(row.totalOrders) || 0,
    lifetimeValue: parseFloat(row.lifetimeValue) || 0,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined,
  };
}

function mapToCompanyUser(row: Record<string, any>): B2bCompanyUser {
  return {
    b2bCompanyUserId: row.b2bCompanyUserId,
    b2bCompanyId: row.b2bCompanyId,
    customerId: row.customerId,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    jobTitle: row.jobTitle,
    department: row.department,
    role: row.role,
    permissions: row.permissions || [],
    isActive: Boolean(row.isActive),
    isPrimaryContact: Boolean(row.isPrimaryContact),
    isBillingContact: Boolean(row.isBillingContact),
    canPlaceOrders: Boolean(row.canPlaceOrders),
    canViewPrices: Boolean(row.canViewPrices),
    canApproveOrders: Boolean(row.canApproveOrders),
    canManageUsers: Boolean(row.canManageUsers),
    canManageCompany: Boolean(row.canManageCompany),
    orderLimit: row.orderLimit ? parseFloat(row.orderLimit) : undefined,
    monthlyLimit: row.monthlyLimit ? parseFloat(row.monthlyLimit) : undefined,
    currentMonthSpend: parseFloat(row.currentMonthSpend) || 0,
    requiresApproval: Boolean(row.requiresApproval),
    approverId: row.approverId,
    inviteToken: row.inviteToken,
    invitedAt: row.invitedAt ? new Date(row.invitedAt) : undefined,
    inviteExpiresAt: row.inviteExpiresAt ? new Date(row.inviteExpiresAt) : undefined,
    acceptedAt: row.acceptedAt ? new Date(row.acceptedAt) : undefined,
    lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt) : undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined,
  };
}

function mapToCompanyAddress(row: Record<string, any>): B2bCompanyAddress {
  return {
    b2bCompanyAddressId: row.b2bCompanyAddressId,
    b2bCompanyId: row.b2bCompanyId,
    addressType: row.addressType,
    label: row.label,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    company: row.company,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    addressLine3: row.addressLine3,
    city: row.city,
    state: row.state,
    postalCode: row.postalCode,
    countryCode: row.countryCode,
    country: row.country,
    latitude: row.latitude ? parseFloat(row.latitude) : undefined,
    longitude: row.longitude ? parseFloat(row.longitude) : undefined,
    isDefault: Boolean(row.isDefault),
    isDefaultBilling: Boolean(row.isDefaultBilling),
    isDefaultShipping: Boolean(row.isDefaultShipping),
    isVerified: Boolean(row.isVerified),
    verifiedAt: row.verifiedAt ? new Date(row.verifiedAt) : undefined,
    verificationSource: row.verificationSource,
    deliveryInstructions: row.deliveryInstructions,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined,
  };
}
