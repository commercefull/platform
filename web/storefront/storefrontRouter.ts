import express from "express";
import { userContactUsValidationRules, validateContactUs } from "../../modules/content/validator";
import {
  getHomePage,
  getAboutUsPage,
  getShippingPolicyPage,
  getCareersPage,
  getContactUsPage,
  submitContactForm
} from "./controllers/pageCustomerController";
import { getActiveContentTypes, getPublishedPageBySlug, getPublishedPages } from "../../modules/content/controllers/contentCustomerController";

// Import new controllers
import * as productController from "./controllers/productController";
import * as basketController from "./controllers/basketController";
import * as authController from "./controllers/authController";
import * as checkoutController from "./controllers/checkoutController";
import * as orderController from "./controllers/orderController";

const router = express.Router();

// ============================================================================
// Page Routes
// ============================================================================

// GET: home page
router.get("/", getHomePage);

// GET: display about us page
router.get("/about-us", getAboutUsPage);

// GET: display shipping policy page
router.get("/shipping-policy", getShippingPolicyPage);

// GET: display careers page
router.get("/careers", getCareersPage);

// GET: display contact us page
router.get("/contact-us", getContactUsPage);

// POST: handle contact us form
router.post(
  "/contact-us",
  [userContactUsValidationRules, validateContactUs],
  submitContactForm
);

// ============================================================================
// Product Routes
// ============================================================================

// GET: all products (PLP)
router.get("/products", productController.listProducts);

// GET: products by category
router.get("/products/category/:categorySlug", productController.getCategoryProducts);

// GET: product detail (PDP)
router.get("/products/:categorySlug/:productId", productController.getProduct);

// GET: search products
router.get("/search", productController.searchProducts);

// ============================================================================
// Basket/Cart Routes
// ============================================================================

// GET: view basket
router.get("/basket", basketController.viewBasket);

// POST: add item to basket
router.post("/basket/add/:productId", basketController.addToBasket);

// PUT: update basket item
router.put("/basket/item/:basketItemId", basketController.updateBasketItem);

// DELETE: remove item from basket
router.delete("/basket/item/:basketItemId", basketController.removeFromBasket);

// POST: clear basket
router.post("/basket/clear", basketController.clearBasket);

// ============================================================================
// Authentication Routes
// ============================================================================

// GET: sign in form
router.get("/signin", authController.signInForm);

// POST: sign in process
router.post("/signin", authController.signIn);

// GET: sign up form
router.get("/signup", authController.signUpForm);

// POST: sign up process
router.post("/signup", authController.signUp);

// GET: user profile
router.get("/profile", authController.profile);

// POST: update profile
router.post("/profile", authController.updateProfile);

// POST: change password
router.post("/profile/change-password", authController.changePassword);

// POST: sign out
router.post("/signout", authController.signOut);

// ============================================================================
// Checkout Routes
// ============================================================================

// GET: checkout page
router.get("/checkout", checkoutController.checkout);

// POST: process checkout
router.post("/checkout", checkoutController.processCheckout);

// GET: order confirmation
router.get("/order-confirmation/:orderId", checkoutController.orderConfirmation);

// ============================================================================
// Order Routes
// ============================================================================

// GET: order history
router.get("/orders", orderController.orderHistory);

// GET: order details
router.get("/orders/:orderId", orderController.orderDetails);

// GET: order tracking (public)
router.get("/track/:orderNumber", orderController.orderTracking);

// ============================================================================
// Content Routes
// ============================================================================

// Public routes for content access
router.get("/pages", getPublishedPages);
router.get("/pages/:slug", getPublishedPageBySlug);
router.get("/types", getActiveContentTypes);

export const storefrontCustomerRouter = router;
