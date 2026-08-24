import express from 'express';
import { asyncHandler } from '../../libs/asyncHandler';
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
import * as supportController from './controllers/supportController';
import * as gdprController from './controllers/gdprController';
import * as storeLocatorController from './controllers/storeLocatorController';
import * as promotionsController from './controllers/promotionsController';
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
router.get('/', asyncHandler(getHomePage));

// GET: display about us page
router.get('/pages/about-us', asyncHandler(getAboutUsPage));

// GET: display shipping policy page
router.get('/pages/shipping-policy', asyncHandler(getShippingPolicyPage));

// GET: display careers page
router.get('/pages/careers', asyncHandler(getCareersPage));

// GET: display contact us page
router.get('/pages/contact-us', asyncHandler(getContactUsPage));

// GET: display contact form page
router.get('/contact-form', asyncHandler(getContactFormPage));

// GET: display FAQ page
router.get('/faq', asyncHandler(getFaqPage));

// GET: display returns page
router.get('/returns', asyncHandler(getReturnsPage));

// GET: display support page
router.get('/support', asyncHandler(getSupportPage));

// GET: store locator page
router.get('/stores', asyncHandler(storeLocatorController.getStoreLocator));

// GET: promotions and coupons landing page
router.get('/promotions', asyncHandler(promotionsController.getPromotionsPage));

// POST: handle contact us form
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/pages/contact-us', [...userContactUsValidationRules(), validateContactUs] as any[], asyncHandler(submitContactForm));

// POST: handle contact form submission
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/contact-form', [...userContactFormValidationRules(), validateContactForm] as any[], asyncHandler(submitContactFormAdvanced));

// ============================================================================
// Product Routes
// ============================================================================

// GET: all products (PLP)
router.get('/products', asyncHandler(productController.listProducts));

// GET: products by category
router.get('/products/category/:categorySlug', asyncHandler(productController.getCategoryProducts));

// GET: product detail (PDP)
router.get('/products/:categorySlug/:productId', asyncHandler(productController.getProduct));

// GET: search products
router.get('/search', asyncHandler(productController.searchProducts));

// ============================================================================
// Category Routes
// ============================================================================

// GET: categories for navigation (API)
router.get('/api/categories/navigation', asyncHandler(categoryController.getCategoriesForNavigation));

// GET: all categories (API)
router.get('/api/categories', asyncHandler(categoryController.getAllCategories));

// GET: category details (API)
router.get('/api/categories/:categoryId', asyncHandler(categoryController.getCategoryDetails));

// GET: category landing page
router.get('/categories/:categorySlug', asyncHandler(categoryController.getCategoryPage));

// ============================================================================
// Basket/Cart Routes
// ============================================================================

// GET: view basket
router.get('/basket', asyncHandler(basketController.viewBasket));

// POST: add item to basket
router.post('/basket/add/:productId', asyncHandler(basketController.addToBasket));

// PUT: update basket item
router.put('/basket/item/:basketItemId', asyncHandler(basketController.updateBasketItem));

// DELETE: remove item from basket
router.delete('/basket/item/:basketItemId', asyncHandler(basketController.removeFromBasket));

// POST: clear basket
router.post('/basket/clear', asyncHandler(basketController.clearBasket));

// ============================================================================
// Authentication Routes
// ============================================================================

// GET: sign in form
router.get('/signin', asyncHandler(authController.signInForm));

// POST: sign in process
router.post('/signin', asyncHandler(authController.signIn));

// GET: sign up form
router.get('/signup', asyncHandler(authController.signUpForm));

// POST: sign up process
router.post('/signup', asyncHandler(authController.signUp));

// GET: user profile
router.get('/profile', asyncHandler(authController.profile));

// POST: update profile
router.post('/profile', asyncHandler(authController.updateProfile));

// POST: change password
router.post('/profile/change-password', asyncHandler(authController.changePassword));

// POST: sign out
router.post('/signout', asyncHandler(authController.signOut));

// ============================================================================
// Checkout Routes
// ============================================================================

// GET: checkout page
router.get('/checkout', asyncHandler(checkoutController.checkout));

// POST: process checkout
router.post('/checkout', asyncHandler(checkoutController.processCheckout));

// GET: order confirmation
router.get('/order-confirmation/:orderId', asyncHandler(checkoutController.orderConfirmation));

// ============================================================================
// Order Routes
// ============================================================================

// GET: order history
router.get('/orders', asyncHandler(orderController.orderHistory));

// GET: order details
router.get('/orders/:orderId', asyncHandler(orderController.orderDetails));

// GET: order tracking (public)
router.get('/track/:orderNumber', asyncHandler(orderController.orderTracking));

// ============================================================================
// Wishlist Routes
// ============================================================================

// GET: view wishlist
router.get('/wishlist', asyncHandler(wishlistController.viewWishlist));

// POST: add to wishlist
router.post('/wishlist/add/:productId', asyncHandler(wishlistController.addToWishlist));

// POST: remove from wishlist
router.post('/wishlist/remove/:productId', asyncHandler(wishlistController.removeFromWishlist));

// ============================================================================
// Review Routes
// ============================================================================

// GET: product reviews (API)
router.get('/api/reviews/:productId', asyncHandler(reviewController.getProductReviews));

// POST: submit review
router.post('/reviews/:productId', asyncHandler(reviewController.submitReview));

// POST: mark review helpful
router.post('/reviews/:reviewId/helpful', asyncHandler(reviewController.markReviewHelpful));

// ============================================================================
// Address Routes
// ============================================================================

// GET: list addresses
router.get('/addresses', asyncHandler(addressController.listAddresses));

// GET: add address form
router.get('/addresses/add', asyncHandler(addressController.addAddressForm));

// POST: add address
router.post('/addresses', asyncHandler(addressController.addAddress));

// GET: edit address form
router.get('/addresses/:addressId/edit', asyncHandler(addressController.editAddressForm));

// POST: update address
router.post('/addresses/:addressId', asyncHandler(addressController.updateAddress));

// POST: delete address
router.post('/addresses/:addressId/delete', asyncHandler(addressController.deleteAddress));

// ============================================================================
// Return Routes
// ============================================================================

// GET: list returns
router.get('/returns', asyncHandler(returnController.listReturns));

// GET: return request form
router.get('/orders/:orderId/return', asyncHandler(returnController.returnRequestForm));

// POST: submit return request
router.post('/orders/:orderId/return', asyncHandler(returnController.submitReturnRequest));

// GET: view return details
router.get('/returns/:returnId', asyncHandler(returnController.viewReturn));

// ============================================================================
// Loyalty Routes
// ============================================================================

// GET: loyalty dashboard
router.get('/loyalty', asyncHandler(loyaltyController.loyaltyDashboard));

// GET: points history
router.get('/loyalty/history', asyncHandler(loyaltyController.pointsHistory));

// POST: redeem reward
router.post('/loyalty/redeem/:rewardId', asyncHandler(loyaltyController.redeemReward));

// ============================================================================
// Subscription Routes
// ============================================================================

// GET: list subscription plans (public)
router.get('/subscriptions', asyncHandler(subscriptionController.listPlans));

// GET: my subscriptions (auth required)
router.get('/subscriptions/my', asyncHandler(subscriptionController.mySubscriptions));

// GET: view subscription detail
router.get('/subscriptions/:subscriptionId', asyncHandler(subscriptionController.viewSubscription));

// POST: cancel subscription
router.post('/subscriptions/:subscriptionId/cancel', asyncHandler(subscriptionController.cancelSubscription));

// ============================================================================
// Membership Routes
// ============================================================================

// GET: list membership plans (public)
router.get('/membership', asyncHandler(membershipController.listPlans));

// GET: view plan detail
router.get('/membership/plans/:planId', asyncHandler(membershipController.viewPlan));

// GET: my membership
router.get('/membership/my', asyncHandler(membershipController.myMembership));

// POST: join a membership plan
router.post('/membership/join/:planId', asyncHandler(membershipController.joinPlan));

// ============================================================================
// Notification Routes
// ============================================================================

// GET: list notifications
router.get('/notifications', asyncHandler(notificationController.listNotifications));

// POST: mark notification as read
router.post('/notifications/:notificationId/read', asyncHandler(notificationController.markAsRead));

// POST: mark all notifications as read
router.post('/notifications/read-all', asyncHandler(notificationController.markAllAsRead));

// GET: notification preferences
router.get('/notifications/preferences', asyncHandler(notificationController.getPreferences));

// POST: update notification preferences
router.post('/notifications/preferences', asyncHandler(notificationController.updatePreferences));

// GET: push notification devices
router.get('/notifications/devices', isCustomerLoggedIn, asyncHandler(notificationController.getDevices));

// POST: register a push notification device
router.post('/notifications/devices', isCustomerLoggedIn, asyncHandler(notificationController.registerDevice));

// POST: delete a push notification device
router.post('/notifications/devices/:deviceToken/delete', isCustomerLoggedIn, asyncHandler(notificationController.deleteDevice));

// ============================================================================
// Support Ticket Routes (Auth required)
// ============================================================================

// GET: list customer's support tickets
router.get('/support/tickets', asyncHandler(supportController.listTickets));

// GET: create ticket form
router.get('/support/tickets/new', asyncHandler(supportController.createTicketForm));

// POST: submit new ticket
router.post('/support/tickets', asyncHandler(supportController.createTicketSubmit));

// GET: view single ticket
router.get('/support/tickets/:ticketId', asyncHandler(supportController.viewTicket));

// POST: add message to ticket
router.post('/support/tickets/:ticketId/messages', asyncHandler(supportController.addTicketMessage));

// POST: submit ticket feedback
router.post('/support/tickets/:ticketId/feedback', asyncHandler(supportController.submitTicketFeedback));

// ============================================================================
// GDPR Data Request Routes (Auth required)
// ============================================================================

// GET: list customer's GDPR data requests
router.get('/gdpr/requests', asyncHandler(gdprController.listRequests));

// GET: create data request form
router.get('/gdpr/requests/new', asyncHandler(gdprController.createRequestForm));

// POST: submit new data request
router.post('/gdpr/requests', asyncHandler(gdprController.createRequestSubmit));

// GET: view single data request
router.get('/gdpr/requests/:gdprDataRequestId', asyncHandler(gdprController.viewRequest));

// POST: cancel a data request
router.post('/gdpr/requests/:gdprDataRequestId/cancel', asyncHandler(gdprController.cancelRequest));

// ============================================================================
// Content Routes
// ============================================================================

// Public routes for content access
router.get('/pages', asyncHandler(getPublishedPages));
router.get('/pages/:slug', asyncHandler(getPublishedPageBySlug));
router.get('/types', asyncHandler(getActiveContentTypes));

export const storefrontCustomerRouter = router;
