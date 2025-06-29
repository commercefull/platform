import express from 'express';
import { CustomerPublicController } from './controllers/customerController';

const router = express.Router();
const customerPublicController = new CustomerPublicController();

// Customer account management
router.post('/register', customerPublicController.registerCustomer);
router.get('/customers/:customerId/profile', customerPublicController.getCustomerProfile);
router.put('/customers/:customerId/profile', customerPublicController.updateCustomerProfile);

// Customer address management
router.get('/customers/:customerId/addresses', customerPublicController.getCustomerAddresses);
router.post('/customers/:customerId/addresses', customerPublicController.addCustomerAddress);
router.put('/customer-addresses/:id', customerPublicController.updateCustomerAddress);
router.delete('/customer-addresses/:id', customerPublicController.deleteCustomerAddress);

// Customer wishlist management
router.get('/customers/:customerId/wishlists', customerPublicController.getCustomerWishlists);
router.post('/customers/:customerId/wishlists', customerPublicController.createWishlist);
router.put('/wishlists/:id', customerPublicController.updateWishlist);
router.delete('/wishlists/:id', customerPublicController.deleteWishlist);
router.post('/wishlists/:wishlistId/items', customerPublicController.addItemToWishlist);
router.delete('/wishlist-items/:id', customerPublicController.removeItemFromWishlist);

// Public wishlist access
router.get('/wishlists/public/:id', customerPublicController.getPublicWishlist);

export const customerRouter = router;
