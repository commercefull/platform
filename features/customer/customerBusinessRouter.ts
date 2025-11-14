import express from "express";
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
  searchCustomers,
  getCustomerAddresses,
  getCustomerAddressById,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  getCustomerGroups,
  getCustomerGroupById,
  createCustomerGroup,
  updateCustomerGroup,
  deleteCustomerGroup,
  getCustomersInGroup,
  getCustomerGroupMemberships,
  addCustomerToGroup,
  removeCustomerFromGroup,
  getCustomerWishlists,
  getWishlistById,
  removeItemFromWishlist,
  getNewCustomersCount,
  getTopCustomers
} from "./controllers/customerMerchantController";

const router = express.Router();

// Customer Routes
router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomerById);
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);
router.get('/customers/:id/stats', getCustomerStats);
router.get('/customers/search', searchCustomers);

// Customer Address Routes
router.get('/customers/:customerId/addresses', getCustomerAddresses);
router.get('/customer-addresses/:id', getCustomerAddressById);
router.post('/customers/:customerId/addresses', createCustomerAddress);
router.put('/customer-addresses/:id', updateCustomerAddress);
router.delete('/customer-addresses/:id', deleteCustomerAddress);

// Customer Group Routes
router.get('/customer-groups', getCustomerGroups);
router.get('/customer-groups/:id', getCustomerGroupById);
router.post('/customer-groups', createCustomerGroup);
router.put('/customer-groups/:id', updateCustomerGroup);
router.delete('/customer-groups/:id', deleteCustomerGroup);

// Customer Group Membership Routes
router.get('/customer-groups/:groupId/customers', getCustomersInGroup);
router.get('/customers/:customerId/groups', getCustomerGroupMemberships);
router.post('/customers/:customerId/groups/:groupId', addCustomerToGroup);
router.delete('/customers/:customerId/groups/:groupId', removeCustomerFromGroup);

// Customer Wishlist Routes (Admin)
router.get('/customers/:customerId/wishlists', getCustomerWishlists);
router.get('/wishlists/:id', getWishlistById);
router.delete('/wishlist-items/:id', removeItemFromWishlist);

// Customer Analytics Routes
router.get('/analytics/new-customers', getNewCustomersCount);
router.get('/analytics/top-customers', getTopCustomers);

export const customerMerchantRouter = router;