import express from "express";
import { CustomerController } from "./controllers/customerController";

const router = express.Router();
const customerController = new CustomerController();

// Customer Routes
router.get('/customers', customerController.getCustomers);
router.get('/customers/:id', customerController.getCustomerById);
router.post('/customers', customerController.createCustomer);
router.put('/customers/:id', customerController.updateCustomer);
router.delete('/customers/:id', customerController.deleteCustomer);
router.get('/customers/:id/stats', customerController.getCustomerStats);
router.get('/customers/search', customerController.searchCustomers);

// Customer Address Routes
router.get('/customers/:customerId/addresses', customerController.getCustomerAddresses);
router.get('/customer-addresses/:id', customerController.getCustomerAddressById);
router.post('/customers/:customerId/addresses', customerController.createCustomerAddress);
router.put('/customer-addresses/:id', customerController.updateCustomerAddress);
router.delete('/customer-addresses/:id', customerController.deleteCustomerAddress);

// Customer Group Routes
router.get('/customer-groups', customerController.getCustomerGroups);
router.get('/customer-groups/:id', customerController.getCustomerGroupById);
router.post('/customer-groups', customerController.createCustomerGroup);
router.put('/customer-groups/:id', customerController.updateCustomerGroup);
router.delete('/customer-groups/:id', customerController.deleteCustomerGroup);

// Customer Group Membership Routes
router.get('/customer-groups/:groupId/customers', customerController.getCustomersInGroup);
router.get('/customers/:customerId/groups', customerController.getCustomerGroupMemberships);
router.post('/customers/:customerId/groups/:groupId', customerController.addCustomerToGroup);
router.delete('/customers/:customerId/groups/:groupId', customerController.removeCustomerFromGroup);

// Customer Wishlist Routes (Admin)
router.get('/customers/:customerId/wishlists', customerController.getCustomerWishlists);
router.get('/wishlists/:id', customerController.getWishlistById);
router.delete('/wishlist-items/:id', customerController.removeItemFromWishlist);

// Customer Analytics Routes
router.get('/analytics/new-customers', customerController.getNewCustomersCount);
router.get('/analytics/top-customers', customerController.getTopCustomers);

export const customerRouterAdmin = router;