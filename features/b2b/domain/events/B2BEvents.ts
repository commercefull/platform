/**
 * B2B Domain Events
 * Events for B2B companies, quotes, and approval workflows
 */

// ============================================================================
// Company Events
// ============================================================================

export interface CompanyCreatedEvent {
  type: 'b2b.company.created';
  payload: {
    companyId: string;
    name: string;
    taxId?: string;
    industry?: string;
    status: string;
    createdBy?: string;
    timestamp: string;
  };
}

export interface CompanyUpdatedEvent {
  type: 'b2b.company.updated';
  payload: {
    companyId: string;
    name: string;
    changes: string[];
    updatedBy?: string;
    timestamp: string;
  };
}

export interface CompanyStatusChangedEvent {
  type: 'b2b.company.status_changed';
  payload: {
    companyId: string;
    name: string;
    previousStatus: string;
    newStatus: string;
    reason?: string;
    changedBy?: string;
    timestamp: string;
  };
}

export interface CompanyApprovedEvent {
  type: 'b2b.company.approved';
  payload: {
    companyId: string;
    name: string;
    approvedBy?: string;
    creditLimit?: number;
    paymentTerms?: string;
    timestamp: string;
  };
}

export interface CompanyRejectedEvent {
  type: 'b2b.company.rejected';
  payload: {
    companyId: string;
    name: string;
    rejectedBy?: string;
    reason: string;
    timestamp: string;
  };
}

export interface CompanySuspendedEvent {
  type: 'b2b.company.suspended';
  payload: {
    companyId: string;
    name: string;
    suspendedBy?: string;
    reason: string;
    timestamp: string;
  };
}

export interface CompanyCreditLimitChangedEvent {
  type: 'b2b.company.credit_limit_changed';
  payload: {
    companyId: string;
    name: string;
    previousLimit: number;
    newLimit: number;
    changedBy?: string;
    timestamp: string;
  };
}

// ============================================================================
// Company User Events
// ============================================================================

export interface CompanyUserAddedEvent {
  type: 'b2b.company.user_added';
  payload: {
    companyId: string;
    userId: string;
    email: string;
    role: string;
    addedBy?: string;
    timestamp: string;
  };
}

export interface CompanyUserRemovedEvent {
  type: 'b2b.company.user_removed';
  payload: {
    companyId: string;
    userId: string;
    email: string;
    removedBy?: string;
    timestamp: string;
  };
}

export interface CompanyUserRoleChangedEvent {
  type: 'b2b.company.user_role_changed';
  payload: {
    companyId: string;
    userId: string;
    previousRole: string;
    newRole: string;
    changedBy?: string;
    timestamp: string;
  };
}

// ============================================================================
// Quote Events
// ============================================================================

export interface QuoteCreatedEvent {
  type: 'b2b.quote.created';
  payload: {
    quoteId: string;
    quoteNumber: string;
    companyId: string;
    companyName: string;
    total: number;
    currency: string;
    itemCount: number;
    createdBy?: string;
    timestamp: string;
  };
}

export interface QuoteUpdatedEvent {
  type: 'b2b.quote.updated';
  payload: {
    quoteId: string;
    quoteNumber: string;
    companyId: string;
    changes: string[];
    updatedBy?: string;
    timestamp: string;
  };
}

export interface QuoteSubmittedEvent {
  type: 'b2b.quote.submitted';
  payload: {
    quoteId: string;
    quoteNumber: string;
    companyId: string;
    companyName: string;
    total: number;
    submittedBy?: string;
    timestamp: string;
  };
}

export interface QuoteApprovedEvent {
  type: 'b2b.quote.approved';
  payload: {
    quoteId: string;
    quoteNumber: string;
    companyId: string;
    total: number;
    approvedBy?: string;
    validUntil: string;
    timestamp: string;
  };
}

export interface QuoteRejectedEvent {
  type: 'b2b.quote.rejected';
  payload: {
    quoteId: string;
    quoteNumber: string;
    companyId: string;
    rejectedBy?: string;
    reason: string;
    timestamp: string;
  };
}

export interface QuoteExpiredEvent {
  type: 'b2b.quote.expired';
  payload: {
    quoteId: string;
    quoteNumber: string;
    companyId: string;
    expiredAt: string;
    timestamp: string;
  };
}

export interface QuoteConvertedToOrderEvent {
  type: 'b2b.quote.converted_to_order';
  payload: {
    quoteId: string;
    quoteNumber: string;
    orderId: string;
    orderNumber: string;
    companyId: string;
    total: number;
    convertedBy?: string;
    timestamp: string;
  };
}

export interface QuoteItemAddedEvent {
  type: 'b2b.quote.item_added';
  payload: {
    quoteId: string;
    quoteNumber: string;
    itemId: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    timestamp: string;
  };
}

export interface QuoteItemRemovedEvent {
  type: 'b2b.quote.item_removed';
  payload: {
    quoteId: string;
    quoteNumber: string;
    itemId: string;
    productId: string;
    timestamp: string;
  };
}

export interface QuoteDiscountAppliedEvent {
  type: 'b2b.quote.discount_applied';
  payload: {
    quoteId: string;
    quoteNumber: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    appliedBy?: string;
    timestamp: string;
  };
}

// ============================================================================
// Approval Workflow Events
// ============================================================================

export interface ApprovalRuleCreatedEvent {
  type: 'b2b.approval.rule_created';
  payload: {
    ruleId: string;
    companyId: string;
    name: string;
    threshold: number;
    createdBy?: string;
    timestamp: string;
  };
}

export interface ApprovalRuleUpdatedEvent {
  type: 'b2b.approval.rule_updated';
  payload: {
    ruleId: string;
    companyId: string;
    changes: string[];
    updatedBy?: string;
    timestamp: string;
  };
}

export interface ApprovalRequestCreatedEvent {
  type: 'b2b.approval.request_created';
  payload: {
    requestId: string;
    companyId: string;
    entityType: 'quote' | 'order' | 'purchase_request';
    entityId: string;
    amount: number;
    requestedBy?: string;
    timestamp: string;
  };
}

export interface ApprovalRequestApprovedEvent {
  type: 'b2b.approval.request_approved';
  payload: {
    requestId: string;
    companyId: string;
    entityType: string;
    entityId: string;
    approvedBy: string;
    level: number;
    timestamp: string;
  };
}

export interface ApprovalRequestRejectedEvent {
  type: 'b2b.approval.request_rejected';
  payload: {
    requestId: string;
    companyId: string;
    entityType: string;
    entityId: string;
    rejectedBy: string;
    reason: string;
    timestamp: string;
  };
}

export interface ApprovalRequestEscalatedEvent {
  type: 'b2b.approval.request_escalated';
  payload: {
    requestId: string;
    companyId: string;
    fromLevel: number;
    toLevel: number;
    escalatedTo: string;
    timestamp: string;
  };
}

// ============================================================================
// Type Union
// ============================================================================

export type B2BEventType =
  // Company events
  | 'b2b.company.created'
  | 'b2b.company.updated'
  | 'b2b.company.status_changed'
  | 'b2b.company.approved'
  | 'b2b.company.rejected'
  | 'b2b.company.suspended'
  | 'b2b.company.credit_limit_changed'
  | 'b2b.company.user_added'
  | 'b2b.company.user_removed'
  | 'b2b.company.user_role_changed'
  // Quote events
  | 'b2b.quote.created'
  | 'b2b.quote.updated'
  | 'b2b.quote.submitted'
  | 'b2b.quote.approved'
  | 'b2b.quote.rejected'
  | 'b2b.quote.expired'
  | 'b2b.quote.converted_to_order'
  | 'b2b.quote.item_added'
  | 'b2b.quote.item_removed'
  | 'b2b.quote.discount_applied'
  // Approval events
  | 'b2b.approval.rule_created'
  | 'b2b.approval.rule_updated'
  | 'b2b.approval.request_created'
  | 'b2b.approval.request_approved'
  | 'b2b.approval.request_rejected'
  | 'b2b.approval.request_escalated';

export type B2BEvent =
  | CompanyCreatedEvent
  | CompanyUpdatedEvent
  | CompanyStatusChangedEvent
  | CompanyApprovedEvent
  | CompanyRejectedEvent
  | CompanySuspendedEvent
  | CompanyCreditLimitChangedEvent
  | CompanyUserAddedEvent
  | CompanyUserRemovedEvent
  | CompanyUserRoleChangedEvent
  | QuoteCreatedEvent
  | QuoteUpdatedEvent
  | QuoteSubmittedEvent
  | QuoteApprovedEvent
  | QuoteRejectedEvent
  | QuoteExpiredEvent
  | QuoteConvertedToOrderEvent
  | QuoteItemAddedEvent
  | QuoteItemRemovedEvent
  | QuoteDiscountAppliedEvent
  | ApprovalRuleCreatedEvent
  | ApprovalRuleUpdatedEvent
  | ApprovalRequestCreatedEvent
  | ApprovalRequestApprovedEvent
  | ApprovalRequestRejectedEvent
  | ApprovalRequestEscalatedEvent;
