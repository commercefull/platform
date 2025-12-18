import express from "express";
import { isMerchantLoggedIn } from "../../libs/auth";
import {
  getAdminDashboard,
  getAdminLogin,
  getAdminProfile
} from "./hubController";

// Import feature controllers
import * as productController from "./controllers/productController";
import * as orderController from "./controllers/orderController";
import * as customerController from "./controllers/customerController";

const router = express.Router();

// ============================================================================
// Public Routes (no auth required)
// ============================================================================

// GET: admin login page
router.get("/login", getAdminLogin);

// ============================================================================
// Protected Routes (merchant auth required)
// ============================================================================

// Apply authentication middleware to all routes below
router.use(isMerchantLoggedIn);

// GET: admin dashboard (home)
router.get("/", getAdminDashboard);

// GET: admin profile
router.get("/profile", getAdminProfile);

// ============================================================================
// Product Routes
// ============================================================================

router.get("/products", productController.listProducts);
router.get("/products/create", productController.createProductForm);
router.post("/products", productController.createProduct);
router.get("/products/:productId", productController.viewProduct);
router.get("/products/:productId/edit", productController.editProductForm);
router.post("/products/:productId", productController.updateProduct);  // Form POST (method override)
router.put("/products/:productId", productController.updateProduct);   // API PUT
router.delete("/products/:productId", productController.deleteProduct);
router.post("/products/:productId/status", productController.updateProductStatus);
router.post("/products/:productId/publish", productController.publishProduct);
router.post("/products/:productId/unpublish", productController.unpublishProduct);

// ============================================================================
// Order Routes
// ============================================================================

router.get("/orders", orderController.listOrders);
router.get("/orders/:orderId", orderController.viewOrder);
router.post("/orders/:orderId/status", orderController.updateOrderStatus);
router.post("/orders/:orderId/cancel", orderController.cancelOrder);
router.get("/orders/:orderId/refund", orderController.refundForm);
router.post("/orders/:orderId/refund", orderController.processRefund);

// ============================================================================
// Customer Routes
// ============================================================================

router.get("/customers", customerController.listCustomers);
router.get("/customers/:customerId", customerController.viewCustomer);
router.get("/customers/:customerId/edit", customerController.editCustomerForm);
router.post("/customers/:customerId", customerController.updateCustomer);  // Form POST
router.put("/customers/:customerId", customerController.updateCustomer);   // API PUT
router.post("/customers/:customerId/deactivate", customerController.deactivateCustomer);
router.post("/customers/:customerId/reactivate", customerController.reactivateCustomer);
router.post("/customers/:customerId/verify", customerController.verifyCustomer);
router.get("/customers/:customerId/addresses", customerController.customerAddresses);
router.post("/customers/:customerId/addresses", customerController.addCustomerAddress);

export const hubRouter = router;