/**
 * VAT Registration Repository
 * Handles CRUD operations for merchant VAT registrations
 */

import { query, queryOne } from '../../../libs/db';

// ============================================================================
// Types
// ============================================================================

export type VatRegistrationType = 'standard' | 'oss' | 'ioss' | 'moss' | 'non_union' | 'distance_selling';

export interface VatRegistration {
  vatRegistrationId: string;
  merchantId: string;
  countryCode: string;
  vatNumber: string;
  tradingName?: string;
  legalName?: string;
  registrationType: VatRegistrationType;
  isVerified: boolean;
  verifiedAt?: Date;
  verificationSource?: string;
  verificationRequestId?: string;
  verificationResponse?: Record<string, any>;
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
  merchantId?: string;
  orderId?: string;
  vatNumber: string;
  countryCode: string;
  vatNumberFormatted?: string;
  isValid?: boolean;
  validationStatus: 'valid' | 'invalid' | 'unavailable' | 'timeout' | 'error' | 'format_invalid';
  validationSource: 'vies' | 'hmrc' | 'manual' | 'cache' | 'format';
  requestId?: string;
  response?: Record<string, any>;
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
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "vatRegistration" WHERE "vatRegistrationId" = $1',
    [vatRegistrationId]
  );
  return row ? mapToVatRegistration(row) : null;
}

export async function getVatRegistrationsByMerchant(merchantId: string): Promise<VatRegistration[]> {
  const rows = await query<Record<string, any>[]>(
    'SELECT * FROM "vatRegistration" WHERE "merchantId" = $1 ORDER BY "countryCode" ASC',
    [merchantId]
  );
  return (rows || []).map(mapToVatRegistration);
}

export async function getVatRegistrationByCountry(
  merchantId: string, 
  countryCode: string
): Promise<VatRegistration | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "vatRegistration" WHERE "merchantId" = $1 AND "countryCode" = $2 AND "isActive" = true',
    [merchantId, countryCode]
  );
  return row ? mapToVatRegistration(row) : null;
}

export async function getActiveOssRegistration(merchantId: string): Promise<VatRegistration | null> {
  const row = await queryOne<Record<string, any>>(
    `SELECT * FROM "vatRegistration" 
     WHERE "merchantId" = $1 AND "registrationType" = 'oss' AND "isActive" = true`,
    [merchantId]
  );
  return row ? mapToVatRegistration(row) : null;
}

export async function saveVatRegistration(data: Partial<VatRegistration> & { 
  merchantId: string; 
  countryCode: string; 
  vatNumber: string;
}): Promise<VatRegistration> {
  const now = new Date().toISOString();
  
  if (data.vatRegistrationId) {
    // Update existing
    await query(
      `UPDATE "vatRegistration" SET
        "vatNumber" = $1, "tradingName" = $2, "legalName" = $3, "registrationType" = $4,
        "isVerified" = $5, "verifiedAt" = $6, "verificationSource" = $7,
        "registrationDate" = $8, "deregistrationDate" = $9, "effectiveFrom" = $10, "effectiveUntil" = $11,
        "annualThreshold" = $12, "thresholdCurrency" = $13, "currentYearSales" = $14, "thresholdExceeded" = $15,
        "isActive" = $16, "notes" = $17, "certificateUrl" = $18, "updatedAt" = $19
      WHERE "vatRegistrationId" = $20`,
      [
        data.vatNumber, data.tradingName, data.legalName, data.registrationType || 'standard',
        data.isVerified || false, data.verifiedAt?.toISOString(), data.verificationSource,
        data.registrationDate?.toISOString(), data.deregistrationDate?.toISOString(),
        data.effectiveFrom?.toISOString(), data.effectiveUntil?.toISOString(),
        data.annualThreshold, data.thresholdCurrency || 'EUR', data.currentYearSales, data.thresholdExceeded || false,
        data.isActive !== false, data.notes, data.certificateUrl, now, data.vatRegistrationId
      ]
    );
    return (await getVatRegistration(data.vatRegistrationId))!;
  } else {
    // Insert new
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "vatRegistration" (
        "merchantId", "countryCode", "vatNumber", "tradingName", "legalName", "registrationType",
        "isVerified", "registrationDate", "effectiveFrom",
        "annualThreshold", "thresholdCurrency", "currentYearSales", "thresholdExceeded",
        "isActive", "notes", "certificateUrl", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        data.merchantId, data.countryCode, data.vatNumber, data.tradingName, data.legalName,
        data.registrationType || 'standard', false,
        data.registrationDate?.toISOString(), data.effectiveFrom?.toISOString(),
        data.annualThreshold, data.thresholdCurrency || 'EUR', data.currentYearSales || 0, false,
        true, data.notes, data.certificateUrl, now, now
      ]
    );
    return mapToVatRegistration(result!);
  }
}

export async function deleteVatRegistration(vatRegistrationId: string): Promise<void> {
  await query('DELETE FROM "vatRegistration" WHERE "vatRegistrationId" = $1', [vatRegistrationId]);
}

export async function deactivateVatRegistration(vatRegistrationId: string): Promise<void> {
  await query(
    `UPDATE "vatRegistration" SET "isActive" = false, "deregistrationDate" = $1, "updatedAt" = $1
     WHERE "vatRegistrationId" = $2`,
    [new Date().toISOString(), vatRegistrationId]
  );
}

// ============================================================================
// VAT Validation
// ============================================================================

export async function logVatValidation(data: Omit<VatValidationLog, 'vatValidationLogId' | 'createdAt'>): Promise<VatValidationLog> {
  const now = new Date().toISOString();
  
  const result = await queryOne<Record<string, any>>(
    `INSERT INTO "vatValidationLog" (
      "customerId", "merchantId", "orderId", "vatNumber", "countryCode", "vatNumberFormatted",
      "isValid", "validationStatus", "validationSource", "requestId", "response",
      "companyName", "companyAddress", "companyCity", "companyPostalCode",
      "validatedAt", "responseTimeMs", "expiresAt", "reverseChargeApplicable",
      "ipAddress", "context", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
    RETURNING *`,
    [
      data.customerId, data.merchantId, data.orderId, data.vatNumber, data.countryCode,
      data.vatNumberFormatted, data.isValid, data.validationStatus, data.validationSource,
      data.requestId, data.response ? JSON.stringify(data.response) : null,
      data.companyName, data.companyAddress, data.companyCity, data.companyPostalCode,
      data.validatedAt.toISOString(), data.responseTimeMs, data.expiresAt?.toISOString(),
      data.reverseChargeApplicable || false, data.ipAddress, data.context, now
    ]
  );
  
  return mapToVatValidationLog(result!);
}

export async function getRecentValidation(
  vatNumber: string, 
  countryCode: string, 
  maxAgeHours: number = 24
): Promise<VatValidationLog | null> {
  const row = await queryOne<Record<string, any>>(
    `SELECT * FROM "vatValidationLog" 
     WHERE "vatNumber" = $1 AND "countryCode" = $2 
     AND "validatedAt" > NOW() - INTERVAL '${maxAgeHours} hours'
     AND "isValid" IS NOT NULL
     ORDER BY "validatedAt" DESC LIMIT 1`,
    [vatNumber, countryCode]
  );
  return row ? mapToVatValidationLog(row) : null;
}

export async function getValidationHistory(
  vatNumber: string, 
  limit: number = 10
): Promise<VatValidationLog[]> {
  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "vatValidationLog" 
     WHERE "vatNumber" = $1
     ORDER BY "validatedAt" DESC LIMIT $2`,
    [vatNumber, limit]
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

function mapToVatRegistration(row: Record<string, any>): VatRegistration {
  return {
    vatRegistrationId: row.vatRegistrationId,
    merchantId: row.merchantId,
    countryCode: row.countryCode,
    vatNumber: row.vatNumber,
    tradingName: row.tradingName,
    legalName: row.legalName,
    registrationType: row.registrationType,
    isVerified: Boolean(row.isVerified),
    verifiedAt: row.verifiedAt ? new Date(row.verifiedAt) : undefined,
    verificationSource: row.verificationSource,
    verificationRequestId: row.verificationRequestId,
    verificationResponse: row.verificationResponse,
    registrationDate: row.registrationDate ? new Date(row.registrationDate) : undefined,
    deregistrationDate: row.deregistrationDate ? new Date(row.deregistrationDate) : undefined,
    effectiveFrom: row.effectiveFrom ? new Date(row.effectiveFrom) : undefined,
    effectiveUntil: row.effectiveUntil ? new Date(row.effectiveUntil) : undefined,
    annualThreshold: row.annualThreshold ? parseFloat(row.annualThreshold) : undefined,
    thresholdCurrency: row.thresholdCurrency,
    currentYearSales: row.currentYearSales ? parseFloat(row.currentYearSales) : undefined,
    thresholdExceeded: Boolean(row.thresholdExceeded),
    isActive: Boolean(row.isActive),
    notes: row.notes,
    certificateUrl: row.certificateUrl,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function mapToVatValidationLog(row: Record<string, any>): VatValidationLog {
  return {
    vatValidationLogId: row.vatValidationLogId,
    customerId: row.customerId,
    merchantId: row.merchantId,
    orderId: row.orderId,
    vatNumber: row.vatNumber,
    countryCode: row.countryCode,
    vatNumberFormatted: row.vatNumberFormatted,
    isValid: row.isValid,
    validationStatus: row.validationStatus,
    validationSource: row.validationSource,
    requestId: row.requestId,
    response: row.response,
    companyName: row.companyName,
    companyAddress: row.companyAddress,
    companyCity: row.companyCity,
    companyPostalCode: row.companyPostalCode,
    validatedAt: new Date(row.validatedAt),
    responseTimeMs: row.responseTimeMs,
    expiresAt: row.expiresAt ? new Date(row.expiresAt) : undefined,
    reverseChargeApplicable: Boolean(row.reverseChargeApplicable),
    ipAddress: row.ipAddress,
    context: row.context,
    createdAt: new Date(row.createdAt)
  };
}
