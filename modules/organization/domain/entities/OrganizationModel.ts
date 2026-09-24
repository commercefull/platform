/**
 * Database record types — match the generated libs/db/types schema.
 * Kept in domain so repository ports do not depend on the database layer.
 */

export type OrganizationRecord = {
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  slug: string;
  description: string | null;
  email: string;
  phone: string | null;
  password: string;
  website: string | null;
  logo: string | null;
  bannerImage: string | null;
  status: string;
  verificationStatus: string;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  verificationNotes: string | null;
  businessType: string | null;
  yearEstablished: number | null;
  employeeCount: number | null;
  taxIdNumber: string | null;
  legalName: string | null;
  vatNumber: string | null;
  vatVerified: boolean | null;
  vatVerifiedAt: Date | null;
  vatVerificationSource: string | null;
  ossRegistered: boolean | null;
  ossRegistrationCountry: string | null;
  iossRegistered: boolean | null;
  iossNumber: string | null;
  eoriNumber: string | null;
  ukVatNumber: string | null;
  reverseChargeEligible: boolean | null;
  defaultTaxCountry: string | null;
  socialLinks: unknown | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  commissionRate: string | null;
  commissionType: string | null;
  commissionTiers: unknown | null;
  minimumPayoutAmountCents: number | null;
  payoutSchedule: string | null;
  autoApproveProducts: boolean;
  autoApproveReviews: boolean;
  sellerRating: string | null;
  featuredOrganization: boolean;
  storePolicies: unknown | null;
  notificationPreferences: unknown | null;
  allowedCategories: string[] | null;
  notes: string | null;
  customFields: unknown | null;
  lastLoginAt: Date | null;
  emailVerified: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  type: string | null;
  commissionPlanId: string | null;
  deletedAt: Date | null;
  settings: Record<string, unknown> | null;
  parentOrganizationId: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  timezone: string | null;
  defaultCurrency: string | null;
  defaultLocale: string | null;
  metadata: Record<string, unknown> | null;
  isActive: boolean | null;
}

export type OrganizationAddress = {
  organizationAddressId: string;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  addressType: string;
  isDefault: boolean;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string | null;
  email: string | null;
  isVerified: boolean;
  verifiedAt: Date | null;
  latitude: string | null;
  longitude: string | null;
  notes: string | null;
}

export type OrganizationPaymentInfo = {
  organizationPaymentInfoId: string;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  paymentType: string;
  isDefault: boolean;
  accountHolderName: string | null;
  bankName: string | null;
  accountNumber: string | null;
  routingNumber: string | null;
  accountType: string | null;
  paypalEmail: string | null;
  providerId: string | null;
  providerData: unknown | null;
  currencyCode: string;
  isVerified: boolean;
  verifiedAt: Date | null;
  lastPayoutDate: Date | null;
  notes: string | null;
  createdBy: string | null;
}

