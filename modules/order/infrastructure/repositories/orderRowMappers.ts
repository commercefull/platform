/**
 * Order row → domain mappers and shared scalar helpers.
 */

import { OrderItem } from '../../domain/entities/OrderItem';
import { OrderAddress } from '../../domain/entities/OrderAddress';
import { Money } from '../../domain/valueObjects/Money';
import { FulfillmentStatus } from '../../domain/valueObjects/FulfillmentStatus';
import type { OrderFilters } from '../../domain/repositories/OrderRepository';
import type { OrderItem as DbOrderItem, OrderAddress as DbOrderAddress } from '../../../../libs/db/types';

// JSONB columns arrive pre-parsed or as JSON strings depending on driver
// config — normalise both to objects; falsy values map to undefined.
export function fromJson<T>(value: unknown): T | undefined {
  if (!value) return undefined;
  return (typeof value === 'string' ? JSON.parse(value) : value) as T;
}

export function toDate(value: string | Date | null | undefined): Date | undefined {
  return value ? new Date(value) : undefined;
}

function centsToMoney(value: unknown, currency: string): Money | undefined {
  return value != null ? Money.fromCents(Number(value), currency) : undefined;
}

export function mapToOrderItem(row: DbOrderItem, currency: string): OrderItem {
  return OrderItem.reconstitute({
    orderItemId: row.orderItemId,
    orderId: row.orderId,
    productId: row.productId ?? '',
    productVariantId: row.productVariantId ?? undefined,
    sku: row.sku,
    name: row.name,
    description: row.description ?? undefined,
    quantity: row.quantity,
    unitPrice: Money.fromCents(Number(row.unitPriceCents), currency),
    unitCost: centsToMoney(row.unitCostCents, currency),
    discountedUnitPrice: centsToMoney(row.discountedUnitPriceCents, currency),
    lineTotal: Money.fromCents(Number(row.lineTotalCents || '0'), currency),
    discountTotal: Money.fromCents(Number(row.discountTotalCents || '0'), currency),
    taxTotal: Money.fromCents(Number(row.taxTotalCents || '0'), currency),
    taxRate: row.taxRate ? parseFloat(row.taxRate) : undefined,
    taxExempt: Boolean(row.taxExempt),
    fulfillmentStatus: row.fulfillmentStatus as FulfillmentStatus,
    options: fromJson(row.options),
    attributes: fromJson(row.attributes),
    giftWrapped: Boolean(row.giftWrapped),
    giftMessage: row.giftMessage ?? undefined,
    weight: row.weight ? parseFloat(row.weight) : undefined,
    dimensions: fromJson(row.dimensions),
    isDigital: Boolean(row.isDigital),
    subscriptionInfo: fromJson(row.subscriptionInfo),
    metadata: fromJson<Record<string, unknown>>(row.metadata),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  });
}

export function mapToOrderAddress(row: DbOrderAddress): OrderAddress {
  return OrderAddress.reconstitute({
    orderAddressId: row.orderAddressId,
    orderId: row.orderId,
    addressType: row.addressType as 'shipping' | 'billing',
    firstName: row.firstName,
    lastName: row.lastName,
    company: row.company ?? undefined,
    address1: row.addressLine1,
    address2: row.addressLine2 ?? undefined,
    city: row.city,
    dependentLocality: row.dependentLocality ?? undefined,
    state: row.state ?? undefined,
    postalCode: row.postalCode ?? undefined,
    sortingCode: row.sortingCode ?? undefined,
    addressLines: Array.isArray(row.addressLines) ? (row.addressLines as string[]) : undefined,
    country: row.country,
    countryCode: row.country, // country is 2-char code
    phone: row.phoneNumber ?? undefined,
    email: row.email ?? undefined,
    isDefault: Boolean(row.isDefault),
    metadata: row.additionalInfo ? (typeof row.additionalInfo === 'string' ? JSON.parse(row.additionalInfo) : undefined) : undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  });
}

export function buildOrderWhereClause(filters?: OrderFilters): { whereClause: string; params: unknown[] } {
  const conditions: string[] = ['"deletedAt" IS NULL'];
  const params: unknown[] = [];
  let paramIndex = 1;

  // Simple equality filters — [filter key, column] pairs
  const equalityFilters: [keyof OrderFilters, string][] = [
    ['customerId', '"customerId"'],
    ['storeId', '"storeId"'],
    ['channelId', '"channelId"'],
    ['createdByUserId', '"createdByUserId"'],
    ['orderSource', '"orderSource"'],
    ['status', '"status"'],
    ['paymentStatus', '"paymentStatus"'],
    ['fulfillmentStatus', '"fulfillmentStatus"'],
  ];
  for (const [key, column] of equalityFilters) {
    const value = filters?.[key];
    if (!value) continue;
    conditions.push(`${column} = $${paramIndex++}`);
    params.push(value);
  }

  // Range and search filters
  if (filters?.startDate) {
    conditions.push(`"createdAt" >= $${paramIndex++}`);
    params.push(filters.startDate.toISOString());
  }
  if (filters?.endDate) {
    conditions.push(`"createdAt" <= $${paramIndex++}`);
    params.push(filters.endDate.toISOString());
  }
  if (filters?.minAmountCents !== undefined) {
    conditions.push(`"totalAmountCents" >= $${paramIndex++}`);
    params.push(filters.minAmountCents);
  }
  if (filters?.maxAmountCents !== undefined) {
    conditions.push(`"totalAmountCents" <= $${paramIndex++}`);
    params.push(filters.maxAmountCents);
  }
  if (filters?.search) {
    conditions.push(`("orderNumber" ILIKE $${paramIndex} OR "customerEmail" ILIKE $${paramIndex} OR "customerName" ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}
