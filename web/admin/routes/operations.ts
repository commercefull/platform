import type { HttpRouter } from 'libs/http';
import { asyncHandler } from '../../../libs/asyncHandler';
import {
  adjustStock,
  approveDispatch,
  cancelDispatch,
  createDispatch,
  createDispatchForm,
  listDispatches,
  listInventory,
  listLocations,
  lowStockReport,
  markDispatched,
  receiveDispatch,
  viewDispatch,
  viewInventoryHistory,
  createAllocationRule,
  deleteAllocationRule,
  listAllocationRules,
} from '../../../modules/inventory';
import {
  approveTaxExemption,
  createTaxClass,
  createTaxRate,
  createTaxZone,
  deleteTaxClass,
  deleteTaxRate,
  deleteTaxZone,
  listTaxExemptions,
  listTaxSettings,
  rejectTaxExemption,
  updateTaxClass,
  updateTaxRate,
  updateTaxZone,
} from '../../../modules/tax';
import {
  completeGdprRequest,
  consentManagement,
  createGdprRequest,
  gdprDashboard,
  processGdprRequest,
  viewGdprRequest,
} from '../../../modules/gdpr';
import {
  createFaq,
  deleteFaq,
  listFaqs,
  listSupportTickets,
  supportDashboard,
  updateFaq,
  updateTicketStatus,
  viewSupportTicket,
} from '../../../modules/support';
import {
  activateWarehouse,
  createWarehouse,
  createWarehouseForm,
  deactivateWarehouse,
  deleteWarehouse,
  editWarehouseForm,
  listWarehouses,
  updateWarehouse,
  viewWarehouse,
} from '../../../modules/warehouse';
import {
  basketAnalytics,
  cleanupExpiredBaskets,
  listAbandonedCarts,
  markCartRecovered,
  recoverAbandonedCart,
  sendRecoveryEmail,
  viewAbandonedCart,
} from '../../../modules/basket';
import {
  cancelFulfillment,
  getFulfillmentStats,
  listFulfillments,
  markAsDelivered,
  markAsShipped,
  updateFulfillmentStatus,
  viewFulfillment,
  warehouseDashboard,
  operationsDashboard,
} from '../../../modules/fulfillment';
import {
  activateSupplier,
  approveSupplier,
  createSupplier,
  createSupplierForm,
  deactivateSupplier,
  deleteSupplier,
  editSupplierForm,
  listSuppliers,
  suspendSupplier,
  updateSupplier,
  viewSupplier,
} from '../../../modules/supplier';

/**
 * Operations admin routes: inventory, tax, GDPR, support, warehouses,
 * fulfillments, suppliers, and cart analytics.
 */
export function registerOperationsRoutes(router: HttpRouter): void {
  // ==========================================================================
  // Inventory Routes
  // ==========================================================================

  router.get('/inventory', asyncHandler(listInventory));
  router.post('/inventory/adjust', asyncHandler(adjustStock));
  router.get('/inventory/locations', asyncHandler(listLocations));
  router.get('/inventory/low-stock', asyncHandler(lowStockReport));
  router.get('/inventory/allocation-rules', asyncHandler(listAllocationRules));
  router.post('/inventory/allocation-rules', asyncHandler(createAllocationRule));
  router.delete('/inventory/allocation-rules/:allocationRuleId', asyncHandler(deleteAllocationRule));
  router.get('/inventory/:inventoryLevelId/history', asyncHandler(viewInventoryHistory));
  router.get('/dispatches', asyncHandler(listDispatches));
  router.get('/dispatches/create', asyncHandler(createDispatchForm));
  router.post('/dispatches', asyncHandler(createDispatch));
  router.get('/dispatches/:dispatchId', asyncHandler(viewDispatch));
  router.post('/dispatches/:dispatchId/approve', asyncHandler(approveDispatch));
  router.post('/dispatches/:dispatchId/dispatch', asyncHandler(markDispatched));
  router.post('/dispatches/:dispatchId/receive', asyncHandler(receiveDispatch));
  router.post('/dispatches/:dispatchId/cancel', asyncHandler(cancelDispatch));

  // ==========================================================================
  // Tax Routes
  // ==========================================================================

  router.get('/tax', asyncHandler(listTaxSettings));
  router.post('/tax/rates', asyncHandler(createTaxRate));
  router.put('/tax/rates/:taxRateId', asyncHandler(updateTaxRate));
  router.delete('/tax/rates/:taxRateId', asyncHandler(deleteTaxRate));
  router.post('/tax/zones', asyncHandler(createTaxZone));
  router.put('/tax/zones/:taxZoneId', asyncHandler(updateTaxZone));
  router.delete('/tax/zones/:taxZoneId', asyncHandler(deleteTaxZone));
  router.post('/tax/classes', asyncHandler(createTaxClass));
  router.put('/tax/classes/:taxClassId', asyncHandler(updateTaxClass));
  router.delete('/tax/classes/:taxClassId', asyncHandler(deleteTaxClass));

  // Tax Exemption Management (Epic F)
  router.get('/tax/exemptions', asyncHandler(listTaxExemptions));
  router.post('/tax/exemptions/:exemptionId/approve', asyncHandler(approveTaxExemption));
  router.post('/tax/exemptions/:exemptionId/reject', asyncHandler(rejectTaxExemption));

  // ==========================================================================
  // Operations Dashboard
  // ==========================================================================

  router.get('/operations', asyncHandler(operationsDashboard));

  // ==========================================================================
  // GDPR Compliance
  // ==========================================================================

  router.get('/gdpr', asyncHandler(gdprDashboard));
  router.post('/gdpr/requests', asyncHandler(createGdprRequest));
  router.get('/gdpr/requests/:requestId', asyncHandler(viewGdprRequest));
  router.post('/gdpr/requests/:requestId/process', asyncHandler(processGdprRequest));
  router.post('/gdpr/requests/:requestId/complete', asyncHandler(completeGdprRequest));
  router.get('/gdpr/consent', asyncHandler(consentManagement));

  // ==========================================================================
  // Support Center
  // ==========================================================================

  router.get('/support', asyncHandler(supportDashboard));
  router.get('/support/tickets', asyncHandler(listSupportTickets));
  router.get('/support/tickets/:ticketId', asyncHandler(viewSupportTicket));
  router.post('/support/tickets/:ticketId/status', asyncHandler(updateTicketStatus));
  router.get('/support/faqs', asyncHandler(listFaqs));
  router.post('/support/faqs', asyncHandler(createFaq));
  router.put('/support/faqs/:faqId', asyncHandler(updateFaq));
  router.delete('/support/faqs/:faqId', asyncHandler(deleteFaq));

  // ==========================================================================
  // Warehouse Operations
  // ==========================================================================

  router.get('/warehouses', asyncHandler(listWarehouses));
  router.get('/warehouses/create', asyncHandler(createWarehouseForm));
  router.post('/warehouses', asyncHandler(createWarehouse));
  router.get('/warehouses/:warehouseId', asyncHandler(viewWarehouse));
  router.get('/warehouses/:warehouseId/edit', asyncHandler(editWarehouseForm));
  router.post('/warehouses/:warehouseId', asyncHandler(updateWarehouse));
  router.post('/warehouses/:warehouseId/activate', asyncHandler(activateWarehouse));
  router.post('/warehouses/:warehouseId/deactivate', asyncHandler(deactivateWarehouse));
  router.delete('/warehouses/:warehouseId', asyncHandler(deleteWarehouse));

  // Order Fulfillments
  router.get('/fulfillments', asyncHandler(listFulfillments));
  router.get('/fulfillments/:fulfillmentId', asyncHandler(viewFulfillment));
  router.post('/fulfillments/:fulfillmentId/status', asyncHandler(updateFulfillmentStatus));
  router.post('/fulfillments/:fulfillmentId/shipped', asyncHandler(markAsShipped));
  router.post('/fulfillments/:fulfillmentId/delivered', asyncHandler(markAsDelivered));
  router.post('/fulfillments/:fulfillmentId/cancel', asyncHandler(cancelFulfillment));
  router.get('/fulfillments/stats', asyncHandler(getFulfillmentStats));

  // Supplier Management
  router.get('/suppliers', asyncHandler(listSuppliers));
  router.get('/suppliers/create', asyncHandler(createSupplierForm));
  router.post('/suppliers', asyncHandler(createSupplier));
  router.get('/suppliers/:supplierId', asyncHandler(viewSupplier));
  router.get('/suppliers/:supplierId/edit', asyncHandler(editSupplierForm));
  router.post('/suppliers/:supplierId', asyncHandler(updateSupplier));
  router.post('/suppliers/:supplierId/approve', asyncHandler(approveSupplier));
  router.post('/suppliers/:supplierId/suspend', asyncHandler(suspendSupplier));
  router.post('/suppliers/:supplierId/activate', asyncHandler(activateSupplier));
  router.post('/suppliers/:supplierId/deactivate', asyncHandler(deactivateSupplier));
  router.delete('/suppliers/:supplierId', asyncHandler(deleteSupplier));

  // Cart Analytics
  router.get('/baskets/abandoned', asyncHandler(listAbandonedCarts));
  router.get('/baskets/abandoned/:basketId', asyncHandler(viewAbandonedCart));
  router.post('/baskets/abandoned/:basketId/recover', asyncHandler(recoverAbandonedCart));
  router.post('/baskets/abandoned/:basketId/email', asyncHandler(sendRecoveryEmail));
  router.post('/baskets/abandoned/:basketId/recovered', asyncHandler(markCartRecovered));
  router.post('/baskets/cleanup-expired', asyncHandler(cleanupExpiredBaskets));
  router.get('/baskets/analytics', asyncHandler(basketAnalytics));

  // Warehouse Dashboard
  router.get('/operations/dashboard', asyncHandler(warehouseDashboard));
}
