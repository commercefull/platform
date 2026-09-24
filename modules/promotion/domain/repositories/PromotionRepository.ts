/**
 * Promotion Repository Interface
 */

import { Promotion, PromotionRule, PromotionAction } from '../../../../libs/db/types';

// Types matching infrastructure repository signatures
export type PromotionStatus = 'active' | 'scheduled' | 'expired' | 'disabled' | 'pendingApproval';
export type PromotionScope = 'cart' | 'product' | 'category' | 'organization' | 'shipping' | 'global';
export type RuleCondition =
  | 'cartTotal'
  | 'itemQuantity'
  | 'productCategory'
  | 'customerGroup'
  | 'firstOrder'
  | 'dateRange'
  | 'timeOfDay'
  | 'dayOfWeek'
  | 'shippingMethod'
  | 'paymentMethod';
export type ActionType = 'discountByPercentage' | 'discountByAmount' | 'discountShipping' | 'freeItem' | 'discountByTier' | 'freeGift';

export interface CreateRuleInput {
  name?: string;
  condition: RuleCondition;
  operator: string;
  value: unknown;
  isActive?: boolean;
}

export interface CreateActionInput {
  type: ActionType;
  value: number;
  targetType?: string;
  targetId?: string;
  metadata?: unknown;
}

export interface CreatePromotionInput {
  name: string;
  description?: string;
  status?: PromotionStatus;
  scope: PromotionScope;
  priority?: number;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  isExclusive?: boolean;
  stackability?: 'none' | 'stackable' | 'exclusive';
  maxUsage?: number;
  maxUsagePerCustomer?: number;
  minOrderAmountCents?: number;
  maxDiscountAmountCents?: number;
  organizationId?: string;
  isGlobal?: boolean;
  eligibleCustomerGroups?: string[];
  excludedCustomerGroups?: string[];
  rules?: CreateRuleInput[];
  actions?: CreateActionInput[];
}

export type UpdatePromotionInput = Partial<Omit<CreatePromotionInput, 'rules' | 'actions'>>;

export interface PromotionRepository {
  findById(promotionId: string): Promise<Promotion | null>;
  findAll(
    filters?: {
      status?: PromotionStatus | PromotionStatus[];
      scope?: PromotionScope | PromotionScope[];
      organizationId?: string;
      isActive?: boolean;
      isGlobal?: boolean;
      startBefore?: Date;
      endAfter?: Date;
    },
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      direction?: 'ASC' | 'DESC';
    },
  ): Promise<Promotion[]>;
  findActive(scope?: PromotionScope | PromotionScope[], organizationId?: string): Promise<Promotion[]>;
  create(input: CreatePromotionInput): Promise<Promotion>;
  update(id: string, input: UpdatePromotionInput): Promise<Promotion>;
  delete(promotionId: string): Promise<boolean>;
  findRulesByPromotionId(promotionId: string): Promise<PromotionRule[]>;
  findActionsByPromotionId(promotionId: string): Promise<PromotionAction[]>;
  recordUsage(
    promotionId: string,
    orderId: string,
    customerId?: string,
    discountAmountCents?: number,
    currencyCode?: string,
  ): Promise<unknown>;
  getUsage(promotionId: string): Promise<unknown[]>;
  getUsageCount(promotionId: string): Promise<number>;
  getWithDetails(
    id: string,
  ): Promise<{
    promotion: Promotion;
    rules: PromotionRule[];
    actions: PromotionAction[];
  } | null>;
  isValidForOrder(promotionId: string, orderTotalCents: number, customerId?: string): Promise<boolean>;
  validateCode?(
    code: string,
    subtotal: number,
    customerId?: string,
  ): Promise<{
    valid: boolean;
    promotion?: Promotion & { code?: string; type?: string };
    discount?: number;
    message?: string;
  }>;
  getCustomerUsageCount?(promotionId: string, customerId: string): Promise<number>;
}
