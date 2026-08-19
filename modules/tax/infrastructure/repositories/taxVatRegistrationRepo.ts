/**
 * VAT Registration Repository
 * Handles CRUD operations for merchant VAT registrations
 */

import { query, queryOne } from '../../../../libs/db';

// ============================================================================
// Table Constants
// ============================================================================


// ============================================================================
// Types
// ============================================================================

export type VatRegistrationType = 'standard' | 'oss' | 'ioss' | 'moss' | 'non_union' | 'distance_selling';

export interface VatRegistration {
  vatRegistrationId: string;
  organizationId: string;
  countryCode: string;
  vatNumber: string;
  tradingName?: string;
  legalName?: string;
  registrationType: VatRegistrationType;
  isVerified: boolean;
  verifiedAt?: Date;
  verificationSource?: string;
  verificationRequestId?: string;
  verificationResponse?: Record<string, unknown>;
  registrationDate?: Date;
  deregistrationDate?: Date;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
  annualThreshold?: number;
  thresholdCurrency?: string;
  currentYearSales?: number;
  thresholdExceeded?: boolean;
  isActive: boolean;
  notes?: string;
  certificateUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VatValidationLog {
  vatValidationLogId: string;
  customerId?: string;
  organizationId?: string;
  orderId?: string;
  vatNumber: string;
  countryCode: string;
  vatNumberFormatted?: string;
  isValid?: boolean;
  validationStatus: 'valid' | 'invalid' | 'unavailable' | 'timeout' | 'error' | 'format_invalid';
  validationSource: 'vies' | 'hmrc' | 'manual' | 'cache' | 'format';
  requestId?: string;
  response?: Record<string, unknown>;
  companyName?: string;
  companyAddress?: string;
  companyCity?: string;
  companyPostalCode?: string;
  validatedAt: Date;
  responseTimeMs?: number;
  expiresAt?: Date;
  reverseChargeApplicable?: boolean;
  ipAddress?: string;
  context?: string;
  createdAt: Date;
}

// ============================================================================
// VAT Registration CRUD
// ============================================================================

export async function getVatRegistration(vatRegistrationId: string): Promise<VatRegistration | null> {
  const row = await queryOne<Record<string, unknown>>('SELECT * FROM "taxVatRegistration" WHERE "vatRegistrationId" = $1', [vatRegistrationId]);
  return row ? mapToVatRegistration(row) : null;
}

export async function getVatRegistrationsByMerchant(organizationId: string): Promise<VatRegistration[]> {
  const rows = await query<Record<string, unknown>[]>('SELECT * FROM "taxVatRegistration" WHERE "organizationId" = $1 ORDER BY "countryCode" ASC', [
    organizationId,
  ]);
  return (rows || []).map(mapToVatRegistration);
}

export async function getVatRegistrationByCountry(organizationId: string, countryCode: string): Promise<VatRegistration | null> {
  const row = await queryOne<Record<string, unknown>>(
    'SELECT * FROM "taxVatRegistration" WHERE "organizationId" = $1 AND "countryCode" = $2 AND "isActive" = true',
    [organizationId, countryCode],
  );
  return row ? mapToVatRegistration(row) : null;
}

export async function getActiveOssRegistration(organizationId: string): Promise<VatRegistration | null> {
  const row = await queryOne<Record<string, unknown>>(
    `SELECT * FROM "taxVatRegistration" 
     WHERE "organizationId" = $1 AND "registrationType" = 'oss' AND "isActive" = true`,
    [organizationId],
  );
  return row ? mapToVatRegistration(row) : null;
}

export async function saveVatRegistration(
  data: Partial<VatRegistration> & {
    organizationId: string;
    countryCode: string;
    vatNumber: string;
  },
): Promise<VatRegistration> {
  const now = new Date().toISOString();

  if (data.vatRegistrationId) {
    // Update existing
    await query(
      `UPDATE "taxVatRegistration" SET
        "vatNumber" = $1, "tradingName" = $2, "legalName" = $3, "registrationType" = $4,
        "isVerified" = $5, "verifiedAt" = $6, "verificationSource" = $7,
        "registrationDate" = $8, "deregistrationDate" = $9, "effectiveFrom" = $10, "effectiveUntil" = $11,
        "annualThreshold" = $12, "thresholdCurrency" = $13, "currentYearSales" = $14, "thresholdExceeded" = $15,
        "isActive" = $16, "notes" = $17, "certificateUrl" = $18, "updatedAt" = $19
      WHERE "vatRegistrationId" = $20`,
      [
        data.vatNumber,
        data.tradingName,
        data.legalName,
        data.registrationType || 'standard',
        data.isVerified || false,
        data.verifiedAt?.toISOString(),
        data.verificationSource,
        data.registrationDate?.toISOString(),
        data.deregistrationDate?.toISOString(),
        data.effectiveFrom?.toISOString(),
        data.effectiveUntil?.toISOString(),
        data.annualThreshold,
        data.thresholdCurrency || 'EUR',
        data.currentYearSales,
        data.thresholdExceeded || false,
        data.isActive !== false,
        data.notes,
        data.certificateUrl,
        now,
        data.vatRegistrationId,
      ],
    );
    return (await getVatRegistration(data.vatRegistrationId))!;
  } else {
    // Insert new
    const result = await queryOne<Record<string, unknown>>(
      `INSERT INTO "taxVatRegistration" (
        "organizationId", "countryCode", "vatNumber", "tradingName", "legalName", "registrationType",
        "isVerified", "registrationDate", "effectiveFrom",
        "annualThreshold", "thresholdCurrency", "currentYearSales", "thresholdExceeded",
        "isActive", "notes", "certificateUrl", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        data.organizationId,
        data.countryCode,
        data.vatNumber,
        data.tradingName,
        data.legalName,
        data.registrationType || 'standard',
        false,
        data.registrationDate?.toISOString(),
        data.effectiveFrom?.toISOString(),
        data.annualThreshold,
        data.thresholdCurrency || 'EUR',
        data.currentYearSales || 0,
        false,
        true,
        data.notes,
        data.certificateUrl,
        now,
        now,
      ],
    );
    return mapToVatRegistration(result!);
  }
}

export async function deleteVatRegistration(vatRegistrationId: string): Promise<void> {
  await query('DELETE FROM "taxVatRegistration" WHERE "vatRegistrationId" = $1', [vatRegistrationId]);
}

export async function deactivateVatRegistration(vatRegistrationId: string): Promise<void> {
  await query(
    `UPDATE "taxVatRegistration" SET "isActive" = false, "deregistrationDate" = $1, "updatedAt" = $1
     WHERE "vatRegistrationId" = $2`,
    [new Date().toISOString(), vatRegistrationId],
  );
}

// ============================================================================
// VAT Validation
// ============================================================================

export async function logVatValidation(data: Omit<VatValidationLog, 'vatValidationLogId' | 'createdAt'>): Promise<VatValidationLog> {
  const now = new Date().toISOString();

  const result = await queryOne<Record<string, unknown>>(
    `INSERT INTO "taxVatValidationLog" (
      "customerId", "organizationId", "orderId", "vatNumber", "countryCode", "vatNumberFormatted",
      "isValid", "validationStatus", "validationSource", "requestId", "response",
      "companyName", "companyAddress", "companyCity", "companyPostalCode",
      "validatedAt", "responseTimeMs", "expiresAt", "reverseChargeApplicable",
      "ipAddress", "context", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
    RETURNING *`,
    [
      data.customerId,
      data.organizationId,
      data.orderId,
      data.vatNumber,
      data.countryCode,
      data.vatNumberFormatted,
      data.isValid,
      data.validationStatus,
      data.validationSource,
      data.requestId,
      data.response ? JSON.stringify(data.response) : null,
      data.companyName,
      data.companyAddress,
      data.companyCity,
      data.companyPostalCode,
      data.validatedAt.toISOString(),
      data.responseTimeMs,
      data.expiresAt?.toISOString(),
      data.reverseChargeApplicable || false,
      data.ipAddress,
      data.context,
      now,
    ],
  );

  return mapToVatValidationLog(result!);
}

export async function getRecentValidation(
  vatNumber: string,
  countryCode: string,
  maxAgeHours: number = 24,
): Promise<VatValidationLog | null> {
  const row = await queryOne<Record<string, unknown>>(
    `SELECT * FROM "taxVatValidationLog" 
     WHERE "vatNumber" = $1 AND "countryCode" = $2 
     AND "validatedAt" > NOW() - INTERVAL '${maxAgeHours} hours'
     AND "isValid" IS NOT NULL
     ORDER BY "validatedAt" DESC LIMIT 1`,
    [vatNumber, countryCode],
  );
  return row ? mapToVatValidationLog(row) : null;
}

export async function getValidationHistory(vatNumber: string, limit: number = 10): Promise<VatValidationLog[]> {
  const rows = await query<Record<string, unknown>[]>(
    `SELECT * FROM "taxVatValidationLog" 
     WHERE "vatNumber" = $1
     ORDER BY "validatedAt" DESC LIMIT $2`,
    [vatNumber, limit],
  );
  return (rows || []).map(mapToVatValidationLog);
}

// ============================================================================
// VAT Number Formatting & Validation
// ============================================================================

const VAT_PATTERNS: Record<string, RegExp> = {
  AT: /^ATU\d{8}$/,
  BE: /^BE0?\d{9,10}$/,
  BG: /^BG\d{9,10}$/,
  CY: /^CY\d{8}[A-Z]$/,
  CZ: /^CZ\d{8,10}$/,
  DE: /^DE\d{9}$/,
  DK: /^DK\d{8}$/,
  EE: /^EE\d{9}$/,
  EL: /^EL\d{9}$/,
  ES: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
  FI: /^FI\d{8}$/,
  FR: /^FR[A-Z0-9]{2}\d{9}$/,
  HR: /^HR\d{11}$/,
  HU: /^HU\d{8}$/,
  IE: /^IE\d[A-Z0-9+*]\d{5}[A-Z]{1,2}$/,
  IT: /^IT\d{11}$/,
  LT: /^LT(\d{9}|\d{12})$/,
  LU: /^LU\d{8}$/,
  LV: /^LV\d{11}$/,
  MT: /^MT\d{8}$/,
  NL: /^NL\d{9}B\d{2}$/,
  PL: /^PL\d{10}$/,
  PT: /^PT\d{9}$/,
  RO: /^RO\d{2,10}$/,
  SE: /^SE\d{12}$/,
  SI: /^SI\d{8}$/,
  SK: /^SK\d{10}$/,
  GB: /^GB(\d{9}|\d{12}|(GD|HA)\d{3})$/, // UK VAT
  XI: /^XI(\d{9}|\d{12}|(GD|HA)\d{3})$/, // Northern Ireland
};

export function formatVatNumber(vatNumber: string, countryCode?: string): string {
  // Remove spaces and convert to uppercase
  let formatted = vatNumber.replace(/\s/g, '').toUpperCase();

  // Add country code prefix if not present and country code provided
  if (countryCode && !formatted.startsWith(countryCode)) {
    formatted = countryCode + formatted;
  }

  return formatted;
}

export function validateVatNumberFormat(vatNumber: string, countryCode: string): boolean {
  const formatted = formatVatNumber(vatNumber, countryCode);
  const pattern = VAT_PATTERNS[countryCode];

  if (!pattern) {
    // Unknown country, allow any format
    return formatted.length >= 8;
  }

  return pattern.test(formatted);
}

export function extractCountryFromVat(vatNumber: string): string | null {
  const formatted = vatNumber.replace(/\s/g, '').toUpperCase();
  const countryCode = formatted.substring(0, 2);

  if (VAT_PATTERNS[countryCode]) {
    return countryCode;
  }

  return null;
}

// ============================================================================
// Helpers
// ============================================================================

function mapToVatRegistration(row: Record<string, unknown>): VatRegistration {
  return {
    vatRegistrationId: row.vatRegistrationId as string,
    organizationId: row.organizationId as string,
    countryCode: row.countryCode as string,
    vatNumber: row.vatNumber as string,
    tradingName: row.tradingName as string | undefined,
    legalName: row.legalName as string | undefined,
    registrationType: row.registrationType as VatRegistrationType,
    isVerified: Boolean(row.isVerified),
    verifiedAt: row.verifiedAt ? new Date(row.verifiedAt as string) : undefined,
    verificationSource: row.verificationSource as string | undefined,
    verificationRequestId: row.verificationRequestId as string | undefined,
    verificationResponse: row.verificationResponse as Record<string, unknown> | undefined,
    registrationDate: row.registrationDate ? new Date(row.registrationDate as string) : undefined,
    deregistrationDate: row.deregistrationDate ? new Date(row.deregistrationDate as string) : undefined,
    effectiveFrom: row.effectiveFrom ? new Date(row.effectiveFrom as string) : undefined,
    effectiveUntil: row.effectiveUntil ? new Date(row.effectiveUntil as string) : undefined,
    annualThreshold: row.annualThreshold ? parseFloat(row.annualThreshold as string) : undefined,
    thresholdCurrency: row.thresholdCurrency as string | undefined,
    currentYearSales: row.currentYearSales ? parseFloat(row.currentYearSales as string) : undefined,
    thresholdExceeded: Boolean(row.thresholdExceeded),
    isActive: Boolean(row.isActive),
    notes: row.notes as string | undefined,
    certificateUrl: row.certificateUrl as string | undefined,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  };
}

function mapToVatValidationLog(row: Record<string, unknown>): VatValidationLog {
  return {
    vatValidationLogId: row.vatValidationLogId as string,
    customerId: row.customerId as string | undefined,
    organizationId: row.organizationId as string | undefined,
    orderId: row.orderId as string | undefined,
    vatNumber: row.vatNumber as string,
    countryCode: row.countryCode as string,
    vatNumberFormatted: row.vatNumberFormatted as string | undefined,
    isValid: row.isValid as boolean | undefined,
    validationStatus: row.validationStatus as VatValidationLog['validationStatus'],
    validationSource: row.validationSource as VatValidationLog['validationSource'],
    requestId: row.requestId as string | undefined,
    response: row.response as Record<string, unknown> | undefined,
    companyName: row.companyName as string | undefined,
    companyAddress: row.companyAddress as string | undefined,
    companyCity: row.companyCity as string | undefined,
    companyPostalCode: row.companyPostalCode as string | undefined,
    validatedAt: new Date(row.validatedAt as string),
    responseTimeMs: row.responseTimeMs as number | undefined,
    expiresAt: row.expiresAt ? new Date(row.expiresAt as string) : undefined,
    reverseChargeApplicable: Boolean(row.reverseChargeApplicable),
    ipAddress: row.ipAddress as string | undefined,
    context: row.context as string | undefined,
    createdAt: new Date(row.createdAt as string),
  };
}
