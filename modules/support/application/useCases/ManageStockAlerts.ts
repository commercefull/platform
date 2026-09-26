/**
 * ManageStockAlerts Use Case
 *
 * Stock/price alert reads plus the notify workflows: look up eligible alerts,
 * mark each notified, fan out notifications, and sync the current price on
 * price alerts. Shared by business controllers and scheduled jobs.
 */

export interface AlertListFilters {
  customerId?: string;
  productId?: string;
  status?: string;
}

export interface StockAlertRecord {
  stockAlertId: string;
  customerId?: string | null;
}

export interface PriceAlertRecord {
  priceAlertId: string;
  customerId?: string | null;
}

export interface NotificationSchedulerPort {
  scheduleNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    channels?: string[];
  }): Promise<void>;
}

export interface AlertPort {
  getStockAlerts(
    filters?: AlertListFilters,
    pagination?: { limit?: number; offset?: number },
  ): Promise<{ data: unknown[]; total: number }>;
  getPriceAlerts(
    filters?: AlertListFilters,
    pagination?: { limit?: number; offset?: number },
  ): Promise<{ data: unknown[]; total: number }>;
  getActiveStockAlertsForProduct(productId: string, productVariantId?: string): Promise<StockAlertRecord[]>;
  getPriceAlertsToNotify(productId: string, newPriceCents: number): Promise<PriceAlertRecord[]>;
  notifyStockAlert(stockAlertId: string): Promise<void>;
  notifyPriceAlert(priceAlertId: string, notifiedPriceCents: number): Promise<void>;
  updatePriceAlertCurrentPrice(productId: string, newPriceCents: number): Promise<void>;
  getStockAlert(stockAlertId: string): Promise<StockAlertRecord | null>;
  createStockAlert(alert: CreateStockAlertInput): Promise<StockAlertRecord>;
  cancelStockAlert(stockAlertId: string): Promise<void>;
  getPriceAlert(priceAlertId: string): Promise<PriceAlertRecord | null>;
  createPriceAlert(alert: CreatePriceAlertInput): Promise<PriceAlertRecord>;
  cancelPriceAlert(priceAlertId: string): Promise<void>;
}

export interface CreateStockAlertInput {
  customerId?: string;
  email?: string;
  phone?: string;
  productId: string;
  productVariantId?: string;
  productName?: string;
  variantName?: string;
  sku?: string;
  desiredQuantity?: number;
  stockThreshold?: number;
  notificationChannel?: 'email' | 'sms' | 'push' | 'all';
  expiresAt?: Date;
}

export interface CreatePriceAlertInput {
  customerId?: string;
  email?: string;
  phone?: string;
  productId: string;
  productVariantId?: string;
  productName?: string;
  variantName?: string;
  sku?: string;
  alertType?: 'target' | 'any_drop' | 'percentage_drop';
  targetPriceCents?: number;
  percentageDrop?: number;
  originalPriceCents?: number;
  currentPriceCents?: number;
  currency?: string;
  notificationChannel?: 'email' | 'sms' | 'push' | 'all';
  expiresAt?: Date;
}

export class ManageStockAlertsUseCase {
  constructor(
    private readonly alerts: AlertPort,
    private readonly scheduler: NotificationSchedulerPort,
  ) {}

  async listStockAlerts(filters: AlertListFilters, pagination: { limit?: number; offset?: number }) {
    return this.alerts.getStockAlerts(filters, pagination);
  }

  async listPriceAlerts(filters: AlertListFilters, pagination: { limit?: number; offset?: number }) {
    return this.alerts.getPriceAlerts(filters, pagination);
  }

  async createStockAlert(input: CreateStockAlertInput) {
    return this.alerts.createStockAlert(input);
  }
  async getStockAlert(stockAlertId: string) {
    return this.alerts.getStockAlert(stockAlertId);
  }
  async cancelStockAlert(stockAlertId: string) {
    return this.alerts.cancelStockAlert(stockAlertId);
  }
  async createPriceAlert(input: CreatePriceAlertInput) {
    return this.alerts.createPriceAlert(input);
  }
  async getPriceAlert(priceAlertId: string) {
    return this.alerts.getPriceAlert(priceAlertId);
  }
  async cancelPriceAlert(priceAlertId: string) {
    return this.alerts.cancelPriceAlert(priceAlertId);
  }

  async notifyStockAlerts(productId: string, productVariantId?: string): Promise<number> {
    const alerts = await this.alerts.getActiveStockAlertsForProduct(productId, productVariantId);

    for (const alert of alerts) {
      await this.alerts.notifyStockAlert(alert.stockAlertId);
      await this.scheduler.scheduleNotification({
        userId: alert.customerId || '',
        type: 'stock_alert',
        title: 'Back in Stock',
        message: `Your saved item is back in stock!`,
        data: { productId, productVariantId, alertId: alert.stockAlertId },
        channels: ['email', 'in_app'],
      });
    }

    return alerts.length;
  }

  async notifyPriceAlerts(productId: string, newPrice: number): Promise<number> {
    const newPriceCents = Math.round(Number(newPrice) * 100);
    const alerts = await this.alerts.getPriceAlertsToNotify(productId, newPriceCents);

    for (const alert of alerts) {
      await this.alerts.notifyPriceAlert(alert.priceAlertId, newPriceCents);
      await this.scheduler.scheduleNotification({
        userId: alert.customerId || '',
        type: 'price_alert',
        title: 'Price Drop Alert',
        message: `The price has dropped to $${newPrice}!`,
        data: { productId, newPrice, alertId: alert.priceAlertId },
        channels: ['email', 'in_app'],
      });
    }

    // Update current price for all alerts
    await this.alerts.updatePriceAlertCurrentPrice(productId, newPriceCents);

    return alerts.length;
  }
}
