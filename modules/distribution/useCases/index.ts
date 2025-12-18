/**
 * Distribution Use Cases Index
 */

// Shipping Use Cases
export { calculateShippingRate, CalculateShippingRate } from './shipping/CalculateShippingRate';
export type { CalculateShippingRateInput, CalculateShippingRateOutput } from './shipping/CalculateShippingRate';

export { getAvailableShippingMethods, GetAvailableShippingMethods } from './shipping/GetAvailableShippingMethods';
export type { GetAvailableShippingMethodsInput, GetAvailableShippingMethodsOutput, AvailableShippingMethod } from './shipping/GetAvailableShippingMethods';

// Fulfillment Use Cases
export { createOrderFulfillment, CreateOrderFulfillment } from './fulfillment/CreateOrderFulfillment';
export type { CreateOrderFulfillmentInput, CreateOrderFulfillmentOutput } from './fulfillment/CreateOrderFulfillment';

export { updateFulfillmentStatus, UpdateFulfillmentStatus } from './fulfillment/UpdateFulfillmentStatus';
export type { UpdateFulfillmentStatusInput, UpdateFulfillmentStatusOutput, FulfillmentStatusAction } from './fulfillment/UpdateFulfillmentStatus';

// Warehouse Use Cases
export { findBestWarehouse, FindBestWarehouse } from './warehouse/FindBestWarehouse';
export type { FindBestWarehouseInput, FindBestWarehouseOutput } from './warehouse/FindBestWarehouse';

export { createWarehouse, CreateWarehouse } from './warehouse/CreateWarehouse';
export type { CreateWarehouseInput, CreateWarehouseOutput } from './warehouse/CreateWarehouse';

export { updateWarehouse, UpdateWarehouse } from './warehouse/UpdateWarehouse';
export type { UpdateWarehouseInput, UpdateWarehouseOutput } from './warehouse/UpdateWarehouse';

export { deleteWarehouse, DeleteWarehouse } from './warehouse/DeleteWarehouse';
export type { DeleteWarehouseInput, DeleteWarehouseOutput } from './warehouse/DeleteWarehouse';

// Distribution Rules Use Cases
export { createDistributionRule, CreateDistributionRule } from './rules/CreateDistributionRule';
export type { CreateDistributionRuleInput, CreateDistributionRuleOutput } from './rules/CreateDistributionRule';

export { updateDistributionRule, UpdateDistributionRule } from './rules/UpdateDistributionRule';
export type { UpdateDistributionRuleInput, UpdateDistributionRuleOutput } from './rules/UpdateDistributionRule';

export { deleteDistributionRule, DeleteDistributionRule } from './rules/DeleteDistributionRule';
export type { DeleteDistributionRuleInput, DeleteDistributionRuleOutput } from './rules/DeleteDistributionRule';
