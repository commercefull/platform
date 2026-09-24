/**
 * Database record types — match the generated libs/db/types schema.
 * Kept in domain so repository ports do not depend on the database layer.
 */

export type CustomerRecord = {
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  password: string;
  phone: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  isVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt: Date | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  preferredLocaleId: string | null;
  preferredCurrencyId: string | null;
  timezone: string | null;
  referralSource: string | null;
  referralCode: string | null;
  referredBy: string | null;
  acceptsMarketing: boolean;
  marketingPreferences: unknown | null;
  tags: string[] | null;
  note: string | null;
  externalId: string | null;
  externalSource: string | null;
  taxExempt: boolean;
  taxExemptionCertificate: string | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  verificationToken: string | null;
  agreeToTerms: boolean;
}

export type CustomerAddressRecord = {
  customerAddressId: string;
  createdAt: Date;
  updatedAt: Date;
  customerId: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
  email: string | null;
  isDefault: boolean;
  isDefaultBilling: boolean;
  isDefaultShipping: boolean;
  addressType: string;
  isVerified: boolean;
  verifiedAt: Date | null;
  verificationData: unknown | null;
  additionalInfo: string | null;
  latitude: string | null;
  longitude: string | null;
  name: string | null;
}

