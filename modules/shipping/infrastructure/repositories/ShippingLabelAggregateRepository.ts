/**
 * Consolidated Shipping Label Repository
 *
 * Wraps shippingLabelRepo as a distinct aggregate-aligned repository.
 *
 * Aggregate: Shipping Label (labels, tracking, void operations)
 */

export { default } from './shippingLabelRepo';
