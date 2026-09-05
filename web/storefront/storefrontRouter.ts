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
import { getCategoryProducts, getProduct, listProducts, searchProducts } from './controllers/productController';
import { addToBasket, clearBasket, removeFromBasket, updateBasketItem, viewBasket } from './controllers/basketController';
import { changePassword, profile, signIn, signInForm, signOut, signUp, signUpForm, updateProfile } from './controllers/authController';
import { checkout, orderConfirmation, processCheckout } from './controllers/checkoutController';
import { orderDetails, orderHistory, orderTracking } from './controllers/orderController';
import { getAllCategories, getCategoriesForNavigation, getCategoryDetails, getCategoryPage, loadCategoriesForNavigation } from './controllers/categoryController';
import { addToWishlist, removeFromWishlist, viewWishlist } from './controllers/wishlistController';
import { getProductReviews, markReviewHelpful, submitReview } from './controllers/reviewController';
import { addAddress, addAddressForm, deleteAddress, editAddressForm, listAddresses, updateAddress } from './controllers/addressController';
import { listReturns, returnRequestForm, submitReturnRequest, viewReturn } from './controllers/returnController';
import { loyaltyDashboard, pointsHistory, redeemReward } from './controllers/loyaltyController';
import { cancelSubscription, listPlans, mySubscriptions, viewSubscription } from './controllers/subscriptionController';
import { joinPlan, listPlans as listMembershipPlans, myMembership, viewPlan } from './controllers/membershipController';
import { deleteDevice, getDevices, getPreferences, listNotifications, markAllAsRead, markAsRead, registerDevice, updatePreferences } from './controllers/notificationController';
import { addTicketMessage, createTicketForm, createTicketSubmit, listTickets, submitTicketFeedback, viewTicket } from './controllers/supportController';
import { cancelRequest, createRequestForm, createRequestSubmit, listRequests, viewRequest } from './controllers/gdprController';
import { getStoreLocator } from './controllers/storeLocatorController';
import { getPromotionsPage } from './controllers/promotionsController';
import { isCustomerLoggedIn } from '../../libs/auth';

const router = express.Router();

// ============================================================================
// Category Navigation Middleware
// ============================================================================

// Load categories for navigation on all routes
router.use(loadCategoriesForNavigation);

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
router.get('/stores', asyncHandler(getStoreLocator));

// GET: promotions and coupons landing page
router.get('/promotions', asyncHandler(getPromotionsPage));

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
router.get('/products', asyncHandler(listProducts));

// GET: products by category
router.get('/products/category/:categorySlug', asyncHandler(getCategoryProducts));

// GET: product detail (PDP)
router.get('/products/:categorySlug/:productId', asyncHandler(getProduct));

// GET: search products
router.get('/search', asyncHandler(searchProducts));

// ============================================================================
// Category Routes
// ============================================================================

// GET: categories for navigation (API)
router.get('/api/categories/navigation', asyncHandler(getCategoriesForNavigation));

// GET: all categories (API)
router.get('/api/categories', asyncHandler(getAllCategories));

// GET: category details (API)
router.get('/api/categories/:categoryId', asyncHandler(getCategoryDetails));

// GET: category landing page
router.get('/categories/:categorySlug', asyncHandler(getCategoryPage));

// ============================================================================
// Basket/Cart Routes
// ============================================================================

// GET: view basket
router.get('/basket', asyncHandler(viewBasket));

// POST: add item to basket
router.post('/basket/add/:productId', asyncHandler(addToBasket));

// PUT: update basket item
router.put('/basket/item/:basketItemId', asyncHandler(updateBasketItem));

// DELETE: remove item from basket
router.delete('/basket/item/:basketItemId', asyncHandler(removeFromBasket));

// POST: clear basket
router.post('/basket/clear', asyncHandler(clearBasket));

// ============================================================================
// Authentication Routes
// ============================================================================

// GET: sign in form
router.get('/signin', asyncHandler(signInForm));

// POST: sign in process
router.post('/signin', asyncHandler(signIn));

// GET: sign up form
router.get('/signup', asyncHandler(signUpForm));

// POST: sign up process
router.post('/signup', asyncHandler(signUp));

// GET: user profile
router.get('/profile', asyncHandler(profile));

// POST: update profile
router.post('/profile', asyncHandler(updateProfile));

// POST: change password
router.post('/profile/change-password', asyncHandler(changePassword));

// POST: sign out
router.post('/signout', asyncHandler(signOut));

// ============================================================================
// Checkout Routes
// ============================================================================

// GET: checkout page
router.get('/checkout', asyncHandler(checkout));

// POST: process checkout
router.post('/checkout', asyncHandler(processCheckout));

// GET: order confirmation
router.get('/order-confirmation/:orderId', asyncHandler(orderConfirmation));

// ============================================================================
// Order Routes
// ============================================================================

// GET: order history
router.get('/orders', asyncHandler(orderHistory));

// GET: order details
router.get('/orders/:orderId', asyncHandler(orderDetails));

// GET: order tracking (public)
router.get('/track/:orderNumber', asyncHandler(orderTracking));

// ============================================================================
// Wishlist Routes
// ============================================================================

// GET: view wishlist
router.get('/wishlist', asyncHandler(viewWishlist));

// POST: add to wishlist
router.post('/wishlist/add/:productId', asyncHandler(addToWishlist));

// POST: remove from wishlist
router.post('/wishlist/remove/:productId', asyncHandler(removeFromWishlist));

// ============================================================================
// Review Routes
// ============================================================================

// GET: product reviews (API)
router.get('/api/reviews/:productId', asyncHandler(getProductReviews));

// POST: submit review
router.post('/reviews/:productId', asyncHandler(submitReview));

// POST: mark review helpful
router.post('/reviews/:reviewId/helpful', asyncHandler(markReviewHelpful));

// ============================================================================
// Address Routes
// ============================================================================

// GET: list addresses
router.get('/addresses', asyncHandler(listAddresses));

// GET: add address form
router.get('/addresses/add', asyncHandler(addAddressForm));

// POST: add address
router.post('/addresses', asyncHandler(addAddress));

// GET: edit address form
router.get('/addresses/:addressId/edit', asyncHandler(editAddressForm));

// POST: update address
router.post('/addresses/:addressId', asyncHandler(updateAddress));

// POST: delete address
router.post('/addresses/:addressId/delete', asyncHandler(deleteAddress));

// ============================================================================
// Return Routes
// ============================================================================

// GET: list returns
router.get('/returns', asyncHandler(listReturns));

// GET: return request form
router.get('/orders/:orderId/return', asyncHandler(returnRequestForm));

// POST: submit return request
router.post('/orders/:orderId/return', asyncHandler(submitReturnRequest));

// GET: view return details
router.get('/returns/:returnId', asyncHandler(viewReturn));

// ============================================================================
// Loyalty Routes
// ============================================================================

// GET: loyalty dashboard
router.get('/loyalty', asyncHandler(loyaltyDashboard));

// GET: points history
router.get('/loyalty/history', asyncHandler(pointsHistory));

// POST: redeem reward
router.post('/loyalty/redeem/:rewardId', asyncHandler(redeemReward));

// ============================================================================
// Subscription Routes
// ============================================================================

// GET: list subscription plans (public)
router.get('/subscriptions', asyncHandler(listPlans));

// GET: my subscriptions (auth required)
router.get('/subscriptions/my', asyncHandler(mySubscriptions));

// GET: view subscription detail
router.get('/subscriptions/:subscriptionId', asyncHandler(viewSubscription));

// POST: cancel subscription
router.post('/subscriptions/:subscriptionId/cancel', asyncHandler(cancelSubscription));

// ============================================================================
// Membership Routes
// ============================================================================

// GET: list membership plans (public)
router.get('/membership', asyncHandler(listMembershipPlans));

// GET: view plan detail
router.get('/membership/plans/:planId', asyncHandler(viewPlan));

// GET: my membership
router.get('/membership/my', asyncHandler(myMembership));

// POST: join a membership plan
router.post('/membership/join/:planId', asyncHandler(joinPlan));

// ============================================================================
// Notification Routes
// ============================================================================

// GET: list notifications
router.get('/notifications', asyncHandler(listNotifications));

// POST: mark notification as read
router.post('/notifications/:notificationId/read', asyncHandler(markAsRead));

// POST: mark all notifications as read
router.post('/notifications/read-all', asyncHandler(markAllAsRead));

// GET: notification preferences
router.get('/notifications/preferences', asyncHandler(getPreferences));

// POST: update notification preferences
router.post('/notifications/preferences', asyncHandler(updatePreferences));

// GET: push notification devices
router.get('/notifications/devices', isCustomerLoggedIn, asyncHandler(getDevices));

// POST: register a push notification device
router.post('/notifications/devices', isCustomerLoggedIn, asyncHandler(registerDevice));

// POST: delete a push notification device
router.post('/notifications/devices/:deviceToken/delete', isCustomerLoggedIn, asyncHandler(deleteDevice));

// ============================================================================
// Support Ticket Routes (Auth required)
// ============================================================================

// GET: list customer's support tickets
router.get('/support/tickets', asyncHandler(listTickets));

// GET: create ticket form
router.get('/support/tickets/new', asyncHandler(createTicketForm));

// POST: submit new ticket
router.post('/support/tickets', asyncHandler(createTicketSubmit));

// GET: view single ticket
router.get('/support/tickets/:ticketId', asyncHandler(viewTicket));

// POST: add message to ticket
router.post('/support/tickets/:ticketId/messages', asyncHandler(addTicketMessage));

// POST: submit ticket feedback
router.post('/support/tickets/:ticketId/feedback', asyncHandler(submitTicketFeedback));

// ============================================================================
// GDPR Data Request Routes (Auth required)
// ============================================================================

// GET: list customer's GDPR data requests
router.get('/gdpr/requests', asyncHandler(listRequests));

// GET: create data request form
router.get('/gdpr/requests/new', asyncHandler(createRequestForm));

// POST: submit new data request
router.post('/gdpr/requests', asyncHandler(createRequestSubmit));

// GET: view single data request
router.get('/gdpr/requests/:gdprDataRequestId', asyncHandler(viewRequest));

// POST: cancel a data request
router.post('/gdpr/requests/:gdprDataRequestId/cancel', asyncHandler(cancelRequest));

// ============================================================================
// Content Routes
// ============================================================================

// Public routes for content access
router.get('/pages', asyncHandler(getPublishedPages));
router.get('/pages/:slug', asyncHandler(getPublishedPageBySlug));
router.get('/types', asyncHandler(getActiveContentTypes));

export const storefrontCustomerRouter = router;
