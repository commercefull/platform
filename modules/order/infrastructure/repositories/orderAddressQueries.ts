/**
 * orderAddress table queries.
 */

import { query, queryOne } from '../../../../libs/db';
import { OrderAddress } from '../../domain/entities/OrderAddress';
import type { OrderAddress as DbOrderAddress } from '../../../../libs/db/types';
import { mapToOrderAddress } from './orderRowMappers';

export async function getOrderAddresses(orderId: string): Promise<OrderAddress[]> {
  const rows = await query<DbOrderAddress[]>('SELECT * FROM "orderAddress" WHERE "orderId" = $1', [orderId]);
  return (rows || []).map(row => mapToOrderAddress(row));
}

export async function getShippingAddress(orderId: string): Promise<OrderAddress | null> {
  const row = await queryOne<DbOrderAddress>(`SELECT * FROM "orderAddress" WHERE "orderId" = $1 AND "addressType" = 'shipping'`, [orderId]);
  return row ? mapToOrderAddress(row) : null;
}

export async function getBillingAddress(orderId: string): Promise<OrderAddress | null> {
  const row = await queryOne<DbOrderAddress>(`SELECT * FROM "orderAddress" WHERE "orderId" = $1 AND "addressType" = 'billing'`, [orderId]);
  return row ? mapToOrderAddress(row) : null;
}

function orderAddressRowValues(address: OrderAddress): Record<string, unknown> {
  return {
    orderAddressId: address.orderAddressId,
    orderId: address.orderId,
    addressType: address.addressType,
    firstName: address.firstName,
    lastName: address.lastName,
    company: address.company || null,
    addressLine1: address.address1,
    addressLine2: address.address2 || null,
    city: address.city,
    state: address.state ?? null,
    postalCode: address.postalCode ?? null,
    country: address.country,
    phoneNumber: address.phone || null,
    email: address.email || null,
    isDefault: address.isDefault,
    additionalInfo: address.metadata ? JSON.stringify(address.metadata) : null,
    dependentLocality: address.dependentLocality ?? null,
    sortingCode: address.sortingCode ?? null,
    addressLines: address.addressLines ? JSON.stringify(address.addressLines) : null,
  };
}

async function updateOrderAddressRow(address: OrderAddress): Promise<void> {
  const now = new Date().toISOString();
  const v = orderAddressRowValues(address);
  await query(
    `UPDATE "orderAddress" SET
        "firstName" = $1, "lastName" = $2, "company" = $3, "addressLine1" = $4,
        "addressLine2" = $5, "city" = $6, "state" = $7, "postalCode" = $8,
        "country" = $9, "phoneNumber" = $10, "email" = $11,
        "isDefault" = $12, "additionalInfo" = $13, "updatedAt" = $14,
        "dependentLocality" = $16, "sortingCode" = $17, "addressLines" = $18
      WHERE "orderAddressId" = $15`,
    [
      v.firstName,
      v.lastName,
      v.company,
      v.addressLine1,
      v.addressLine2,
      v.city,
      v.state,
      v.postalCode,
      v.country,
      v.phoneNumber,
      v.email,
      v.isDefault,
      v.additionalInfo,
      now,
      address.orderAddressId,
      v.dependentLocality,
      v.sortingCode,
      v.addressLines,
    ],
  );
}

async function insertOrderAddressRow(address: OrderAddress): Promise<void> {
  const now = new Date().toISOString();
  const v = orderAddressRowValues(address);
  await query(
    `INSERT INTO "orderAddress" (
        "orderAddressId", "orderId", "addressType", "firstName", "lastName",
        "company", "addressLine1", "addressLine2", "city", "state", "postalCode",
        "country", "phoneNumber", "email", "isDefault", "additionalInfo",
        "dependentLocality", "sortingCode", "addressLines",
        "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
    [
      v.orderAddressId,
      v.orderId,
      v.addressType,
      v.firstName,
      v.lastName,
      v.company,
      v.addressLine1,
      v.addressLine2,
      v.city,
      v.state,
      v.postalCode,
      v.country,
      v.phoneNumber,
      v.email,
      v.isDefault,
      v.additionalInfo,
      v.dependentLocality,
      v.sortingCode,
      v.addressLines,
      now,
      now,
    ],
  );
}

export async function saveOrderAddress(address: OrderAddress): Promise<OrderAddress> {
  const existing = await queryOne<{ orderAddressId: string }>('SELECT "orderAddressId" FROM "orderAddress" WHERE "orderAddressId" = $1', [
    address.orderAddressId,
  ]);

  if (existing) {
    await updateOrderAddressRow(address);
  } else {
    await insertOrderAddressRow(address);
  }
  return address;
}
