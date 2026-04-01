import express from 'express';
import {
  userContactUsValidationRules,
  validateContactUs,
  userContactFormValidationRules,
  validateContactForm,
} from '../../modules/content/validator';
import {
  getHomePage,
  getAboutUsPage,
  getShippingPolicyPage,
  getCareersPage,
  getContactUsPage,
  submitContactForm,
  getContactFormPage,
  submitContactFormAdvanced,
  getFaqPage,
  getReturnsPage,
  getSupportPage,
} from './controllers/pageCustomerController';
import {
  getActiveContentTypes,
  getPublishedPageBySlug,
  getPublishedPages,
} from '../../modules/content/interface/controllers/contentCustomerController';

// Import new controllers
import * as productController from './controllers/productController';
import * as basketController from './controllers/basketController';
import * as authController from './controllers/authController';
import * as checkoutController from './controllers/checkoutController';
import * as orderController from './controllers/orderController';
import * as categoryController from './controllers/categoryController';
import * as wishlistController from './controllers/wishlistController';
import * as reviewController from './controllers/reviewController';
import * as addressController from './controllers/addressController';
import * as returnController from './controllers/returnController';
import * as loyaltyController from './controllers/loyaltyController';
import * as subscriptionController from './controllers/subscriptionController';
import * as membershipController from './controllers/membershipController';
import * as notificationController from './controllers/notificationController';
import * as referralController from './controllers/referralController';
import { isCustomerLoggedIn } from '../../libs/auth';

const router = express.Router();

// ============================================================================
// Category Navigation Middleware
// ============================================================================

// Load categories for navigation on all routes
router.use(categoryController.loadCategoriesForNavigation);

// ============================================================================
// Page Routes
// ============================================================================

// GET: home page
router.get('/', getHomePage);

// GET: display about us page
router.get('/pages/about-us', getAboutUsPage);

// GET: display shipping policy page
router.get('/pages/shipping-policy', getShippingPolicyPage);

// GET: display careers page
router.get('/pages/careers', getCareersPage);

// GET: display contact us page
router.get('/pages/contact-us', getContactUsPage);

// GET: display contact form page
router.get('/contact-form', getContactFormPage);

// GET: display FAQ page
router.get('/faq', getFaqPage);

// GET: display returns page
router.get('/returns', getReturnsPage);

// GET: display support page
router.get('/support', getSupportPage);

// POST: handle contact us form
router.post('/pages/contact-us', [userContactUsValidationRules, validateContactUs], submitContactForm);

// POST: handle contact form submission
router.post('/contact-form', [userContactFormValidationRules, validateContactForm], submitContactFormAdvanced);

// ============================================================================
// Product Routes
// ============================================================================

// GET: all products (PLP)
router.get('/products', productController.listProducts);

// GET: products by category
router.get('/products/category/:categorySlug', productController.getCategoryProducts);

// GET: product detail (PDP)
router.get('/products/:categorySlug/:productId', productController.getProduct);

// GET: search products
router.get('/search', productController.searchProducts);

// ============================================================================
// Category Routes
// ============================================================================

// GET: categories for navigation (API)
router.get('/api/categories/navigation', categoryController.getCategoriesForNavigation);

// GET: all categories (API)
router.get('/api/categories', categoryController.getAllCategories);

// GET: category details (API)
router.get('/api/categories/:categoryId', categoryController.getCategoryDetails);

// GET: category landing page
router.get('/categories/:categorySlug', categoryController.getCategoryPage);

// ============================================================================
// Basket/Cart Routes
// ============================================================================

// GET: view basket
router.get('/basket', basketController.viewBasket);

// POST: add item to basket
router.post('/basket/add/:productId', basketController.addToBasket);

// PUT: update basket item
router.put('/basket/item/:basketItemId', basketController.updateBasketItem);

// DELETE: remove item from basket
router.delete('/basket/item/:basketItemId', basketController.removeFromBasket);

// POST: clear basket
router.post('/basket/clear', basketController.clearBasket);

// ============================================================================
// Authentication Routes
// ============================================================================

// GET: sign in form
router.get('/signin', authController.signInForm);

// POST: sign in process
router.post('/signin', authController.signIn);

// GET: sign up form
router.get('/signup', authController.signUpForm);

// POST: sign up process
router.post('/signup', authController.signUp);

// GET: user profile
router.get('/profile', authController.profile);

// POST: update profile
router.post('/profile', authController.updateProfile);

// POST: change password
router.post('/profile/change-password', authController.changePassword);

// POST: sign out
router.post('/signout', authController.signOut);

// ============================================================================
// Checkout Routes
// ============================================================================

// GET: checkout page
router.get('/checkout', checkoutController.checkout);

// POST: process checkout
router.post('/checkout', checkoutController.processCheckout);

// GET: order confirmation
router.get('/order-confirmation/:orderId', checkoutController.orderConfirmation);

// ============================================================================
// Order Routes
// ============================================================================

// GET: order history
router.get('/orders', orderController.orderHistory);

// GET: order details
router.get('/orders/:orderId', orderController.orderDetails);

// GET: order tracking (public)
router.get('/track/:orderNumber', orderController.orderTracking);

// ============================================================================
// Wishlist Routes
// ============================================================================

// GET: view wishlist
router.get('/wishlist', wishlistController.viewWishlist);

// POST: add to wishlist
router.post('/wishlist/add/:productId', wishlistController.addToWishlist);

// POST: remove from wishlist
router.post('/wishlist/remove/:productId', wishlistController.removeFromWishlist);

// ============================================================================
// Review Routes
// ============================================================================

// GET: product reviews (API)
router.get('/api/reviews/:productId', reviewController.getProductReviews);

// POST: submit review
router.post('/reviews/:productId', reviewController.submitReview);

// POST: mark review helpful
router.post('/reviews/:reviewId/helpful', reviewController.markReviewHelpful);

// ============================================================================
// Address Routes
// ============================================================================

// GET: list addresses
router.get('/addresses', addressController.listAddresses);

// GET: add address form
router.get('/addresses/add', addressController.addAddressForm);

// POST: add address
router.post('/addresses', addressController.addAddress);

// GET: edit address form
router.get('/addresses/:addressId/edit', addressController.editAddressForm);

// POST: update address
router.post('/addresses/:addressId', addressController.updateAddress);

// POST: delete address
router.post('/addresses/:addressId/delete', addressController.deleteAddress);

// ============================================================================
// Return Routes
// ============================================================================

// GET: list returns
router.get('/returns', returnController.listReturns);

// GET: return request form
router.get('/orders/:orderId/return', returnController.returnRequestForm);

// POST: submit return request
router.post('/orders/:orderId/return', returnController.submitReturnRequest);

// GET: view return details
router.get('/returns/:returnId', returnController.viewReturn);

// ============================================================================
// Loyalty Routes
// ============================================================================

// GET: loyalty dashboard
router.get('/loyalty', loyaltyController.loyaltyDashboard);

// GET: points history
router.get('/loyalty/history', loyaltyController.pointsHistory);

// POST: redeem reward
router.post('/loyalty/redeem/:rewardId', loyaltyController.redeemReward);

// ============================================================================
// Subscription Routes
// ============================================================================

// GET: list subscription plans (public)
router.get('/subscriptions', subscriptionController.listPlans);

// GET: my subscriptions (auth required)
router.get('/subscriptions/my', subscriptionController.mySubscriptions);

// GET: view subscription detail
router.get('/subscriptions/:subscriptionId', subscriptionController.viewSubscription);

// POST: cancel subscription
router.post('/subscriptions/:subscriptionId/cancel', subscriptionController.cancelSubscription);

// ============================================================================
// Membership Routes
// ============================================================================

// GET: list membership plans (public)
router.get('/membership', membershipController.listPlans);

// GET: view plan detail
router.get('/membership/plans/:planId', membershipController.viewPlan);

// GET: my membership
router.get('/membership/my', membershipController.myMembership);

// POST: join a membership plan
router.post('/membership/join/:planId', membershipController.joinPlan);

// ============================================================================
// Notification Routes
// ============================================================================

// GET: list notifications
router.get('/notifications', notificationController.listNotifications);

// POST: mark notification as read
router.post('/notifications/:notificationId/read', notificationController.markAsRead);

// POST: mark all notifications as read
router.post('/notifications/read-all', notificationController.markAllAsRead);

// GET: notification preferences
router.get('/notifications/preferences', notificationController.getPreferences);

// POST: update notification preferences
router.post('/notifications/preferences', notificationController.updatePreferences);

// GET: push notification devices
router.get('/notifications/devices', isCustomerLoggedIn, notificationController.getDevices);

// POST: register a push notification device
router.post('/notifications/devices', isCustomerLoggedIn, notificationController.registerDevice);

// POST: delete a push notification device
router.post('/notifications/devices/:deviceToken/delete', isCustomerLoggedIn, notificationController.deleteDevice);

// ============================================================================
// Referral Routes
// ============================================================================

// GET: referral status page (auth required)
router.get('/referrals', isCustomerLoggedIn, referralController.getReferralStatus);

// ============================================================================
// Content Routes
// ============================================================================

// Public routes for content access
router.get('/pages', getPublishedPages);
router.get('/pages/:slug', getPublishedPageBySlug);
router.get('/types', getActiveContentTypes);

export const storefrontCustomerRouter = router;
