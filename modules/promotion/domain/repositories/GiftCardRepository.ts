/**
 * Gift Card Repository Port
 *
 * Domain interface for gift card data access. Record types match the
 * `promotionGiftCard` / `promotionGiftCardTransaction` database schema.
 */

export type GiftCardType = 'standard' | 'promotional' | 'reward' | 'refund';
export type GiftCardStatus = 'pending' | 'active' | 'depleted' | 'expired' | 'cancelled' | 'suspended';
export type DeliveryMethod = 'email' | 'sms' | 'print' | 'physical';
export type TransactionType = 'purchase' | 'reload' | 'redemption' | 'refund' | 'adjustment' | 'expiration';

export interface PromotionGiftCard {
  promotionGiftCardId: string;
  code: string;
  type: GiftCardType;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  status: GiftCardStatus;
  purchasedBy?: string;
  purchaseOrderId?: string;
  recipientEmail?: string;
  recipientName?: string;
  personalMessage?: string;
  deliveryDate?: Date;
  isDelivered: boolean;
  deliveredAt?: Date;
  deliveryMethod: DeliveryMethod;
  assignedTo?: string;
  assignedAt?: Date;
  activatedAt?: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
  usageCount: number;
  totalRedeemed: number;
  isReloadable: boolean;
  minReloadAmount?: number;
  maxReloadAmount?: number;
  maxBalance?: number;
  restrictions?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type GiftCard = PromotionGiftCard;

export interface PromotionGiftCardTransaction {
  promotionGiftCardTransactionId: string;
  promotionGiftCardId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  orderId?: string;
  customerId?: string;
  performedBy?: string;
  performedByType?: string;
  notes?: string;
  referenceNumber?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export type GiftCardTransaction = PromotionGiftCardTransaction;

export interface CreateGiftCardInput {
  type?: GiftCardType;
  initialBalance: number;
  currency?: string;
  purchasedBy?: string;
  purchaseOrderId?: string;
  recipientEmail?: string;
  recipientName?: string;
  personalMessage?: string;
  deliveryDate?: Date;
  deliveryMethod?: DeliveryMethod;
  expiresAt?: Date;
  isReloadable?: boolean;
  restrictions?: Record<string, unknown>;
}

export interface GiftCardListFilters {
  status?: GiftCardStatus;
  purchasedBy?: string;
  assignedTo?: string;
}

export interface GiftCardRepository {
  getGiftCard(giftCardId: string): Promise<PromotionGiftCard | null>;
  getGiftCardByCode(code: string): Promise<PromotionGiftCard | null>;
  getGiftCards(
    filters?: GiftCardListFilters,
    pagination?: { limit?: number; offset?: number },
  ): Promise<{ data: PromotionGiftCard[]; total: number }>;
  createGiftCard(giftCard: CreateGiftCardInput): Promise<PromotionGiftCard>;
  activateGiftCard(giftCardId: string): Promise<void>;
  assignGiftCard(giftCardId: string, customerId: string): Promise<void>;
  redeemGiftCard(
    giftCardId: string,
    amount: number,
    orderId?: string,
    customerId?: string,
    performedBy?: string,
  ): Promise<PromotionGiftCardTransaction>;
  reloadGiftCard(
    giftCardId: string,
    amount: number,
    orderId?: string,
    performedBy?: string,
  ): Promise<PromotionGiftCardTransaction>;
  refundToGiftCard(
    giftCardId: string,
    amount: number,
    orderId?: string,
    performedBy?: string,
    notes?: string,
  ): Promise<PromotionGiftCardTransaction>;
  cancelGiftCard(giftCardId: string): Promise<void>;
  getTransactions(giftCardId: string): Promise<PromotionGiftCardTransaction[]>;
}
