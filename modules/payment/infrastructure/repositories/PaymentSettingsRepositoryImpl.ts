import type {
  PaymentSettings,
  PaymentSettingsRepository,
  PaymentSettingsUpsertParams,
} from '../../domain/repositories/PaymentSettingsRepository';
import type {
  PaymentWebhook,
  PaymentWebhookCreateParams,
  PaymentWebhookRepository,
} from '../../domain/repositories/PaymentWebhookRepository';
import type {
  StoredPaymentMethod,
  StoredPaymentMethodCreateParams,
  StoredPaymentMethodRepository,
} from '../../domain/repositories/StoredPaymentMethodRepository';
import {
  findSettingsByMerchant as qFindSettingsByMerchant,
  upsertSettings as qUpsertSettings,
  findAllSettings as qFindAllSettings,
  findWebhookByExternalId as qFindWebhookByExternalId,
  createWebhook as qCreateWebhook,
  markWebhookProcessed as qMarkWebhookProcessed,
  findStoredMethodsByCustomer as qFindStoredMethodsByCustomer,
  findStoredMethodById as qFindStoredMethodById,
  createStoredMethod as qCreateStoredMethod,
  setDefaultStoredMethod as qSetDefaultStoredMethod,
  softDeleteStoredMethod as qSoftDeleteStoredMethod,
} from './paymentSettingsQueries';

class PaymentSettingsRepo implements PaymentSettingsRepository {
  findSettingsByMerchant(organizationId: string): Promise<PaymentSettings | null> {
    return qFindSettingsByMerchant(organizationId);
  }

  upsertSettings(params: PaymentSettingsUpsertParams): Promise<PaymentSettings | null> {
    return qUpsertSettings(params);
  }

  findAllSettings(): Promise<PaymentSettings[]> {
    return qFindAllSettings();
  }
}

class PaymentWebhookRepo implements PaymentWebhookRepository {
  findWebhookByExternalId(externalId: string): Promise<PaymentWebhook | null> {
    return qFindWebhookByExternalId(externalId);
  }

  createWebhook(params: PaymentWebhookCreateParams): Promise<PaymentWebhook | null> {
    return qCreateWebhook(params);
  }

  markWebhookProcessed(paymentWebhookId: string): Promise<PaymentWebhook | null> {
    return qMarkWebhookProcessed(paymentWebhookId);
  }
}

class StoredPaymentMethodRepo implements StoredPaymentMethodRepository {
  findStoredMethodsByCustomer(customerId: string): Promise<StoredPaymentMethod[]> {
    return qFindStoredMethodsByCustomer(customerId);
  }

  findStoredMethodById(storedPaymentMethodId: string): Promise<StoredPaymentMethod | null> {
    return qFindStoredMethodById(storedPaymentMethodId);
  }

  createStoredMethod(params: StoredPaymentMethodCreateParams): Promise<StoredPaymentMethod | null> {
    return qCreateStoredMethod(params);
  }

  setDefaultStoredMethod(storedPaymentMethodId: string, customerId: string): Promise<StoredPaymentMethod | null> {
    return qSetDefaultStoredMethod(storedPaymentMethodId, customerId);
  }

  softDeleteStoredMethod(storedPaymentMethodId: string, customerId?: string): Promise<StoredPaymentMethod | null> {
    return qSoftDeleteStoredMethod(storedPaymentMethodId, customerId);
  }
}

export const paymentSettingsRepo = new PaymentSettingsRepo();
export const paymentWebhookRepo = new PaymentWebhookRepo();
export const storedPaymentMethodRepo = new StoredPaymentMethodRepo();
