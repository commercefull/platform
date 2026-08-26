import express from 'express';
import { asyncHandler } from '../../libs/asyncHandler';
import { isAdminLoggedIn } from '../../libs/auth';
import { getAdminDashboard, getAdminLogin, getAdminProfile, postAdminLogin, postAdminLogout } from './controllers/adminController';

// Import feature controllers
import * as productController from './controllers/productController';
import * as orderController from './controllers/orderController';
import * as customerController from './controllers/customerController';
import * as promotionController from './controllers/promotionController';
import * as paymentController from './controllers/paymentController';
import * as shippingController from './controllers/shippingController';
import * as contentController from './controllers/contentController';
import * as couponController from './controllers/couponController';
import * as giftCardController from './controllers/giftCardController';
import * as shippingZoneController from './controllers/shippingZoneController';
import * as shippingRateController from './controllers/shippingRateController';
import * as notificationController from './controllers/notificationController';
import * as seoController from './controllers/seoController';
import * as contentBlocksController from './controllers/contentBlocksController';
import * as pageBuilderController from './controllers/pageBuilderController';
import * as themeController from './controllers/themeController';
import * as warehouseController from './controllers/warehouseController';
import * as basketController from './controllers/basketController';
import * as fulfillmentController from './controllers/fulfillmentController';
import * as supplierController from './controllers/supplierController';
import * as membershipController from './controllers/membershipController';
import * as subscriptionController from './controllers/subscriptionController';
import * as loyaltyController from './controllers/loyaltyController';
import * as analyticsController from './controllers/analyticsController';
import * as usersController from './controllers/usersController';
import * as settingsController from './controllers/settingsController';
import * as inventoryController from './controllers/inventoryController';
import * as taxController from './controllers/taxController';
import * as programsController from './controllers/programsController';
import * as operationsController from './controllers/operationsController';
import * as gdprController from './controllers/gdprController';
import * as supportController from './controllers/supportController';
import * as assortmentController from './controllers/assortmentController';
import * as pricingController from './controllers/pricingController';
import * as localizationController from './controllers/localizationController';
import * as organizationController from './controllers/organizationController';
import * as mediaController from './controllers/mediaController';
import * as checkoutController from './controllers/checkoutController';
import * as storeController from './controllers/storeController';
import * as reportingController from './controllers/reportingController';
import * as automationController from './controllers/automationController';
import * as returnsController from './controllers/returnsController';
import * as integrationController from './controllers/integrationController';

const router = express.Router();

// ============================================================================
// Public Routes (no auth required)
// ============================================================================

// GET: admin login page
router.get('/login', asyncHandler(getAdminLogin));

// POST: admin login form submission
router.post('/login', asyncHandler(postAdminLogin));

// POST: admin logout
router.post('/logout', asyncHandler(postAdminLogout));

// ============================================================================
// Protected Routes (admin auth required)
// ============================================================================

// Apply authentication middleware to all routes below
router.use(isAdminLoggedIn);

// GET: admin dashboard (home)
router.get('/', asyncHandler(getAdminDashboard));

// GET: admin profile
router.get('/profile', asyncHandler(getAdminProfile));

// ============================================================================
// Catalog - Categories Routes
// ============================================================================

router.get('/catalog/categories', asyncHandler(assortmentController.listCategories));
router.get('/catalog/categories/create', asyncHandler(assortmentController.createCategoryForm));
router.post('/catalog/categories', asyncHandler(assortmentController.createCategory));
router.get('/catalog/categories/:categoryId', asyncHandler(assortmentController.viewCategory));
router.get('/catalog/categories/:categoryId/edit', asyncHandler(assortmentController.editCategoryForm));
router.post('/catalog/categories/:categoryId', asyncHandler(assortmentController.updateCategory));
router.put('/catalog/categories/:categoryId', asyncHandler(assortmentController.updateCategory));
router.delete('/catalog/categories/:categoryId', asyncHandler(assortmentController.deleteCategory));
router.post('/catalog/categories/reorder', asyncHandler(assortmentController.reorderCategories));

// ============================================================================
// Catalog - Collections Routes
// ============================================================================

router.get('/catalog/collections', asyncHandler(assortmentController.listCollections));
router.get('/catalog/collections/create', asyncHandler(assortmentController.createCollectionForm));
router.post('/catalog/collections', asyncHandler(assortmentController.createCollection));
router.get('/catalog/collections/:collectionId', asyncHandler(assortmentController.viewCollection));
router.get('/catalog/collections/:collectionId/edit', asyncHandler(assortmentController.editCollectionForm));
router.post('/catalog/collections/:collectionId', asyncHandler(assortmentController.updateCollection));
router.put('/catalog/collections/:collectionId', asyncHandler(assortmentController.updateCollection));
router.delete('/catalog/collections/:collectionId', asyncHandler(assortmentController.deleteCollection));

// ============================================================================
// Catalog - Pricing Routes
// ============================================================================

router.get('/catalog/pricing', asyncHandler(pricingController.listPriceLists));
router.get('/catalog/pricing/lists/create', asyncHandler(pricingController.createPriceListForm));
router.post('/catalog/pricing/lists', asyncHandler(pricingController.createPriceList));
router.get('/catalog/pricing/lists/:listId', asyncHandler(pricingController.viewPriceList));
router.get('/catalog/pricing/lists/:listId/edit', asyncHandler(pricingController.editPriceListForm));
router.post('/catalog/pricing/lists/:listId', asyncHandler(pricingController.updatePriceList));
router.put('/catalog/pricing/lists/:listId', asyncHandler(pricingController.updatePriceList));
router.delete('/catalog/pricing/lists/:listId', asyncHandler(pricingController.deletePriceList));

router.get('/catalog/pricing/rules', asyncHandler(pricingController.listPriceRules));
router.get('/catalog/pricing/rules/create', asyncHandler(pricingController.createPriceRuleForm));
router.post('/catalog/pricing/rules', asyncHandler(pricingController.createPriceRule));
router.get('/catalog/pricing/rules/:ruleId', asyncHandler(pricingController.viewPriceRule));
router.get('/catalog/pricing/rules/:ruleId/edit', asyncHandler(pricingController.editPriceRuleForm));
router.post('/catalog/pricing/rules/:ruleId', asyncHandler(pricingController.updatePriceRule));
router.put('/catalog/pricing/rules/:ruleId', asyncHandler(pricingController.updatePriceRule));
router.delete('/catalog/pricing/rules/:ruleId', asyncHandler(pricingController.deletePriceRule));

// ============================================================================
// Product Routes
// ============================================================================

router.get('/products', asyncHandler(productController.listProducts));
router.get('/products/create', asyncHandler(productController.createProductForm));
router.post('/products', asyncHandler(productController.createProduct));

// Product Categories (standalone productCategory records)
router.get('/products/categories', asyncHandler(productController.listProductCategories));
router.get('/products/categories/create', asyncHandler(productController.createProductCategoryForm));
router.post('/products/categories', asyncHandler(productController.createProductCategory));
router.get('/products/categories/:categoryId/edit', asyncHandler(productController.editProductCategoryForm));
router.post('/products/categories/:categoryId', asyncHandler(productController.updateProductCategory));
router.delete('/products/categories/:categoryId', asyncHandler(productController.deleteProductCategory));

// Product Tags
router.get('/products/tags', asyncHandler(productController.listProductTags));
router.post('/products/tags', asyncHandler(productController.createProductTag));
router.delete('/products/tags/:tagId', asyncHandler(productController.deleteProductTag));

// Product Collections
router.get('/products/collections', asyncHandler(productController.listProductCollections));
router.get('/products/collections/create', asyncHandler(productController.createProductCollectionForm));
router.post('/products/collections', asyncHandler(productController.createProductCollection));
router.get('/products/collections/:collectionId/edit', asyncHandler(productController.editProductCollectionForm));
router.post('/products/collections/:collectionId', asyncHandler(productController.updateProductCollection));
router.delete('/products/collections/:collectionId', asyncHandler(productController.deleteProductCollection));

router.get('/products/:productId', asyncHandler(productController.viewProduct));
router.get('/products/:productId/edit', asyncHandler(productController.editProductForm));
router.post('/products/:productId', asyncHandler(productController.updateProduct)); // Form POST (method override)
router.put('/products/:productId', asyncHandler(productController.updateProduct)); // API PUT
router.delete('/products/:productId', asyncHandler(productController.deleteProduct));
router.post('/products/:productId/status', asyncHandler(productController.updateProductStatus));
router.post('/products/:productId/publish', asyncHandler(productController.publishProduct));
router.post('/products/:productId/unpublish', asyncHandler(productController.unpublishProduct));

// Product Q&A
router.get('/products/:productId/qa', asyncHandler(productController.listProductQa));
router.post('/products/:productId/qa/:qaId/status', asyncHandler(productController.updateQaStatus));

// Product Review Media
router.get('/products/:productId/reviews/media', asyncHandler(productController.listReviewMedia));
router.delete('/products/:productId/reviews/media/:mediaId', asyncHandler(productController.deleteReviewMedia));

// Product Prices
router.get('/products/:productId/prices', asyncHandler(productController.listProductPrices));
router.post('/products/:productId/prices', asyncHandler(productController.upsertProductPrice));

// ============================================================================
// Order Routes
// ============================================================================

router.get('/orders', asyncHandler(orderController.listOrders));
router.get('/orders/:orderId', asyncHandler(orderController.viewOrder));
router.post('/orders/:orderId/status', asyncHandler(orderController.updateOrderStatus));
router.post('/orders/:orderId/cancel', asyncHandler(orderController.cancelOrder));
router.get('/orders/:orderId/refund', asyncHandler(orderController.refundForm));
router.post('/orders/:orderId/refund', asyncHandler(orderController.processRefund));

// Order sub-sections (notes, refunds, packages)
router.get('/orders/:orderId/notes', asyncHandler(orderController.listOrderNotes));
router.post('/orders/:orderId/notes', asyncHandler(orderController.addOrderNote));
router.post('/orders/:orderId/notes/:noteId/delete', asyncHandler(orderController.deleteOrderNote));
router.get('/orders/:orderId/refunds', asyncHandler(orderController.listOrderRefunds));
router.get('/orders/:orderId/packages', asyncHandler(orderController.listFulfillmentPackages));
router.post('/orders/:orderId/packages/:packageId/tracking', asyncHandler(orderController.updatePackageTracking));

// ============================================================================
// Store Routes
// ============================================================================

router.get('/stores', asyncHandler(storeController.listStores));
router.get('/stores/create', asyncHandler(storeController.createStoreForm));
router.post('/stores', asyncHandler(storeController.createStore));
router.get('/stores/:storeId', asyncHandler(storeController.viewStore));
router.get('/stores/:storeId/edit', asyncHandler(storeController.editStoreForm));
router.post('/stores/:storeId', asyncHandler(storeController.updateStore));
router.get('/stores/:storeId/users', asyncHandler(storeController.manageStoreUsers));
router.post('/stores/:storeId/users', asyncHandler(storeController.assignUserToStore));
router.delete('/stores/:storeId/users/:userId', asyncHandler(storeController.removeUserFromStore));

// ============================================================================
// Organization Routes
// ============================================================================

router.get('/organizations', asyncHandler(organizationController.listOrganizations));
router.get('/organizations/create', asyncHandler(organizationController.createOrganizationForm));
router.post('/organizations', asyncHandler(organizationController.createOrganization));
router.get('/organizations/:organizationId', asyncHandler(organizationController.viewOrganization));
router.get('/organizations/:organizationId/edit', asyncHandler(organizationController.editOrganizationForm));
router.post('/organizations/:organizationId', asyncHandler(organizationController.updateOrganization));
router.delete('/organizations/:organizationId', asyncHandler(organizationController.deleteOrganization));

// ============================================================================
// Reporting Routes
// ============================================================================

router.get('/reporting', asyncHandler(reportingController.reportingDashboard));
router.post('/reporting/generate', asyncHandler(reportingController.generateReport));
router.get('/reporting/schedules', asyncHandler(reportingController.listSchedules));
router.get('/reporting/schedules/create', asyncHandler(reportingController.createScheduleForm));
router.post('/reporting/schedules', asyncHandler(reportingController.createSchedule));
router.get('/reporting/schedules/:scheduleId', asyncHandler(reportingController.viewSchedule));
router.get('/reporting/schedules/:scheduleId/edit', asyncHandler(reportingController.editScheduleForm));
router.post('/reporting/schedules/:scheduleId', asyncHandler(reportingController.updateSchedule));
router.delete('/reporting/schedules/:scheduleId', asyncHandler(reportingController.deleteSchedule));

// ============================================================================
// Customer Routes
// ============================================================================

router.get('/customers', asyncHandler(customerController.listCustomers));
router.get('/customers/:customerId', asyncHandler(customerController.viewCustomer));
router.get('/customers/:customerId/edit', asyncHandler(customerController.editCustomerForm));
router.post('/customers/:customerId', asyncHandler(customerController.updateCustomer)); // Form POST
router.put('/customers/:customerId', asyncHandler(customerController.updateCustomer)); // API PUT
router.post('/customers/:customerId/deactivate', asyncHandler(customerController.deactivateCustomer));
router.post('/customers/:customerId/reactivate', asyncHandler(customerController.reactivateCustomer));
router.post('/customers/:customerId/verify', asyncHandler(customerController.verifyCustomer));
router.get('/customers/:customerId/addresses', asyncHandler(customerController.customerAddresses));
router.post('/customers/:customerId/addresses', asyncHandler(customerController.addCustomerAddress));

// ============================================================================
// Inventory Routes
// ============================================================================

router.get('/inventory', asyncHandler(inventoryController.listInventory));
router.post('/inventory/adjust', asyncHandler(inventoryController.adjustStock));
router.get('/inventory/locations', asyncHandler(inventoryController.listLocations));
router.get('/inventory/low-stock', asyncHandler(inventoryController.lowStockReport));
router.get('/inventory/:inventoryLevelId/history', asyncHandler(inventoryController.viewInventoryHistory));
router.get('/dispatches', asyncHandler(inventoryController.listDispatches));
router.get('/dispatches/create', asyncHandler(inventoryController.createDispatchForm));
router.post('/dispatches', asyncHandler(inventoryController.createDispatch));
router.get('/dispatches/:dispatchId', asyncHandler(inventoryController.viewDispatch));
router.post('/dispatches/:dispatchId/approve', asyncHandler(inventoryController.approveDispatch));
router.post('/dispatches/:dispatchId/dispatch', asyncHandler(inventoryController.markDispatched));
router.post('/dispatches/:dispatchId/receive', asyncHandler(inventoryController.receiveDispatch));
router.post('/dispatches/:dispatchId/cancel', asyncHandler(inventoryController.cancelDispatch));

// ============================================================================
// Tax Routes
// ============================================================================

router.get('/tax', asyncHandler(taxController.listTaxSettings));
router.post('/tax/rates', asyncHandler(taxController.createTaxRate));
router.put('/tax/rates/:taxRateId', asyncHandler(taxController.updateTaxRate));
router.delete('/tax/rates/:taxRateId', asyncHandler(taxController.deleteTaxRate));
router.post('/tax/zones', asyncHandler(taxController.createTaxZone));
router.put('/tax/zones/:taxZoneId', asyncHandler(taxController.updateTaxZone));
router.delete('/tax/zones/:taxZoneId', asyncHandler(taxController.deleteTaxZone));
router.post('/tax/classes', asyncHandler(taxController.createTaxClass));
router.put('/tax/classes/:taxClassId', asyncHandler(taxController.updateTaxClass));
router.delete('/tax/classes/:taxClassId', asyncHandler(taxController.deleteTaxClass));

// ============================================================================
// Programs Dashboard Routes
// ============================================================================

router.get('/programs/membership', asyncHandler(programsController.membershipDashboard));
router.get('/programs/subscription', asyncHandler(programsController.subscriptionDashboard));
router.get('/programs/loyalty', asyncHandler(programsController.loyaltyDashboard));

// ============================================================================
// Operations Dashboard
// ============================================================================

router.get('/operations', asyncHandler(operationsController.operationsDashboard));

// ============================================================================
// GDPR Compliance
// ============================================================================

router.get('/gdpr', asyncHandler(gdprController.gdprDashboard));
router.post('/gdpr/requests', asyncHandler(gdprController.createGdprRequest));
router.get('/gdpr/requests/:requestId', asyncHandler(gdprController.viewGdprRequest));
router.post('/gdpr/requests/:requestId/process', asyncHandler(gdprController.processGdprRequest));
router.post('/gdpr/requests/:requestId/complete', asyncHandler(gdprController.completeGdprRequest));
router.get('/gdpr/consent', asyncHandler(gdprController.consentManagement));

// ============================================================================
// Support Center
// ============================================================================

router.get('/support', asyncHandler(supportController.supportDashboard));
router.get('/support/tickets', asyncHandler(supportController.listSupportTickets));
router.get('/support/tickets/:ticketId', asyncHandler(supportController.viewSupportTicket));
router.post('/support/tickets/:ticketId/status', asyncHandler(supportController.updateTicketStatus));
router.get('/support/faqs', asyncHandler(supportController.listFaqs));
router.post('/support/faqs', asyncHandler(supportController.createFaq));
router.put('/support/faqs/:faqId', asyncHandler(supportController.updateFaq));
router.delete('/support/faqs/:faqId', asyncHandler(supportController.deleteFaq));

// ============================================================================
// Promotion Routes
// ============================================================================

router.get('/promotions', asyncHandler(promotionController.listPromotions));
router.get('/promotions/create', asyncHandler(promotionController.createPromotionForm));
router.post('/promotions', asyncHandler(promotionController.createPromotion));
router.get('/promotions/:promotionId', asyncHandler(promotionController.viewPromotion));
router.get('/promotions/:promotionId/edit', asyncHandler(promotionController.editPromotionForm));
router.post('/promotions/:promotionId', asyncHandler(promotionController.updatePromotion)); // Form POST
router.put('/promotions/:promotionId', asyncHandler(promotionController.updatePromotion)); // API PUT
router.delete('/promotions/:promotionId', asyncHandler(promotionController.deletePromotion));

// ============================================================================
// Coupon Routes
// ============================================================================

router.get('/promotions/coupons', asyncHandler(couponController.listCoupons));
router.get('/promotions/coupons/create', asyncHandler(couponController.createCouponForm));
router.post('/promotions/coupons', asyncHandler(couponController.createCoupon));
router.get('/promotions/coupons/:couponId', asyncHandler(couponController.viewCoupon));
router.get('/promotions/coupons/:couponId/edit', asyncHandler(couponController.editCouponForm));
router.post('/promotions/coupons/:couponId', asyncHandler(couponController.updateCoupon));
router.delete('/promotions/coupons/:couponId', asyncHandler(couponController.deleteCoupon));
router.post('/promotions/coupons/validate', asyncHandler(couponController.validateCoupon));

// ============================================================================
// Gift Card Routes
// ============================================================================

router.get('/promotions/gift-cards', asyncHandler(giftCardController.listGiftCards));
router.get('/promotions/gift-cards/create', asyncHandler(giftCardController.createGiftCardForm));
router.post('/promotions/gift-cards', asyncHandler(giftCardController.createGiftCard));
router.get('/promotions/gift-cards/:giftCardId', asyncHandler(giftCardController.viewGiftCard));
router.get('/promotions/gift-cards/:giftCardId/edit', asyncHandler(giftCardController.editGiftCardForm));
router.post('/promotions/gift-cards/:giftCardId/activate', asyncHandler(giftCardController.activateGiftCardAction));
router.post('/promotions/gift-cards/:giftCardId/assign', asyncHandler(giftCardController.assignGiftCardAction));
router.post('/promotions/gift-cards/:giftCardId/reload', asyncHandler(giftCardController.reloadGiftCardAction));
router.post('/promotions/gift-cards/:giftCardId/refund', asyncHandler(giftCardController.refundToGiftCardAction));
router.post('/promotions/gift-cards/:giftCardId/cancel', asyncHandler(giftCardController.cancelGiftCardAction));
router.get('/promotions/gift-cards/balance/:code', asyncHandler(giftCardController.checkGiftCardBalance));

// ============================================================================
// Payment Routes
// ============================================================================

router.get('/payments', asyncHandler(paymentController.listPaymentGateways));
router.get('/payments/gateways', asyncHandler(paymentController.listPaymentGateways));
router.get('/payments/gateways/create', asyncHandler(paymentController.createPaymentGatewayForm));
router.post('/payments/gateways', asyncHandler(paymentController.createPaymentGateway));
router.get('/payments/gateways/:gatewayId', asyncHandler(paymentController.viewPaymentGateway));
router.get('/payments/gateways/:gatewayId/edit', asyncHandler(paymentController.editPaymentGatewayForm));
router.post('/payments/gateways/:gatewayId', asyncHandler(paymentController.updatePaymentGateway));
router.delete('/payments/gateways/:gatewayId', asyncHandler(paymentController.deletePaymentGateway));

router.get('/payments/methods', asyncHandler(paymentController.listPaymentMethods));
router.get('/payments/transactions', asyncHandler(paymentController.listPaymentTransactions));

// Payment Disputes
router.get('/payments/disputes', asyncHandler(paymentController.listDisputes));
router.get('/payments/disputes/:disputeId', asyncHandler(paymentController.viewDispute));
router.post('/payments/disputes/:disputeId/status', asyncHandler(paymentController.updateDisputeStatus));

// Payment Fees
router.get('/payments/fees', asyncHandler(paymentController.listPaymentFees));

// Payment Settings
router.get('/payments/settings', asyncHandler(paymentController.listPaymentSettings));
router.post('/payments/settings/:organizationId', asyncHandler(paymentController.updatePaymentSettings));

// Payment Balance
router.get('/payments/balance', asyncHandler(paymentController.viewPaymentBalance));

// Payment Reports
router.get('/payments/reports', asyncHandler(paymentController.listPaymentReports));
router.get('/payments/reports/:reportId', asyncHandler(paymentController.viewPaymentReport));

// ============================================================================
// Shipping Routes
// ============================================================================

// Shipping overview - redirect to methods
router.get('/shipping', asyncHandler(shippingController.listShippingMethods));
router.get('/shipping/methods/create', asyncHandler(shippingController.createShippingMethodForm));
router.post('/shipping/methods', asyncHandler(shippingController.createShippingMethod));
router.get('/shipping/methods/:methodId', asyncHandler(shippingController.viewShippingMethod));
router.get('/shipping/methods/:methodId/edit', asyncHandler(shippingController.editShippingMethodForm));
router.post('/shipping/methods/:methodId', asyncHandler(shippingController.updateShippingMethod));
router.delete('/shipping/methods/:methodId', asyncHandler(shippingController.deleteShippingMethod));
router.post('/shipping/methods/:methodId/activate', asyncHandler(shippingController.activateShippingMethod));
router.post('/shipping/methods/:methodId/deactivate', asyncHandler(shippingController.deactivateShippingMethod));

// ============================================================================
// Shipping Zones Routes
// ============================================================================

router.get('/shipping/zones', asyncHandler(shippingZoneController.listShippingZones));
router.get('/shipping/zones/create', asyncHandler(shippingZoneController.createShippingZoneForm));
router.post('/shipping/zones', asyncHandler(shippingZoneController.createShippingZone));
router.get('/shipping/zones/:zoneId', asyncHandler(shippingZoneController.viewShippingZone));
router.get('/shipping/zones/:zoneId/edit', asyncHandler(shippingZoneController.editShippingZoneForm));
router.post('/shipping/zones/:zoneId', asyncHandler(shippingZoneController.updateShippingZone));
router.post('/shipping/zones/:zoneId/activate', asyncHandler(shippingZoneController.activateShippingZone));
router.post('/shipping/zones/:zoneId/deactivate', asyncHandler(shippingZoneController.deactivateShippingZone));
router.delete('/shipping/zones/:zoneId', asyncHandler(shippingZoneController.deleteShippingZone));

// ============================================================================
// Shipping Rates Routes
// ============================================================================

router.get('/shipping/rates', asyncHandler(shippingRateController.listShippingRates));
router.get('/shipping/rates/create', asyncHandler(shippingRateController.createShippingRateForm));
router.post('/shipping/rates', asyncHandler(shippingRateController.createShippingRate));
router.get('/shipping/rates/:rateId', asyncHandler(shippingRateController.viewShippingRate));
router.get('/shipping/rates/:rateId/edit', asyncHandler(shippingRateController.editShippingRateForm));
router.post('/shipping/rates/:rateId', asyncHandler(shippingRateController.updateShippingRate));
router.post('/shipping/rates/:rateId/activate', asyncHandler(shippingRateController.activateShippingRate));
router.post('/shipping/rates/:rateId/deactivate', asyncHandler(shippingRateController.deactivateShippingRate));
router.delete('/shipping/rates/:rateId', asyncHandler(shippingRateController.deleteShippingRate));
router.post('/shipping/rates/calculate', asyncHandler(shippingRateController.calculateShippingRate));

router.get('/content/pages', asyncHandler(contentController.listContentPages));
router.get('/content/pages/create', asyncHandler(contentController.createContentPageForm));
router.post('/content/pages', asyncHandler(contentController.createContentPage));
router.get('/content/pages/:pageId', asyncHandler(contentController.viewContentPage));
router.get('/content/pages/:pageId/edit', asyncHandler(contentController.editContentPageForm));
router.post('/content/pages/:pageId', asyncHandler(contentController.updateContentPage));
router.post('/content/pages/:pageId/publish', asyncHandler(contentController.publishContentPage));
router.delete('/content/pages/:pageId', asyncHandler(contentController.deleteContentPage));

router.get('/content/templates', asyncHandler(contentController.listContentTemplates));
router.get('/content/media', asyncHandler(contentController.listContentMedia));

// ============================================================================
// SEO Routes
// ============================================================================

router.get('/marketing/seo', asyncHandler(seoController.listSEOSettings));
router.post('/marketing/seo', asyncHandler(seoController.updateSEOSettings));
router.get('/marketing/seo/robots.txt', asyncHandler(seoController.generateRobotsTxt));
router.get('/marketing/seo/sitemap.xml', asyncHandler(seoController.generateSitemap));

// ============================================================================
// Notification Routes
// ============================================================================

router.get('/notifications/templates', asyncHandler(notificationController.listNotificationTemplates));
router.get('/notifications/templates/create', asyncHandler(notificationController.createNotificationTemplateForm));
router.post('/notifications/templates', asyncHandler(notificationController.createNotificationTemplate));
router.get('/notifications/templates/:templateId', asyncHandler(notificationController.viewNotificationTemplate));
router.get('/notifications/templates/:templateId/edit', asyncHandler(notificationController.editNotificationTemplateForm));
router.post('/notifications/templates/:templateId', asyncHandler(notificationController.updateNotificationTemplate));
router.post('/notifications/templates/:templateId/activate', asyncHandler(notificationController.activateNotificationTemplate));
router.post('/notifications/templates/:templateId/deactivate', asyncHandler(notificationController.deactivateNotificationTemplate));
router.delete('/notifications/templates/:templateId', asyncHandler(notificationController.deleteNotificationTemplate));
router.post('/notifications/templates/:templateId/clone', asyncHandler(notificationController.cloneNotificationTemplate));
router.post('/notifications/templates/:templateId/preview', asyncHandler(notificationController.previewNotificationTemplate));
router.get('/notifications/templates/:templateId/translations', asyncHandler(notificationController.listTemplateTranslations));
router.get('/notifications/batches', asyncHandler(notificationController.listBatches));
router.get('/notifications/batches/:batchId', asyncHandler(notificationController.viewBatch));
router.get('/notifications/webhooks', asyncHandler(notificationController.listWebhooks));
router.get('/notifications/webhooks/create', asyncHandler(notificationController.createWebhookForm));
router.post('/notifications/webhooks', asyncHandler(notificationController.createWebhook));
router.post('/notifications/webhooks/:webhookId/deactivate', asyncHandler(notificationController.deactivateWebhook));

// ============================================================================
// Content Blocks Routes
// ============================================================================

router.get('/content/blocks', asyncHandler(contentBlocksController.listContentBlocks));
router.get('/content/blocks/create', asyncHandler(contentBlocksController.createContentBlockForm));
router.post('/content/blocks', asyncHandler(contentBlocksController.createContentBlock));
router.get('/content/blocks/:blockId/edit', asyncHandler(contentBlocksController.editContentBlockForm));
router.post('/content/blocks/:blockId', asyncHandler(contentBlocksController.updateContentBlock));
router.delete('/content/blocks/:blockId', asyncHandler(contentBlocksController.deleteContentBlock));
router.post('/content/pages/:pageId/reorder-blocks', asyncHandler(contentBlocksController.reorderContentBlocks));

// ============================================================================
// Operations Routes
// ============================================================================

// Warehouse Operations
router.get('/warehouses', asyncHandler(warehouseController.listWarehouses));
router.get('/warehouses/create', asyncHandler(warehouseController.createWarehouseForm));
router.post('/warehouses', asyncHandler(warehouseController.createWarehouse));
router.get('/warehouses/:warehouseId', asyncHandler(warehouseController.viewWarehouse));
router.get('/warehouses/:warehouseId/edit', asyncHandler(warehouseController.editWarehouseForm));
router.post('/warehouses/:warehouseId', asyncHandler(warehouseController.updateWarehouse));
router.post('/warehouses/:warehouseId/activate', asyncHandler(warehouseController.activateWarehouse));
router.post('/warehouses/:warehouseId/deactivate', asyncHandler(warehouseController.deactivateWarehouse));
router.delete('/warehouses/:warehouseId', asyncHandler(warehouseController.deleteWarehouse));

// Order Fulfillments
router.get('/fulfillments', asyncHandler(fulfillmentController.listFulfillments));
router.get('/fulfillments/:fulfillmentId', asyncHandler(fulfillmentController.viewFulfillment));
router.post('/fulfillments/:fulfillmentId/status', asyncHandler(fulfillmentController.updateFulfillmentStatus));
router.post('/fulfillments/:fulfillmentId/shipped', asyncHandler(fulfillmentController.markAsShipped));
router.post('/fulfillments/:fulfillmentId/delivered', asyncHandler(fulfillmentController.markAsDelivered));
router.post('/fulfillments/:fulfillmentId/cancel', asyncHandler(fulfillmentController.cancelFulfillment));
router.get('/fulfillments/stats', asyncHandler(fulfillmentController.getFulfillmentStats));

// Supplier Management
router.get('/suppliers', asyncHandler(supplierController.listSuppliers));
router.get('/suppliers/create', asyncHandler(supplierController.createSupplierForm));
router.post('/suppliers', asyncHandler(supplierController.createSupplier));
router.get('/suppliers/:supplierId', asyncHandler(supplierController.viewSupplier));
router.get('/suppliers/:supplierId/edit', asyncHandler(supplierController.editSupplierForm));
router.post('/suppliers/:supplierId', asyncHandler(supplierController.updateSupplier));
router.post('/suppliers/:supplierId/approve', asyncHandler(supplierController.approveSupplier));
router.post('/suppliers/:supplierId/suspend', asyncHandler(supplierController.suspendSupplier));
router.post('/suppliers/:supplierId/activate', asyncHandler(supplierController.activateSupplier));
router.post('/suppliers/:supplierId/deactivate', asyncHandler(supplierController.deactivateSupplier));
router.delete('/suppliers/:supplierId', asyncHandler(supplierController.deleteSupplier));

// Cart Analytics
router.get('/baskets/abandoned', asyncHandler(basketController.listAbandonedCarts));
router.get('/baskets/abandoned/:basketId', asyncHandler(basketController.viewAbandonedCart));
router.post('/baskets/abandoned/:basketId/recover', asyncHandler(basketController.recoverAbandonedCart));
router.post('/baskets/abandoned/:basketId/email', asyncHandler(basketController.sendRecoveryEmail));
router.post('/baskets/abandoned/:basketId/recovered', asyncHandler(basketController.markCartRecovered));
router.post('/baskets/cleanup-expired', asyncHandler(basketController.cleanupExpiredBaskets));
router.get('/baskets/analytics', asyncHandler(basketController.basketAnalytics));

// Warehouse Dashboard
router.get('/operations/dashboard', asyncHandler(fulfillmentController.warehouseDashboard));

// ============================================================================
// Customer Programs Routes
// ============================================================================

// Membership Plans
router.get('/membership/plans', asyncHandler(membershipController.listMembershipPlans));
router.get('/membership/plans/create', asyncHandler(membershipController.createMembershipPlanForm));
router.post('/membership/plans', asyncHandler(membershipController.createMembershipPlan));
router.get('/membership/plans/:planId', asyncHandler(membershipController.viewMembershipPlan));
router.get('/membership/plans/:planId/edit', asyncHandler(membershipController.editMembershipPlanForm));
router.post('/membership/plans/:planId', asyncHandler(membershipController.updateMembershipPlan));
router.post('/membership/plans/:planId/activate', asyncHandler(membershipController.activateMembershipPlan));
router.post('/membership/plans/:planId/deactivate', asyncHandler(membershipController.deactivateMembershipPlan));
router.delete('/membership/plans/:planId', asyncHandler(membershipController.deleteMembershipPlan));

// Membership Benefits
router.get('/membership/benefits', asyncHandler(membershipController.listMembershipBenefits));

// Memberships (User memberships)
router.get('/membership/memberships', asyncHandler(membershipController.listMemberships));

// Membership Advanced Operations
router.post('/membership/bulk-operations', asyncHandler(membershipController.bulkMembershipOperations));
router.post('/membership/memberships/:membershipId/change-tier', asyncHandler(membershipController.membershipUpgradeDowngrade));
router.get('/membership/analytics', asyncHandler(membershipController.membershipAnalytics));

// Subscription Plans
router.get('/subscription/plans', asyncHandler(subscriptionController.listSubscriptionPlans));
router.get('/subscription/plans/create', asyncHandler(subscriptionController.createSubscriptionPlanForm));
router.post('/subscription/plans', asyncHandler(subscriptionController.createSubscriptionPlan));
router.get('/subscription/plans/:planId', asyncHandler(subscriptionController.viewSubscriptionPlan));
router.get('/subscription/plans/:planId/edit', asyncHandler(subscriptionController.editSubscriptionPlanForm));
router.post('/subscription/plans/:planId', asyncHandler(subscriptionController.updateSubscriptionPlan));
router.delete('/subscription/plans/:planId', asyncHandler(subscriptionController.deleteSubscriptionPlan));

// Customer Subscriptions
router.get('/subscription/subscriptions', asyncHandler(subscriptionController.listCustomerSubscriptions));
router.get('/subscription/subscriptions/:subscriptionId', asyncHandler(subscriptionController.viewCustomerSubscription));
router.post('/subscription/subscriptions/:subscriptionId/status', asyncHandler(subscriptionController.updateSubscriptionStatus));
router.post('/subscription/subscriptions/:subscriptionId/cancel', asyncHandler(subscriptionController.cancelCustomerSubscription));

// Subscription Billing
router.get('/subscription/billing', asyncHandler(subscriptionController.subscriptionBilling));
router.post('/subscription/billing/:subscriptionId/process', asyncHandler(subscriptionController.processSubscriptionBilling));
router.post('/subscription/billing/:subscriptionId/manage', asyncHandler(subscriptionController.manageFailedPayments));

// Loyalty Tiers
router.get('/loyalty/tiers', asyncHandler(loyaltyController.listLoyaltyTiers));

// Loyalty Rewards
router.get('/loyalty/rewards', asyncHandler(loyaltyController.listLoyaltyRewards));
router.get('/loyalty/rewards/create', asyncHandler(loyaltyController.createLoyaltyRewardForm));
router.post('/loyalty/rewards', asyncHandler(loyaltyController.createLoyaltyReward));
router.get('/loyalty/rewards/:rewardId', asyncHandler(loyaltyController.viewLoyaltyReward));
router.get('/loyalty/rewards/:rewardId/edit', asyncHandler(loyaltyController.editLoyaltyRewardForm));
router.post('/loyalty/rewards/:rewardId', asyncHandler(loyaltyController.updateLoyaltyReward));
router.delete('/loyalty/rewards/:rewardId', asyncHandler(loyaltyController.deleteLoyaltyReward));

// Customer Loyalty
router.get('/loyalty/customers', asyncHandler(loyaltyController.listCustomerLoyalty));
router.get('/loyalty/customers/:customerId', asyncHandler(loyaltyController.viewCustomerLoyalty));

// Loyalty Analytics
router.get('/loyalty/analytics', asyncHandler(loyaltyController.loyaltyAnalytics));

// ============================================================================
// Advanced Analytics & Intelligence (Phase 7)
// ============================================================================

// Analytics Dashboard
router.get('/analytics', asyncHandler(analyticsController.analyticsDashboard));
router.get('/analytics/dashboard', asyncHandler(analyticsController.analyticsDashboard));
router.get('/analytics/store-sales', asyncHandler(analyticsController.storeSalesDashboard));

// Predictive Analytics
router.get('/analytics/predictive', asyncHandler(analyticsController.predictiveAnalytics));

// Customer Analytics
router.get('/analytics/customers', asyncHandler(analyticsController.customerAnalytics));
router.get('/analytics/customers/:segmentId', asyncHandler(analyticsController.customerAnalytics));

// AI Recommendations
router.get('/analytics/ai-recommendations', asyncHandler(analyticsController.aiRecommendations));

// Executive Dashboard
router.get('/analytics/executive', asyncHandler(analyticsController.executiveDashboard));

// Real-time Metrics API
router.get('/api/analytics/realtime', asyncHandler(analyticsController.realTimeMetrics));

// Automated Reporting Management
router.get('/analytics/reports', asyncHandler(analyticsController.automatedReports));
router.post('/analytics/reports/schedules', asyncHandler(analyticsController.createReportSchedule));
router.put('/analytics/reports/schedules/:scheduleId', asyncHandler(analyticsController.updateReportSchedule));
router.delete('/analytics/reports/schedules/:scheduleId', asyncHandler(analyticsController.deleteReportSchedule));
router.post('/analytics/reports/run-now', asyncHandler(analyticsController.runReportNow));

// ============================================================================
// Admin Users & Roles (Phase 8)
// ============================================================================

// Admin Users
router.get('/users', asyncHandler(usersController.listUsers));
router.get('/users/create', asyncHandler(usersController.createUserForm));
router.post('/users', asyncHandler(usersController.createUser));
router.get('/users/:userId', asyncHandler(usersController.viewUser));
router.put('/users/:userId', asyncHandler(usersController.updateUser));
router.delete('/users/:userId', asyncHandler(usersController.deleteUser));

// Roles & Permissions
router.get('/roles', asyncHandler(usersController.listRoles));
router.post('/roles', asyncHandler(usersController.createRole));
router.put('/roles/:roleId', asyncHandler(usersController.updateRole));
router.delete('/roles/:roleId', asyncHandler(usersController.deleteRole));

// ============================================================================
// Settings (Phase 8)
// ============================================================================

// Store Settings
router.get('/settings/store', asyncHandler(settingsController.storeSettings));
router.post('/settings/store', asyncHandler(settingsController.updateStoreSettings));

// Business Information
router.get('/settings/business', asyncHandler(settingsController.businessInfo));
router.post('/settings/business', asyncHandler(settingsController.updateBusinessInfo));

// Localization
router.get('/settings/localization', asyncHandler(localizationController.localizationDashboard));
router.get('/settings/localization/languages', asyncHandler(localizationController.listLanguages));
router.get('/settings/localization/languages/create', asyncHandler(localizationController.createLanguageForm));
router.post('/settings/localization/languages', asyncHandler(localizationController.createLanguage));
router.get('/settings/localization/languages/:languageId/edit', asyncHandler(localizationController.editLanguageForm));
router.post('/settings/localization/languages/:languageId', asyncHandler(localizationController.updateLanguage));
router.delete('/settings/localization/languages/:languageId', asyncHandler(localizationController.deleteLanguage));

router.get('/settings/localization/currencies', asyncHandler(localizationController.listCurrencies));
router.get('/settings/localization/currencies/create', asyncHandler(localizationController.createCurrencyForm));
router.post('/settings/localization/currencies', asyncHandler(localizationController.createCurrency));
router.get('/settings/localization/currencies/:currencyId/edit', asyncHandler(localizationController.editCurrencyForm));
router.post('/settings/localization/currencies/:currencyId', asyncHandler(localizationController.updateCurrency));
router.delete('/settings/localization/currencies/:currencyId', asyncHandler(localizationController.deleteCurrency));

router.get('/settings/localization/regions', asyncHandler(localizationController.listRegions));
router.get('/settings/localization/regions/create', asyncHandler(localizationController.createRegionForm));
router.post('/settings/localization/regions', asyncHandler(localizationController.createRegion));
router.get('/settings/localization/regions/:regionId/edit', asyncHandler(localizationController.editRegionForm));
router.post('/settings/localization/regions/:regionId', asyncHandler(localizationController.updateRegion));
router.delete('/settings/localization/regions/:regionId', asyncHandler(localizationController.deleteRegion));

// Legacy settings routes (keep for backward compatibility)
router.post('/settings/languages', asyncHandler(settingsController.createLanguage));
router.put('/settings/languages/:languageId', asyncHandler(settingsController.updateLanguage));
router.delete('/settings/languages/:languageId', asyncHandler(settingsController.deleteLanguage));
router.post('/settings/currencies', asyncHandler(settingsController.createCurrency));
router.put('/settings/currencies/:currencyId', asyncHandler(settingsController.updateCurrency));
router.delete('/settings/currencies/:currencyId', asyncHandler(settingsController.deleteCurrency));

// ============================================================================
// Checkout Settings Routes
// ============================================================================

router.get('/settings/checkout', asyncHandler(checkoutController.checkoutSettings));
router.post('/settings/checkout', asyncHandler(checkoutController.updateCheckoutSettings));
router.get('/settings/checkout/payment-methods', asyncHandler(checkoutController.listPaymentMethods));
router.post('/settings/checkout/payment-methods/order', asyncHandler(checkoutController.updatePaymentMethodOrder));
router.get('/settings/checkout/shipping-options', asyncHandler(checkoutController.listShippingOptions));
router.post('/settings/checkout/shipping-options/order', asyncHandler(checkoutController.updateShippingOptionOrder));

// ============================================================================
// Organizations Routes
// ============================================================================

router.get('/operations/organizations', asyncHandler(organizationController.listOrganizations));
router.get('/operations/organizations/create', asyncHandler(organizationController.createOrganizationForm));
router.post('/operations/organizations', asyncHandler(organizationController.createOrganization));

router.get('/operations/organizations/:organizationId', asyncHandler(organizationController.viewOrganization));
router.get('/operations/organizations/:organizationId/edit', asyncHandler(organizationController.editOrganizationForm));
router.post('/operations/organizations/:organizationId', asyncHandler(organizationController.updateOrganization));
router.put('/operations/organizations/:organizationId', asyncHandler(organizationController.updateOrganization));
router.delete('/operations/organizations/:organizationId', asyncHandler(organizationController.deleteOrganization));
router.post('/operations/organizations/:organizationId/approve', asyncHandler(organizationController.approveOrganization));
router.post('/operations/organizations/:organizationId/suspend', asyncHandler(organizationController.suspendOrganization));

// ============================================================================
// Media Library Routes
// ============================================================================

router.get('/content/media', asyncHandler(mediaController.listMedia));
router.get('/content/media/upload', asyncHandler(mediaController.uploadMediaForm));
router.post('/content/media/upload', asyncHandler(mediaController.uploadMedia));
router.get('/content/media/:mediaId', asyncHandler(mediaController.viewMedia));
router.get('/content/media/:mediaId/edit', asyncHandler(mediaController.editMediaForm));
router.post('/content/media/:mediaId', asyncHandler(mediaController.updateMedia));
router.delete('/content/media/:mediaId', asyncHandler(mediaController.deleteMedia));
router.post('/content/media/bulk-delete', asyncHandler(mediaController.bulkDeleteMedia));
router.post('/content/media/folders', asyncHandler(mediaController.createFolder));

// ============================================================================
// Automation Routes
// ============================================================================

router.get('/automation', asyncHandler(automationController.listAutomationRules));
router.get('/automation/create', asyncHandler(automationController.createAutomationRuleForm));
router.post('/automation', asyncHandler(automationController.createAutomationRule));
router.get('/automation/:ruleId', asyncHandler(automationController.viewAutomationRule));
router.get('/automation/:ruleId/edit', asyncHandler(automationController.editAutomationRuleForm));
router.post('/automation/:ruleId', asyncHandler(automationController.updateAutomationRule));
router.post('/automation/:ruleId/delete', asyncHandler(automationController.deleteAutomationRule));
router.post('/automation/:ruleId/activate', asyncHandler(automationController.activateAutomationRule));
router.post('/automation/:ruleId/deactivate', asyncHandler(automationController.deactivateAutomationRule));
router.post('/automation/:ruleId/trigger', asyncHandler(automationController.triggerAutomationRule));

// ============================================================================
// Returns & Store Credit Routes
// ============================================================================

router.get('/returns', asyncHandler(returnsController.listReturns));
router.get('/returns/create', asyncHandler(returnsController.createReturnForm));
router.post('/returns', asyncHandler(returnsController.createReturn));
router.get('/returns/store-credit', asyncHandler(returnsController.viewStoreCredit));
router.get('/returns/:returnId', asyncHandler(returnsController.viewReturn));
router.post('/returns/:returnId/approve', asyncHandler(returnsController.approveReturn));
router.post('/returns/:returnId/deny', asyncHandler(returnsController.denyReturn));
router.post('/returns/:returnId/in-transit', asyncHandler(returnsController.markInTransit));
router.post('/returns/:returnId/received', asyncHandler(returnsController.markReceived));
router.post('/returns/:returnId/inspect', asyncHandler(returnsController.completeInspection));
router.post('/returns/:returnId/complete', asyncHandler(returnsController.completeReturn));
router.post('/returns/:returnId/cancel', asyncHandler(returnsController.cancelReturn));

// ============================================================================
// Page Builder Routes
// ============================================================================

router.get('/page-builder', asyncHandler(pageBuilderController.listPageBuilderDrafts));
router.get('/page-builder/create', asyncHandler(pageBuilderController.createDraftForm));
router.post('/page-builder/create', asyncHandler(pageBuilderController.createDraft));
router.get('/page-builder/:draftId', asyncHandler(pageBuilderController.pageBuilderEditor));
router.get('/page-builder/:draftId/preview', asyncHandler(pageBuilderController.pageBuilderPreview));
router.post('/page-builder/:draftId/publish', asyncHandler(pageBuilderController.publishDraft));
router.delete('/page-builder/:draftId', asyncHandler(pageBuilderController.deleteDraft));

// ============================================================================
// Theme Management Routes
// ============================================================================

router.get('/themes', asyncHandler(themeController.listThemes));
router.get('/themes/:themeId', asyncHandler(themeController.themeDetail));
router.get('/themes/:themeId/preview', asyncHandler(themeController.themePreview));
router.post('/themes/:themeId/assign', asyncHandler(themeController.assignTheme));
router.post('/themes/:themeId/unassign', asyncHandler(themeController.unassignTheme));
router.post('/themes/:themeId/override', asyncHandler(themeController.saveOverride));
router.post('/themes/:themeId/activate', asyncHandler(themeController.activateTheme));
router.post('/themes/:themeId/archive', asyncHandler(themeController.archiveTheme));
router.post('/themes/:themeId/delete', asyncHandler(themeController.deleteTheme));

// ============================================================================
// Integrations Routes
// ============================================================================

router.get('/integrations', asyncHandler(integrationController.listIntegrations));
router.get('/integrations/create', asyncHandler(integrationController.createIntegrationForm));
router.post('/integrations', asyncHandler(integrationController.createIntegration));
router.get('/integrations/:integrationId', asyncHandler(integrationController.viewIntegration));
router.post('/integrations/:integrationId', asyncHandler(integrationController.updateIntegration));
router.post('/integrations/:integrationId/activate', asyncHandler(integrationController.activateIntegration));
router.post('/integrations/:integrationId/deactivate', asyncHandler(integrationController.deactivateIntegration));
router.post('/integrations/:integrationId/delete', asyncHandler(integrationController.deleteIntegration));
router.post('/integrations/:integrationId/credentials', asyncHandler(integrationController.addCredential));
router.post('/integrations/:integrationId/credentials/:credentialId/delete', asyncHandler(integrationController.deleteCredential));
router.post('/integrations/:integrationId/subscriptions', asyncHandler(integrationController.createSubscription));
router.post('/integrations/:integrationId/subscriptions/:subscriptionId', asyncHandler(integrationController.updateSubscription));
router.post('/integrations/:integrationId/subscriptions/:subscriptionId/delete', asyncHandler(integrationController.deleteSubscription));

export const adminRouter = router;
