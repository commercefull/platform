/**
 * Product Status Value Object
 * Represents the possible states of a product
 */

export enum ProductStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
  ARCHIVED = 'archived'
}

/**
 * State machine for product status transitions
 */
export const ProductStatusTransitions: Record<ProductStatus, ProductStatus[]> = {
  [ProductStatus.DRAFT]: [ProductStatus.PENDING_REVIEW, ProductStatus.ACTIVE, ProductStatus.ARCHIVED],
  [ProductStatus.PENDING_REVIEW]: [ProductStatus.ACTIVE, ProductStatus.DRAFT, ProductStatus.ARCHIVED],
  [ProductStatus.ACTIVE]: [ProductStatus.INACTIVE, ProductStatus.DISCONTINUED, ProductStatus.ARCHIVED],
  [ProductStatus.INACTIVE]: [ProductStatus.ACTIVE, ProductStatus.DISCONTINUED, ProductStatus.ARCHIVED],
  [ProductStatus.DISCONTINUED]: [ProductStatus.ARCHIVED],
  [ProductStatus.ARCHIVED]: []
};

/**
 * Check if a status transition is valid
 */
export function canTransitionProductTo(currentStatus: ProductStatus, newStatus: ProductStatus): boolean {
  const allowedTransitions = ProductStatusTransitions[currentStatus];
  return allowedTransitions?.includes(newStatus) ?? false;
}

/**
 * Get human-readable status label
 */
export function getProductStatusLabel(status: ProductStatus): string {
  const labels: Record<ProductStatus, string> = {
    [ProductStatus.DRAFT]: 'Draft',
    [ProductStatus.PENDING_REVIEW]: 'Pending Review',
    [ProductStatus.ACTIVE]: 'Active',
    [ProductStatus.INACTIVE]: 'Inactive',
    [ProductStatus.DISCONTINUED]: 'Discontinued',
    [ProductStatus.ARCHIVED]: 'Archived'
  };
  return labels[status] || status;
}

/**
 * Check if product is purchasable
 */
export function isProductPurchasable(status: ProductStatus): boolean {
  return status === ProductStatus.ACTIVE;
}
