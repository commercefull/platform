/**
 * Distribution Fulfillment Repository
 * Manages fulfillment partners, distribution rules, and order fulfillments
 */
import { query, queryOne } from '../../../libs/db';

// =============================================================================
// Types
// =============================================================================

export type FulfillmentStatus = 
  | 'pending' | 'processing' | 'picking' | 'packing' | 'ready_to_ship' 
  | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered' 
  | 'failed' | 'returned' | 'cancelled';

export interface DistributionFulfillmentPartner {
  distributionFulfillmentPartnerId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  apiKey: string | null;
  apiSecret: string | null;
  apiEndpoint: string | null;
  apiCredentials: Record<string, unknown> | null;
  supportedCarriers: string[] | null;
  supportedRegions: string[] | null;
  supportedServices: string[] | null;
  supportsReturns: boolean;
  supportsInternational: boolean;
  supportsTracking: boolean;
  averageProcessingTimeHours: number | null;
  fulfillmentRate: number | null;
  onTimeDeliveryRate: number | null;
  baseFee: string | null;
  perOrderFee: string | null;
  perItemFee: string | null;
  currency: string;
  settings: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdBy: string | null;
}

export interface DistributionRule {
  distributionRuleId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  name: string;
  description: string | null;
  priority: number;
  isActive: boolean;
  isDefault: boolean;
  distributionWarehouseId: string | null;
  distributionShippingZoneId: string | null;
  distributionShippingMethodId: string | null;
  distributionShippingCarrierId: string | null;
  distributionFulfillmentPartnerId: string | null;
  applicableCountries: string[] | null;
  applicableRegions: string[] | null;
  applicablePostalCodes: string[] | null;
  applicableProductCategories: string[] | null;
  applicableProductTags: string[] | null;
  excludedProductIds: string[] | null;
  minOrderValue: string | null;
  maxOrderValue: string | null;
  minOrderItems: number | null;
  maxOrderItems: number | null;
  minOrderWeight: string | null;
  maxOrderWeight: string | null;
  applicableCustomerGroups: string[] | null;
  applicableMembershipTiers: string[] | null;
  validFrom: Date | null;
  validTo: Date | null;
  applicableDaysOfWeek: number[] | null;
  settings: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdBy: string | null;
}

export interface DistributionOrderFulfillment {
  distributionOrderFulfillmentId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  orderId: string;
  orderNumber: string | null;
  status: FulfillmentStatus;
  statusReason: string | null;
  distributionWarehouseId: string | null;
  distributionRuleId: string | null;
  distributionShippingMethodId: string | null;
  distributionShippingCarrierId: string | null;
  distributionFulfillmentPartnerId: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  carrierCode: string | null;
  serviceCode: string | null;
  shipToName: string | null;
  shipToCompany: string | null;
  shipToAddressLine1: string | null;
  shipToAddressLine2: string | null;
  shipToCity: string | null;
  shipToState: string | null;
  shipToPostalCode: string | null;
  shipToCountry: string | null;
  shipToPhone: string | null;
  shipToEmail: string | null;
  packageWeight: string | null;
  packageWeightUnit: string | null;
  packageLength: string | null;
  packageWidth: string | null;
  packageHeight: string | null;
  packageDimensionUnit: string | null;
  packageCount: number;
  shippingCost: string | null;
  insuranceCost: string | null;
  handlingCost: string | null;
  totalCost: string | null;
  currency: string;
  pickedAt: Date | null;
  packedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  estimatedDeliveryAt: Date | null;
  actualDeliveryAt: Date | null;
  internalNotes: string | null;
  customerNotes: string | null;
  shippingLabel: Record<string, unknown> | null;
  trackingEvents: Record<string, unknown>[] | null;
  metadata: Record<string, unknown> | null;
  pickedBy: string | null;
  packedBy: string | null;
  shippedBy: string | null;
  createdBy: string | null;
}

// Table names
const FULFILLMENT_PARTNER_TABLE = 'distributionFulfillmentPartner';
const DISTRIBUTION_RULE_TABLE = 'distributionRule';
const ORDER_FULFILLMENT_TABLE = 'distributionOrderFulfillment';

// =============================================================================
// Fulfillment Partners
// =============================================================================

export async function findAllFulfillmentPartners(): Promise<DistributionFulfillmentPartner[]> {
  const rows = await query<DistributionFulfillmentPartner[]>(
    `SELECT * FROM "${FULFILLMENT_PARTNER_TABLE}" WHERE "deletedAt" IS NULL ORDER BY "name"`
  );
  return rows || [];
}

export async function findActiveFulfillmentPartners(): Promise<DistributionFulfillmentPartner[]> {
  const rows = await query<DistributionFulfillmentPartner[]>(
    `SELECT * FROM "${FULFILLMENT_PARTNER_TABLE}" WHERE "isActive" = true AND "deletedAt" IS NULL ORDER BY "name"`
  );
  return rows || [];
}

export async function findFulfillmentPartnerById(id: string): Promise<DistributionFulfillmentPartner | null> {
  return queryOne<DistributionFulfillmentPartner>(
    `SELECT * FROM "${FULFILLMENT_PARTNER_TABLE}" WHERE "distributionFulfillmentPartnerId" = $1 AND "deletedAt" IS NULL`,
    [id]
  );
}

export async function findFulfillmentPartnerByCode(code: string): Promise<DistributionFulfillmentPartner | null> {
  return queryOne<DistributionFulfillmentPartner>(
    `SELECT * FROM "${FULFILLMENT_PARTNER_TABLE}" WHERE "code" = $1 AND "deletedAt" IS NULL`,
    [code]
  );
}

export async function createFulfillmentPartner(
  data: Partial<DistributionFulfillmentPartner>
): Promise<DistributionFulfillmentPartner> {
  const now = new Date().toISOString();
  const result = await queryOne<DistributionFulfillmentPartner>(
    `INSERT INTO "${FULFILLMENT_PARTNER_TABLE}" (
      "name", "code", "description", "isActive",
      "contactName", "contactEmail", "contactPhone",
      "apiKey", "apiSecret", "apiEndpoint", "apiCredentials",
      "supportedCarriers", "supportedRegions", "supportedServices",
      "supportsReturns", "supportsInternational", "supportsTracking",
      "averageProcessingTimeHours", "fulfillmentRate", "onTimeDeliveryRate",
      "baseFee", "perOrderFee", "perItemFee", "currency",
      "settings", "metadata", "createdBy", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
    RETURNING *`,
    [
      data.name, data.code, data.description || null, data.isActive !== false,
      data.contactName || null, data.contactEmail || null, data.contactPhone || null,
      data.apiKey || null, data.apiSecret || null, data.apiEndpoint || null,
      data.apiCredentials ? JSON.stringify(data.apiCredentials) : null,
      data.supportedCarriers || null, data.supportedRegions || null, data.supportedServices || null,
      data.supportsReturns || false, data.supportsInternational || false, data.supportsTracking !== false,
      data.averageProcessingTimeHours || null, data.fulfillmentRate || null, data.onTimeDeliveryRate || null,
      data.baseFee || null, data.perOrderFee || null, data.perItemFee || null, data.currency || 'USD',
      data.settings ? JSON.stringify(data.settings) : null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.createdBy || null, now, now
    ]
  );
  return result!;
}

export async function updateFulfillmentPartner(
  id: string,
  data: Partial<DistributionFulfillmentPartner>
): Promise<DistributionFulfillmentPartner | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const fields: (keyof DistributionFulfillmentPartner)[] = [
    'name', 'code', 'description', 'isActive',
    'contactName', 'contactEmail', 'contactPhone',
    'apiKey', 'apiSecret', 'apiEndpoint',
    'supportsReturns', 'supportsInternational', 'supportsTracking',
    'averageProcessingTimeHours', 'fulfillmentRate', 'onTimeDeliveryRate',
    'baseFee', 'perOrderFee', 'perItemFee', 'currency'
  ];

  for (const field of fields) {
    if (data[field] !== undefined) {
      updates.push(`"${field}" = $${paramIndex++}`);
      values.push(data[field]);
    }
  }

  // Handle JSON fields
  if (data.apiCredentials !== undefined) {
    updates.push(`"apiCredentials" = $${paramIndex++}`);
    values.push(data.apiCredentials ? JSON.stringify(data.apiCredentials) : null);
  }
  if (data.supportedCarriers !== undefined) {
    updates.push(`"supportedCarriers" = $${paramIndex++}`);
    values.push(data.supportedCarriers);
  }
  if (data.supportedRegions !== undefined) {
    updates.push(`"supportedRegions" = $${paramIndex++}`);
    values.push(data.supportedRegions);
  }
  if (data.supportedServices !== undefined) {
    updates.push(`"supportedServices" = $${paramIndex++}`);
    values.push(data.supportedServices);
  }
  if (data.settings !== undefined) {
    updates.push(`"settings" = $${paramIndex++}`);
    values.push(data.settings ? JSON.stringify(data.settings) : null);
  }
  if (data.metadata !== undefined) {
    updates.push(`"metadata" = $${paramIndex++}`);
    values.push(data.metadata ? JSON.stringify(data.metadata) : null);
  }

  if (updates.length === 0) return findFulfillmentPartnerById(id);

  updates.push(`"updatedAt" = $${paramIndex++}`);
  values.push(new Date().toISOString());
  values.push(id);

  return queryOne<DistributionFulfillmentPartner>(
    `UPDATE "${FULFILLMENT_PARTNER_TABLE}" SET ${updates.join(', ')} 
     WHERE "distributionFulfillmentPartnerId" = $${paramIndex} AND "deletedAt" IS NULL
     RETURNING *`,
    values
  );
}

export async function deleteFulfillmentPartner(id: string): Promise<boolean> {
  const result = await query(
    `UPDATE "${FULFILLMENT_PARTNER_TABLE}" SET "deletedAt" = $1, "updatedAt" = $1 
     WHERE "distributionFulfillmentPartnerId" = $2 AND "deletedAt" IS NULL`,
    [new Date().toISOString(), id]
  );
  return (result as any)?.rowCount > 0;
}

// =============================================================================
// Distribution Rules
// =============================================================================

export async function findAllDistributionRules(): Promise<DistributionRule[]> {
  const rows = await query<DistributionRule[]>(
    `SELECT * FROM "${DISTRIBUTION_RULE_TABLE}" WHERE "deletedAt" IS NULL ORDER BY "priority", "name"`
  );
  return rows || [];
}

export async function findActiveDistributionRules(): Promise<DistributionRule[]> {
  const rows = await query<DistributionRule[]>(
    `SELECT * FROM "${DISTRIBUTION_RULE_TABLE}" WHERE "isActive" = true AND "deletedAt" IS NULL ORDER BY "priority", "name"`
  );
  return rows || [];
}

export async function findDistributionRuleById(id: string): Promise<DistributionRule | null> {
  return queryOne<DistributionRule>(
    `SELECT * FROM "${DISTRIBUTION_RULE_TABLE}" WHERE "distributionRuleId" = $1 AND "deletedAt" IS NULL`,
    [id]
  );
}

export async function findDistributionRulesByZone(zoneId: string): Promise<DistributionRule[]> {
  const rows = await query<DistributionRule[]>(
    `SELECT * FROM "${DISTRIBUTION_RULE_TABLE}" 
     WHERE "distributionShippingZoneId" = $1 AND "deletedAt" IS NULL 
     ORDER BY "priority"`,
    [zoneId]
  );
  return rows || [];
}

export async function findDefaultDistributionRule(): Promise<DistributionRule | null> {
  return queryOne<DistributionRule>(
    `SELECT * FROM "${DISTRIBUTION_RULE_TABLE}" 
     WHERE "isDefault" = true AND "isActive" = true AND "deletedAt" IS NULL 
     ORDER BY "priority" LIMIT 1`
  );
}

export async function createDistributionRule(
  data: Partial<DistributionRule>
): Promise<DistributionRule> {
  const now = new Date().toISOString();
  const result = await queryOne<DistributionRule>(
    `INSERT INTO "${DISTRIBUTION_RULE_TABLE}" (
      "name", "description", "priority", "isActive", "isDefault",
      "distributionWarehouseId", "distributionShippingZoneId", 
      "distributionShippingMethodId", "distributionShippingCarrierId",
      "distributionFulfillmentPartnerId",
      "applicableCountries", "applicableRegions", "applicablePostalCodes",
      "applicableProductCategories", "applicableProductTags", "excludedProductIds",
      "minOrderValue", "maxOrderValue", "minOrderItems", "maxOrderItems",
      "minOrderWeight", "maxOrderWeight",
      "applicableCustomerGroups", "applicableMembershipTiers",
      "validFrom", "validTo", "applicableDaysOfWeek",
      "settings", "metadata", "createdBy", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
    RETURNING *`,
    [
      data.name, data.description || null, data.priority || 0, data.isActive !== false, data.isDefault || false,
      data.distributionWarehouseId || null, data.distributionShippingZoneId || null,
      data.distributionShippingMethodId || null, data.distributionShippingCarrierId || null,
      data.distributionFulfillmentPartnerId || null,
      data.applicableCountries || null, data.applicableRegions || null, data.applicablePostalCodes || null,
      data.applicableProductCategories || null, data.applicableProductTags || null, data.excludedProductIds || null,
      data.minOrderValue || null, data.maxOrderValue || null, data.minOrderItems || null, data.maxOrderItems || null,
      data.minOrderWeight || null, data.maxOrderWeight || null,
      data.applicableCustomerGroups || null, data.applicableMembershipTiers || null,
      data.validFrom?.toISOString() || null, data.validTo?.toISOString() || null, data.applicableDaysOfWeek || null,
      data.settings ? JSON.stringify(data.settings) : null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.createdBy || null, now, now
    ]
  );
  return result!;
}

export async function updateDistributionRule(
  id: string,
  data: Partial<DistributionRule>
): Promise<DistributionRule | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const fields: (keyof DistributionRule)[] = [
    'name', 'description', 'priority', 'isActive', 'isDefault',
    'distributionWarehouseId', 'distributionShippingZoneId',
    'distributionShippingMethodId', 'distributionShippingCarrierId',
    'distributionFulfillmentPartnerId',
    'minOrderValue', 'maxOrderValue', 'minOrderItems', 'maxOrderItems',
    'minOrderWeight', 'maxOrderWeight'
  ];

  for (const field of fields) {
    if (data[field] !== undefined) {
      updates.push(`"${field}" = $${paramIndex++}`);
      values.push(data[field]);
    }
  }

  // Handle array fields
  const arrayFields: (keyof DistributionRule)[] = [
    'applicableCountries', 'applicableRegions', 'applicablePostalCodes',
    'applicableProductCategories', 'applicableProductTags', 'excludedProductIds',
    'applicableCustomerGroups', 'applicableMembershipTiers', 'applicableDaysOfWeek'
  ];
  for (const field of arrayFields) {
    if (data[field] !== undefined) {
      updates.push(`"${field}" = $${paramIndex++}`);
      values.push(data[field]);
    }
  }

  // Handle date fields
  if (data.validFrom !== undefined) {
    updates.push(`"validFrom" = $${paramIndex++}`);
    values.push(data.validFrom?.toISOString() || null);
  }
  if (data.validTo !== undefined) {
    updates.push(`"validTo" = $${paramIndex++}`);
    values.push(data.validTo?.toISOString() || null);
  }

  // Handle JSON fields
  if (data.settings !== undefined) {
    updates.push(`"settings" = $${paramIndex++}`);
    values.push(data.settings ? JSON.stringify(data.settings) : null);
  }
  if (data.metadata !== undefined) {
    updates.push(`"metadata" = $${paramIndex++}`);
    values.push(data.metadata ? JSON.stringify(data.metadata) : null);
  }

  if (updates.length === 0) return findDistributionRuleById(id);

  updates.push(`"updatedAt" = $${paramIndex++}`);
  values.push(new Date().toISOString());
  values.push(id);

  return queryOne<DistributionRule>(
    `UPDATE "${DISTRIBUTION_RULE_TABLE}" SET ${updates.join(', ')} 
     WHERE "distributionRuleId" = $${paramIndex} AND "deletedAt" IS NULL
     RETURNING *`,
    values
  );
}

export async function deleteDistributionRule(id: string): Promise<boolean> {
  const result = await query(
    `UPDATE "${DISTRIBUTION_RULE_TABLE}" SET "deletedAt" = $1, "updatedAt" = $1 
     WHERE "distributionRuleId" = $2 AND "deletedAt" IS NULL`,
    [new Date().toISOString(), id]
  );
  return (result as any)?.rowCount > 0;
}

// =============================================================================
// Order Fulfillments
// =============================================================================

export async function findAllOrderFulfillments(
  pagination?: { limit?: number; offset?: number }
): Promise<{ data: DistributionOrderFulfillment[]; total: number }> {
  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "${ORDER_FULFILLMENT_TABLE}" WHERE "deletedAt" IS NULL`
  );
  const total = parseInt(countResult?.count || '0');

  let sql = `SELECT * FROM "${ORDER_FULFILLMENT_TABLE}" WHERE "deletedAt" IS NULL ORDER BY "createdAt" DESC`;
  const params: any[] = [];
  let paramIndex = 1;

  if (pagination?.limit) {
    sql += ` LIMIT $${paramIndex++}`;
    params.push(pagination.limit);
    if (pagination.offset) {
      sql += ` OFFSET $${paramIndex++}`;
      params.push(pagination.offset);
    }
  }

  const rows = await query<DistributionOrderFulfillment[]>(sql, params);
  return { data: rows || [], total };
}

export async function findOrderFulfillmentById(id: string): Promise<DistributionOrderFulfillment | null> {
  return queryOne<DistributionOrderFulfillment>(
    `SELECT * FROM "${ORDER_FULFILLMENT_TABLE}" WHERE "distributionOrderFulfillmentId" = $1 AND "deletedAt" IS NULL`,
    [id]
  );
}

export async function findOrderFulfillmentsByOrderId(orderId: string): Promise<DistributionOrderFulfillment[]> {
  const rows = await query<DistributionOrderFulfillment[]>(
    `SELECT * FROM "${ORDER_FULFILLMENT_TABLE}" WHERE "orderId" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" DESC`,
    [orderId]
  );
  return rows || [];
}

export async function findOrderFulfillmentsByStatus(status: FulfillmentStatus): Promise<DistributionOrderFulfillment[]> {
  const rows = await query<DistributionOrderFulfillment[]>(
    `SELECT * FROM "${ORDER_FULFILLMENT_TABLE}" WHERE "status" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" DESC`,
    [status]
  );
  return rows || [];
}

export async function findOrderFulfillmentsByWarehouse(warehouseId: string): Promise<DistributionOrderFulfillment[]> {
  const rows = await query<DistributionOrderFulfillment[]>(
    `SELECT * FROM "${ORDER_FULFILLMENT_TABLE}" WHERE "distributionWarehouseId" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" DESC`,
    [warehouseId]
  );
  return rows || [];
}

export async function createOrderFulfillment(
  data: Partial<DistributionOrderFulfillment>
): Promise<DistributionOrderFulfillment> {
  const now = new Date().toISOString();
  const result = await queryOne<DistributionOrderFulfillment>(
    `INSERT INTO "${ORDER_FULFILLMENT_TABLE}" (
      "orderId", "orderNumber", "status", "statusReason",
      "distributionWarehouseId", "distributionRuleId",
      "distributionShippingMethodId", "distributionShippingCarrierId",
      "distributionFulfillmentPartnerId",
      "trackingNumber", "trackingUrl", "carrierCode", "serviceCode",
      "shipToName", "shipToCompany", "shipToAddressLine1", "shipToAddressLine2",
      "shipToCity", "shipToState", "shipToPostalCode", "shipToCountry",
      "shipToPhone", "shipToEmail",
      "packageWeight", "packageWeightUnit", "packageLength", "packageWidth", "packageHeight",
      "packageDimensionUnit", "packageCount",
      "shippingCost", "insuranceCost", "handlingCost", "totalCost", "currency",
      "estimatedDeliveryAt", "internalNotes", "customerNotes",
      "metadata", "createdBy", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42)
    RETURNING *`,
    [
      data.orderId, data.orderNumber || null, data.status || 'pending', data.statusReason || null,
      data.distributionWarehouseId || null, data.distributionRuleId || null,
      data.distributionShippingMethodId || null, data.distributionShippingCarrierId || null,
      data.distributionFulfillmentPartnerId || null,
      data.trackingNumber || null, data.trackingUrl || null, data.carrierCode || null, data.serviceCode || null,
      data.shipToName || null, data.shipToCompany || null, data.shipToAddressLine1 || null, data.shipToAddressLine2 || null,
      data.shipToCity || null, data.shipToState || null, data.shipToPostalCode || null, data.shipToCountry || null,
      data.shipToPhone || null, data.shipToEmail || null,
      data.packageWeight || null, data.packageWeightUnit || 'kg',
      data.packageLength || null, data.packageWidth || null, data.packageHeight || null,
      data.packageDimensionUnit || 'cm', data.packageCount || 1,
      data.shippingCost || null, data.insuranceCost || null, data.handlingCost || null, data.totalCost || null,
      data.currency || 'USD',
      data.estimatedDeliveryAt?.toISOString() || null, data.internalNotes || null, data.customerNotes || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.createdBy || null, now, now
    ]
  );
  return result!;
}

export async function updateOrderFulfillment(
  id: string,
  data: Partial<DistributionOrderFulfillment>
): Promise<DistributionOrderFulfillment | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const fields: (keyof DistributionOrderFulfillment)[] = [
    'orderNumber', 'status', 'statusReason',
    'distributionWarehouseId', 'distributionRuleId',
    'distributionShippingMethodId', 'distributionShippingCarrierId',
    'distributionFulfillmentPartnerId',
    'trackingNumber', 'trackingUrl', 'carrierCode', 'serviceCode',
    'shipToName', 'shipToCompany', 'shipToAddressLine1', 'shipToAddressLine2',
    'shipToCity', 'shipToState', 'shipToPostalCode', 'shipToCountry',
    'shipToPhone', 'shipToEmail',
    'packageWeight', 'packageWeightUnit', 'packageLength', 'packageWidth', 'packageHeight',
    'packageDimensionUnit', 'packageCount',
    'shippingCost', 'insuranceCost', 'handlingCost', 'totalCost', 'currency',
    'internalNotes', 'customerNotes',
    'pickedBy', 'packedBy', 'shippedBy'
  ];

  for (const field of fields) {
    if (data[field] !== undefined) {
      updates.push(`"${field}" = $${paramIndex++}`);
      values.push(data[field]);
    }
  }

  // Handle date fields
  const dateFields: (keyof DistributionOrderFulfillment)[] = [
    'pickedAt', 'packedAt', 'shippedAt', 'deliveredAt', 'estimatedDeliveryAt', 'actualDeliveryAt'
  ];
  for (const field of dateFields) {
    if (data[field] !== undefined) {
      updates.push(`"${field}" = $${paramIndex++}`);
      values.push((data[field] as Date)?.toISOString() || null);
    }
  }

  // Handle JSON fields
  if (data.shippingLabel !== undefined) {
    updates.push(`"shippingLabel" = $${paramIndex++}`);
    values.push(data.shippingLabel ? JSON.stringify(data.shippingLabel) : null);
  }
  if (data.trackingEvents !== undefined) {
    updates.push(`"trackingEvents" = $${paramIndex++}`);
    values.push(data.trackingEvents ? JSON.stringify(data.trackingEvents) : null);
  }
  if (data.metadata !== undefined) {
    updates.push(`"metadata" = $${paramIndex++}`);
    values.push(data.metadata ? JSON.stringify(data.metadata) : null);
  }

  if (updates.length === 0) return findOrderFulfillmentById(id);

  updates.push(`"updatedAt" = $${paramIndex++}`);
  values.push(new Date().toISOString());
  values.push(id);

  return queryOne<DistributionOrderFulfillment>(
    `UPDATE "${ORDER_FULFILLMENT_TABLE}" SET ${updates.join(', ')} 
     WHERE "distributionOrderFulfillmentId" = $${paramIndex} AND "deletedAt" IS NULL
     RETURNING *`,
    values
  );
}

export async function updateOrderFulfillmentStatus(
  id: string,
  status: FulfillmentStatus,
  statusReason?: string
): Promise<DistributionOrderFulfillment | null> {
  const now = new Date().toISOString();
  const updates: Record<string, any> = { status, statusReason: statusReason || null };

  // Auto-set timestamps based on status
  switch (status) {
    case 'picking':
      updates.pickedAt = now;
      break;
    case 'packing':
      updates.packedAt = now;
      break;
    case 'shipped':
      updates.shippedAt = now;
      break;
    case 'delivered':
      updates.deliveredAt = now;
      updates.actualDeliveryAt = now;
      break;
  }

  return updateOrderFulfillment(id, updates);
}

export async function deleteOrderFulfillment(id: string): Promise<boolean> {
  const result = await query(
    `UPDATE "${ORDER_FULFILLMENT_TABLE}" SET "deletedAt" = $1, "updatedAt" = $1 
     WHERE "distributionOrderFulfillmentId" = $2 AND "deletedAt" IS NULL`,
    [new Date().toISOString(), id]
  );
  return (result as any)?.rowCount > 0;
}

// Export default object for convenience
export default {
  // Fulfillment Partners
  findAllFulfillmentPartners,
  findActiveFulfillmentPartners,
  findFulfillmentPartnerById,
  findFulfillmentPartnerByCode,
  createFulfillmentPartner,
  updateFulfillmentPartner,
  deleteFulfillmentPartner,
  // Distribution Rules
  findAllDistributionRules,
  findActiveDistributionRules,
  findDistributionRuleById,
  findDistributionRulesByZone,
  findDefaultDistributionRule,
  createDistributionRule,
  updateDistributionRule,
  deleteDistributionRule,
  // Order Fulfillments
  findAllOrderFulfillments,
  findOrderFulfillmentById,
  findOrderFulfillmentsByOrderId,
  findOrderFulfillmentsByStatus,
  findOrderFulfillmentsByWarehouse,
  createOrderFulfillment,
  updateOrderFulfillment,
  updateOrderFulfillmentStatus,
  deleteOrderFulfillment
};
