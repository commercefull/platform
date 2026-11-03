import { query, queryOne } from '../../../libs/db';
import type {
  ActivityExportRow,
  AddressExportRow,
  ConsentExportRow,
  CustomerExportRow,
  GdprService,
  OrderExportRow,
} from '../domain/repositories/GdprRepository';
import gdprDataRepository from '../infrastructure/repositories/GdprDataRepository';

export { gdprDataRepository };

export function createGdprService(): GdprService {
  return {
    dataRequests: gdprDataRepository.dataRequests,
    cookieConsents: gdprDataRepository.cookieConsent,

    exportCustomerData: async (customerId: string) => {
      const customer = await queryOne<CustomerExportRow>(
        'SELECT "customerId", "email", "firstName", "lastName", "phone", "createdAt", "updatedAt" FROM "customer" WHERE "customerId" = $1 AND "deletedAt" IS NULL',
        [customerId],
      );

      const orders = await query<OrderExportRow[]>(
        'SELECT "orderId", "orderNumber", status, "totalAmountCents", "currencyCode", "createdAt" FROM "order" WHERE "customerId" = $1 ORDER BY "createdAt" DESC',
        [customerId],
      );

      const addresses = await query<AddressExportRow[]>(
        'SELECT "addressLine1", "addressLine2", city, state, "postalCode", country, "addressType" FROM "customerAddress" WHERE "customerId" = $1',
        [customerId],
      );

      const consents = await query<ConsentExportRow[]>(
        'SELECT necessary, functional, analytics, marketing, "thirdParty", "consentedAt" FROM "gdprCookieConsent" WHERE "customerId" = $1 ORDER BY "consentedAt" DESC',
        [customerId],
      );

      const activities = await query<ActivityExportRow[]>(
        'SELECT "eventType", "createdAt" FROM "analyticsReportEvent" WHERE "customerId" = $1 ORDER BY "createdAt" DESC LIMIT 100',
        [customerId],
      );

      return {
        customer: customer || { customerId },
        orders: orders || [],
        addresses: addresses || [],
        consents: consents || [],
        activities: activities || [],
      };
    },

    anonymizeCustomerData: async (customerId: string) => {
      await query(
        `UPDATE "customer" SET
          "email" = 'anonymized_' || "customerId" || '@deleted.local',
          "firstName" = 'Anonymized',
          "lastName" = 'User',
          "phone" = NULL,
          "dateOfBirth" = NULL,
          "updatedAt" = now()
        WHERE "customerId" = $1`,
        [customerId],
      );

      await query(
        `UPDATE "customerAddress" SET
          "addressLine1" = 'Anonymized',
          "addressLine2" = NULL,
          city = 'Anonymized',
          state = 'Anonymized',
          "postalCode" = '00000'
        WHERE "customerId" = $1`,
        [customerId],
      );
    },

    deleteCustomerData: async (customerId: string) => {
      await query('DELETE FROM "customerAddress" WHERE "customerId" = $1', [customerId]);
      await query(
        'UPDATE "customer" SET "deletedAt" = now(), "email" = \'deleted_\' || "customerId" || \'@deleted.local\', "firstName" = \'Deleted\', "lastName" = \'User\', "phone" = NULL, "dateOfBirth" = NULL, "updatedAt" = now() WHERE "customerId" = $1',
        [customerId],
      );
    },
  };
}
