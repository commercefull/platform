/**
 * libs/rules — Shared rule-engine primitives
 *
 * Reusable condition matching, rule resolution, stacking, and rounding
 * used by promotion, tax, shipping, pricing, loyalty, fraud, and returns.
 *
 * No dependencies on `modules/*` — this is a shared kernel.
 */

export * from './conditions';
export * from './resolver';
export * from './stacking';
export * from './rounding';
