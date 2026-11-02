import type { HttpRouter } from 'libs/http';
import { asyncHandler } from '../../../libs/asyncHandler';
import {
  addOrderNote,
  cancelOrder,
  deleteOrderNote,
  listFulfillmentPackages,
  listOrderNotes,
  listOrderRefunds,
  listOrders,
  processRefund,
  refundForm,
  updateOrderStatus,
  updatePackageTracking,
  viewOrder,
} from '../../../modules/order';
import {
  addCustomerAddress,
  customerAddresses,
  deactivateCustomer,
  editCustomerForm,
  listCustomers,
  reactivateCustomer,
  updateCustomer,
  verifyCustomer,
  viewCustomer,
} from '../../../modules/customer';
import {
  approveOrganization,
  createOrganization,
  createOrganizationForm,
  deleteOrganization,
  editOrganizationForm,
  listOrganizations,
  suspendOrganization,
  updateOrganization,
  viewOrganization,
} from '../../../modules/organization';
import {
  assignStoreSalesChannel,
  assignUserToStore,
  createStore,
  createStoreSalesChannel,
  createStoreForm,
  editStoreForm,
  listStores,
  manageStoreUsers,
  removeUserFromStore,
  unassignStoreSalesChannel,
  updateStore,
  viewStore,
  adminListMarkets,
  adminViewMarket,
  adminCreateMarketForm,
  adminEditMarketForm,
  adminCreateMarket,
  adminUpdateMarket,
  adminDeleteMarket,
  adminLaunchMarket,
  adminDisableMarket,
} from '../../../modules/store';
import {
  createSchedule,
  createScheduleForm,
  deleteSchedule,
  editScheduleForm,
  generateReport,
  listSchedules,
  reportingDashboard,
  updateSchedule,
  viewSchedule,
} from '../../../modules/reporting';

/**
 * Commerce admin routes: orders, stores, markets, organizations,
 * reporting schedules, and customers.
 */
export function registerCommerceRoutes(router: HttpRouter): void {
  // ==========================================================================
  // Order Routes
  // ==========================================================================

  router.get('/orders', asyncHandler(listOrders));
  router.get('/orders/:orderId', asyncHandler(viewOrder));
  router.post('/orders/:orderId/status', asyncHandler(updateOrderStatus));
  router.post('/orders/:orderId/cancel', asyncHandler(cancelOrder));
  router.get('/orders/:orderId/refund', asyncHandler(refundForm));
  router.post('/orders/:orderId/refund', asyncHandler(processRefund));

  // Order sub-sections (notes, refunds, packages)
  router.get('/orders/:orderId/notes', asyncHandler(listOrderNotes));
  router.post('/orders/:orderId/notes', asyncHandler(addOrderNote));
  router.post('/orders/:orderId/notes/:noteId/delete', asyncHandler(deleteOrderNote));
  router.get('/orders/:orderId/refunds', asyncHandler(listOrderRefunds));
  router.get('/orders/:orderId/packages', asyncHandler(listFulfillmentPackages));
  router.post('/orders/:orderId/packages/:packageId/tracking', asyncHandler(updatePackageTracking));

  // ==========================================================================
  // Store Routes
  // ==========================================================================

  router.get('/stores', asyncHandler(listStores));
  router.get('/stores/create', asyncHandler(createStoreForm));
  router.post('/stores', asyncHandler(createStore));
  router.get('/stores/:storeId', asyncHandler(viewStore));
  router.get('/stores/:storeId/edit', asyncHandler(editStoreForm));
  router.post('/stores/:storeId', asyncHandler(updateStore));
  router.post('/stores/:storeId/channels', asyncHandler(assignStoreSalesChannel));
  router.post('/stores/:storeId/channels/create', asyncHandler(createStoreSalesChannel));
  router.post('/stores/:storeId/channels/:channelId/remove', asyncHandler(unassignStoreSalesChannel));
  router.get('/stores/:storeId/users', asyncHandler(manageStoreUsers));
  router.post('/stores/:storeId/users', asyncHandler(assignUserToStore));
  router.delete('/stores/:storeId/users/:userId', asyncHandler(removeUserFromStore));

  // ==========================================================================
  // Market Routes — global commerce configuration & launch
  // ==========================================================================

  router.get('/markets', asyncHandler(adminListMarkets));
  router.get('/markets/create', asyncHandler(adminCreateMarketForm));
  router.post('/markets', asyncHandler(adminCreateMarket));
  router.get('/markets/:marketId', asyncHandler(adminViewMarket));
  router.get('/markets/:marketId/edit', asyncHandler(adminEditMarketForm));
  router.post('/markets/:marketId', asyncHandler(adminUpdateMarket));
  router.delete('/markets/:marketId', asyncHandler(adminDeleteMarket));
  router.post('/markets/:marketId/launch', asyncHandler(adminLaunchMarket));
  router.post('/markets/:marketId/disable', asyncHandler(adminDisableMarket));

  // ==========================================================================
  // Organization Routes
  // ==========================================================================

  router.get('/organizations', asyncHandler(listOrganizations));
  router.get('/organizations/create', asyncHandler(createOrganizationForm));
  router.post('/organizations', asyncHandler(createOrganization));
  router.get('/organizations/:organizationId', asyncHandler(viewOrganization));
  router.get('/organizations/:organizationId/edit', asyncHandler(editOrganizationForm));
  router.post('/organizations/:organizationId', asyncHandler(updateOrganization));
  router.delete('/organizations/:organizationId', asyncHandler(deleteOrganization));

  // ==========================================================================
  // Reporting Routes
  // ==========================================================================

  router.get('/reporting', asyncHandler(reportingDashboard));
  router.post('/reporting/generate', asyncHandler(generateReport));
  router.get('/reporting/schedules', asyncHandler(listSchedules));
  router.get('/reporting/schedules/create', asyncHandler(createScheduleForm));
  router.post('/reporting/schedules', asyncHandler(createSchedule));
  router.get('/reporting/schedules/:scheduleId', asyncHandler(viewSchedule));
  router.get('/reporting/schedules/:scheduleId/edit', asyncHandler(editScheduleForm));
  router.post('/reporting/schedules/:scheduleId', asyncHandler(updateSchedule));
  router.delete('/reporting/schedules/:scheduleId', asyncHandler(deleteSchedule));

  // ==========================================================================
  // Customer Routes
  // ==========================================================================

  router.get('/customers', asyncHandler(listCustomers));
  router.get('/customers/:customerId', asyncHandler(viewCustomer));
  router.get('/customers/:customerId/edit', asyncHandler(editCustomerForm));
  router.post('/customers/:customerId', asyncHandler(updateCustomer)); // Form POST
  router.put('/customers/:customerId', asyncHandler(updateCustomer)); // API PUT
  router.post('/customers/:customerId/deactivate', asyncHandler(deactivateCustomer));
  router.post('/customers/:customerId/reactivate', asyncHandler(reactivateCustomer));
  router.post('/customers/:customerId/verify', asyncHandler(verifyCustomer));
  router.get('/customers/:customerId/addresses', asyncHandler(customerAddresses));
  router.post('/customers/:customerId/addresses', asyncHandler(addCustomerAddress));

  // ==========================================================================
  // Operations — Organizations
  // ==========================================================================

  router.get('/operations/organizations', asyncHandler(listOrganizations));
  router.get('/operations/organizations/create', asyncHandler(createOrganizationForm));
  router.post('/operations/organizations', asyncHandler(createOrganization));

  router.get('/operations/organizations/:organizationId', asyncHandler(viewOrganization));
  router.get('/operations/organizations/:organizationId/edit', asyncHandler(editOrganizationForm));
  router.post('/operations/organizations/:organizationId', asyncHandler(updateOrganization));
  router.put('/operations/organizations/:organizationId', asyncHandler(updateOrganization));
  router.delete('/operations/organizations/:organizationId', asyncHandler(deleteOrganization));
  router.post('/operations/organizations/:organizationId/approve', asyncHandler(approveOrganization));
  router.post('/operations/organizations/:organizationId/suspend', asyncHandler(suspendOrganization));
}
