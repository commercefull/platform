import express from 'express';
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
import * as warehouseController from './controllers/warehouseController';
import * as basketController from './controllers/basketController';
import * as fulfillmentController from './controllers/fulfillmentController';
import * as supplierController from './controllers/supplierController';
import * as membershipController from './controllers/membershipController';
import * as subscriptionController from './controllers/subscriptionController';
import * as loyaltyController from './controllers/loyaltyController';
import * as b2bController from './controllers/b2bController';
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
import * as brandController from './controllers/brandController';
import * as pricingController from './controllers/pricingController';
import * as channelController from './controllers/channelController';
import * as localizationController from './controllers/localizationController';
import * as segmentController from './controllers/segmentController';
import * as merchantController from './controllers/merchantController';
import * as mediaController from './controllers/mediaController';
import * as checkoutController from './controllers/checkoutController';

const router = express.Router();

// ============================================================================
// Public Routes (no auth required)
// ============================================================================

// GET: admin login page
router.get('/login', getAdminLogin);

// POST: admin login form submission
router.post('/login', postAdminLogin);

// POST: admin logout
router.post('/logout', postAdminLogout);

// ============================================================================
// Protected Routes (admin auth required)
// ============================================================================

// Apply authentication middleware to all routes below
router.use(isAdminLoggedIn);

// GET: admin dashboard (home)
router.get('/', getAdminDashboard);

// GET: admin profile
router.get('/profile', getAdminProfile);

// ============================================================================
// Catalog - Categories Routes
// ============================================================================

router.get('/catalog/categories', assortmentController.listCategories);
router.get('/catalog/categories/create', assortmentController.createCategoryForm);
router.post('/catalog/categories', assortmentController.createCategory);
router.get('/catalog/categories/:categoryId', assortmentController.viewCategory);
router.get('/catalog/categories/:categoryId/edit', assortmentController.editCategoryForm);
router.post('/catalog/categories/:categoryId', assortmentController.updateCategory);
router.put('/catalog/categories/:categoryId', assortmentController.updateCategory);
router.delete('/catalog/categories/:categoryId', assortmentController.deleteCategory);
router.post('/catalog/categories/reorder', assortmentController.reorderCategories);

// ============================================================================
// Catalog - Collections Routes
// ============================================================================

router.get('/catalog/collections', assortmentController.listCollections);
router.get('/catalog/collections/create', assortmentController.createCollectionForm);
router.post('/catalog/collections', assortmentController.createCollection);
router.get('/catalog/collections/:collectionId', assortmentController.viewCollection);
router.get('/catalog/collections/:collectionId/edit', assortmentController.editCollectionForm);
router.post('/catalog/collections/:collectionId', assortmentController.updateCollection);
router.put('/catalog/collections/:collectionId', assortmentController.updateCollection);
router.delete('/catalog/collections/:collectionId', assortmentController.deleteCollection);

// ============================================================================
// Catalog - Brands Routes
// ============================================================================

router.get('/catalog/brands', brandController.listBrands);
router.get('/catalog/brands/create', brandController.createBrandForm);
router.post('/catalog/brands', brandController.createBrand);
router.get('/catalog/brands/:brandId', brandController.viewBrand);
router.get('/catalog/brands/:brandId/edit', brandController.editBrandForm);
router.post('/catalog/brands/:brandId', brandController.updateBrand);
router.put('/catalog/brands/:brandId', brandController.updateBrand);
router.delete('/catalog/brands/:brandId', brandController.deleteBrand);

// ============================================================================
// Catalog - Pricing Routes
// ============================================================================

router.get('/catalog/pricing', pricingController.listPriceLists);
router.get('/catalog/pricing/lists/create', pricingController.createPriceListForm);
router.post('/catalog/pricing/lists', pricingController.createPriceList);
router.get('/catalog/pricing/lists/:listId', pricingController.viewPriceList);
router.get('/catalog/pricing/lists/:listId/edit', pricingController.editPriceListForm);
router.post('/catalog/pricing/lists/:listId', pricingController.updatePriceList);
router.put('/catalog/pricing/lists/:listId', pricingController.updatePriceList);
router.delete('/catalog/pricing/lists/:listId', pricingController.deletePriceList);

router.get('/catalog/pricing/rules', pricingController.listPriceRules);
router.get('/catalog/pricing/rules/create', pricingController.createPriceRuleForm);
router.post('/catalog/pricing/rules', pricingController.createPriceRule);
router.get('/catalog/pricing/rules/:ruleId', pricingController.viewPriceRule);
router.get('/catalog/pricing/rules/:ruleId/edit', pricingController.editPriceRuleForm);
router.post('/catalog/pricing/rules/:ruleId', pricingController.updatePriceRule);
router.put('/catalog/pricing/rules/:ruleId', pricingController.updatePriceRule);
router.delete('/catalog/pricing/rules/:ruleId', pricingController.deletePriceRule);

// ============================================================================
// Product Routes
// ============================================================================

router.get('/products', productController.listProducts);
router.get('/products/create', productController.createProductForm);
router.post('/products', productController.createProduct);
router.get('/products/:productId', productController.viewProduct);
router.get('/products/:productId/edit', productController.editProductForm);
router.post('/products/:productId', productController.updateProduct); // Form POST (method override)
router.put('/products/:productId', productController.updateProduct); // API PUT
router.delete('/products/:productId', productController.deleteProduct);
router.post('/products/:productId/status', productController.updateProductStatus);
router.post('/products/:productId/publish', productController.publishProduct);
router.post('/products/:productId/unpublish', productController.unpublishProduct);

// ============================================================================
// Order Routes
// ============================================================================

router.get('/orders', orderController.listOrders);
router.get('/orders/:orderId', orderController.viewOrder);
router.post('/orders/:orderId/status', orderController.updateOrderStatus);
router.post('/orders/:orderId/cancel', orderController.cancelOrder);
router.get('/orders/:orderId/refund', orderController.refundForm);
router.post('/orders/:orderId/refund', orderController.processRefund);

// ============================================================================
// Customer Routes
// ============================================================================

router.get('/customers', customerController.listCustomers);
router.get('/customers/:customerId', customerController.viewCustomer);
router.get('/customers/:customerId/edit', customerController.editCustomerForm);
router.post('/customers/:customerId', customerController.updateCustomer); // Form POST
router.put('/customers/:customerId', customerController.updateCustomer); // API PUT
router.post('/customers/:customerId/deactivate', customerController.deactivateCustomer);
router.post('/customers/:customerId/reactivate', customerController.reactivateCustomer);
router.post('/customers/:customerId/verify', customerController.verifyCustomer);
router.get('/customers/:customerId/addresses', customerController.customerAddresses);
router.post('/customers/:customerId/addresses', customerController.addCustomerAddress);

// ============================================================================
// Inventory Routes
// ============================================================================

router.get('/inventory', inventoryController.listInventory);
router.post('/inventory/adjust', inventoryController.adjustStock);
router.get('/inventory/locations', inventoryController.listLocations);
router.get('/inventory/low-stock', inventoryController.lowStockReport);
router.get('/inventory/:inventoryLevelId/history', inventoryController.viewInventoryHistory);

// ============================================================================
// Tax Routes
// ============================================================================

router.get('/tax', taxController.listTaxSettings);
router.post('/tax/rates', taxController.createTaxRate);
router.put('/tax/rates/:taxRateId', taxController.updateTaxRate);
router.delete('/tax/rates/:taxRateId', taxController.deleteTaxRate);
router.post('/tax/zones', taxController.createTaxZone);
router.put('/tax/zones/:taxZoneId', taxController.updateTaxZone);
router.delete('/tax/zones/:taxZoneId', taxController.deleteTaxZone);
router.post('/tax/classes', taxController.createTaxClass);
router.put('/tax/classes/:taxClassId', taxController.updateTaxClass);
router.delete('/tax/classes/:taxClassId', taxController.deleteTaxClass);

// ============================================================================
// Programs Dashboard Routes
// ============================================================================

router.get('/programs/membership', programsController.membershipDashboard);
router.get('/programs/subscription', programsController.subscriptionDashboard);
router.get('/programs/loyalty', programsController.loyaltyDashboard);
router.get('/programs/b2b', programsController.b2bDashboard);

// ============================================================================
// Operations Dashboard
// ============================================================================

router.get('/operations', operationsController.operationsDashboard);

// ============================================================================
// GDPR Compliance
// ============================================================================

router.get('/gdpr', gdprController.gdprDashboard);
router.post('/gdpr/requests', gdprController.createGdprRequest);
router.get('/gdpr/requests/:requestId', gdprController.viewGdprRequest);
router.post('/gdpr/requests/:requestId/process', gdprController.processGdprRequest);
router.post('/gdpr/requests/:requestId/complete', gdprController.completeGdprRequest);
router.get('/gdpr/consent', gdprController.consentManagement);

// ============================================================================
// Support Center
// ============================================================================

router.get('/support', supportController.supportDashboard);
router.get('/support/tickets', supportController.listSupportTickets);
router.get('/support/tickets/:ticketId', supportController.viewSupportTicket);
router.post('/support/tickets/:ticketId/status', supportController.updateTicketStatus);
router.get('/support/faqs', supportController.listFaqs);
router.post('/support/faqs', supportController.createFaq);
router.put('/support/faqs/:faqId', supportController.updateFaq);
router.delete('/support/faqs/:faqId', supportController.deleteFaq);

// ============================================================================
// Promotion Routes
// ============================================================================

router.get('/promotions', promotionController.listPromotions);
router.get('/promotions/create', promotionController.createPromotionForm);
router.post('/promotions', promotionController.createPromotion);
router.get('/promotions/:promotionId', promotionController.viewPromotion);
router.get('/promotions/:promotionId/edit', promotionController.editPromotionForm);
router.post('/promotions/:promotionId', promotionController.updatePromotion); // Form POST
router.put('/promotions/:promotionId', promotionController.updatePromotion); // API PUT
router.delete('/promotions/:promotionId', promotionController.deletePromotion);

// ============================================================================
// Coupon Routes
// ============================================================================

router.get('/promotions/coupons', couponController.listCoupons);
router.get('/promotions/coupons/create', couponController.createCouponForm);
router.post('/promotions/coupons', couponController.createCoupon);
router.get('/promotions/coupons/:couponId', couponController.viewCoupon);
router.get('/promotions/coupons/:couponId/edit', couponController.editCouponForm);
router.post('/promotions/coupons/:couponId', couponController.updateCoupon);
router.delete('/promotions/coupons/:couponId', couponController.deleteCoupon);
router.post('/promotions/coupons/validate', couponController.validateCoupon);

// ============================================================================
// Gift Card Routes
// ============================================================================

router.get('/promotions/gift-cards', giftCardController.listGiftCards);
router.get('/promotions/gift-cards/create', giftCardController.createGiftCardForm);
router.post('/promotions/gift-cards', giftCardController.createGiftCard);
router.get('/promotions/gift-cards/:giftCardId', giftCardController.viewGiftCard);
router.get('/promotions/gift-cards/:giftCardId/edit', giftCardController.editGiftCardForm);
router.post('/promotions/gift-cards/:giftCardId/activate', giftCardController.activateGiftCardAction);
router.post('/promotions/gift-cards/:giftCardId/assign', giftCardController.assignGiftCardAction);
router.post('/promotions/gift-cards/:giftCardId/reload', giftCardController.reloadGiftCardAction);
router.post('/promotions/gift-cards/:giftCardId/refund', giftCardController.refundToGiftCardAction);
router.post('/promotions/gift-cards/:giftCardId/cancel', giftCardController.cancelGiftCardAction);
router.get('/promotions/gift-cards/balance/:code', giftCardController.checkGiftCardBalance);

// ============================================================================
// Payment Routes
// ============================================================================

router.get('/payments/gateways', paymentController.listPaymentGateways);
router.get('/payments/gateways/create', paymentController.createPaymentGatewayForm);
router.post('/payments/gateways', paymentController.createPaymentGateway);
router.get('/payments/gateways/:gatewayId', paymentController.viewPaymentGateway);
router.get('/payments/gateways/:gatewayId/edit', paymentController.editPaymentGatewayForm);
router.post('/payments/gateways/:gatewayId', paymentController.updatePaymentGateway);
router.delete('/payments/gateways/:gatewayId', paymentController.deletePaymentGateway);

router.get('/payments/methods', paymentController.listPaymentMethods);
router.get('/payments/transactions', paymentController.listPaymentTransactions);

// ============================================================================
// Shipping Routes
// ============================================================================

// Shipping overview - redirect to methods
router.get('/shipping', shippingController.listShippingMethods);
router.get('/shipping/methods/create', shippingController.createShippingMethodForm);
router.post('/shipping/methods', shippingController.createShippingMethod);
router.get('/shipping/methods/:methodId', shippingController.viewShippingMethod);
router.get('/shipping/methods/:methodId/edit', shippingController.editShippingMethodForm);
router.post('/shipping/methods/:methodId', shippingController.updateShippingMethod);
router.delete('/shipping/methods/:methodId', shippingController.deleteShippingMethod);
router.post('/shipping/methods/:methodId/activate', shippingController.activateShippingMethod);
router.post('/shipping/methods/:methodId/deactivate', shippingController.deactivateShippingMethod);

// ============================================================================
// Shipping Zones Routes
// ============================================================================

router.get('/shipping/zones', shippingZoneController.listShippingZones);
router.get('/shipping/zones/create', shippingZoneController.createShippingZoneForm);
router.post('/shipping/zones', shippingZoneController.createShippingZone);
router.get('/shipping/zones/:zoneId', shippingZoneController.viewShippingZone);
router.get('/shipping/zones/:zoneId/edit', shippingZoneController.editShippingZoneForm);
router.post('/shipping/zones/:zoneId', shippingZoneController.updateShippingZone);
router.post('/shipping/zones/:zoneId/activate', shippingZoneController.activateShippingZone);
router.post('/shipping/zones/:zoneId/deactivate', shippingZoneController.deactivateShippingZone);
router.delete('/shipping/zones/:zoneId', shippingZoneController.deleteShippingZone);

// ============================================================================
// Shipping Rates Routes
// ============================================================================

router.get('/shipping/rates', shippingRateController.listShippingRates);
router.get('/shipping/rates/create', shippingRateController.createShippingRateForm);
router.post('/shipping/rates', shippingRateController.createShippingRate);
router.get('/shipping/rates/:rateId', shippingRateController.viewShippingRate);
router.get('/shipping/rates/:rateId/edit', shippingRateController.editShippingRateForm);
router.post('/shipping/rates/:rateId', shippingRateController.updateShippingRate);
router.post('/shipping/rates/:rateId/activate', shippingRateController.activateShippingRate);
router.post('/shipping/rates/:rateId/deactivate', shippingRateController.deactivateShippingRate);
router.delete('/shipping/rates/:rateId', shippingRateController.deleteShippingRate);
router.post('/shipping/rates/calculate', shippingRateController.calculateShippingRate);

// ============================================================================
// Payment Routes
// ============================================================================

// Payment overview - redirect to gateways
router.get('/payments', paymentController.listPaymentGateways);
router.get('/payments/gateways', paymentController.listPaymentGateways);
router.get('/payments/gateways/create', paymentController.createPaymentGatewayForm);
router.post('/payments/gateways', paymentController.createPaymentGateway);
router.get('/payments/gateways/:gatewayId', paymentController.viewPaymentGateway);
router.get('/payments/gateways/:gatewayId/edit', paymentController.editPaymentGatewayForm);
router.post('/payments/gateways/:gatewayId', paymentController.updatePaymentGateway);
router.delete('/payments/gateways/:gatewayId', paymentController.deletePaymentGateway);

// Payment Methods
router.get('/payments/methods', paymentController.listPaymentMethods);

// Payment Transactions
router.get('/payments/transactions', paymentController.listPaymentTransactions);

router.get('/content/pages', contentController.listContentPages);
router.get('/content/pages/create', contentController.createContentPageForm);
router.post('/content/pages', contentController.createContentPage);
router.get('/content/pages/:pageId', contentController.viewContentPage);
router.get('/content/pages/:pageId/edit', contentController.editContentPageForm);
router.post('/content/pages/:pageId', contentController.updateContentPage);
router.post('/content/pages/:pageId/publish', contentController.publishContentPage);
router.delete('/content/pages/:pageId', contentController.deleteContentPage);

router.get('/content/templates', contentController.listContentTemplates);
router.get('/content/media', contentController.listContentMedia);

// ============================================================================
// SEO Routes
// ============================================================================

router.get('/marketing/seo', seoController.listSEOSettings);
router.post('/marketing/seo', seoController.updateSEOSettings);
router.get('/marketing/seo/robots.txt', seoController.generateRobotsTxt);
router.get('/marketing/seo/sitemap.xml', seoController.generateSitemap);

// ============================================================================
// Notification Routes
// ============================================================================

router.get('/notifications/templates', notificationController.listNotificationTemplates);
router.get('/notifications/templates/create', notificationController.createNotificationTemplateForm);
router.post('/notifications/templates', notificationController.createNotificationTemplate);
router.get('/notifications/templates/:templateId', notificationController.viewNotificationTemplate);
router.get('/notifications/templates/:templateId/edit', notificationController.editNotificationTemplateForm);
router.post('/notifications/templates/:templateId', notificationController.updateNotificationTemplate);
router.post('/notifications/templates/:templateId/activate', notificationController.activateNotificationTemplate);
router.post('/notifications/templates/:templateId/deactivate', notificationController.deactivateNotificationTemplate);
router.delete('/notifications/templates/:templateId', notificationController.deleteNotificationTemplate);
router.post('/notifications/templates/:templateId/clone', notificationController.cloneNotificationTemplate);
router.post('/notifications/templates/:templateId/preview', notificationController.previewNotificationTemplate);

// ============================================================================
// Content Blocks Routes
// ============================================================================

router.get('/content/blocks', contentBlocksController.listContentBlocks);
router.get('/content/blocks/create', contentBlocksController.createContentBlockForm);
router.post('/content/blocks', contentBlocksController.createContentBlock);
router.get('/content/blocks/:blockId/edit', contentBlocksController.editContentBlockForm);
router.post('/content/blocks/:blockId', contentBlocksController.updateContentBlock);
router.delete('/content/blocks/:blockId', contentBlocksController.deleteContentBlock);
router.post('/content/pages/:pageId/reorder-blocks', contentBlocksController.reorderContentBlocks);

// ============================================================================
// Operations Routes
// ============================================================================

// Warehouse Operations
router.get('/warehouses', warehouseController.listWarehouses);
router.get('/warehouses/create', warehouseController.createWarehouseForm);
router.post('/warehouses', warehouseController.createWarehouse);
router.get('/warehouses/:warehouseId', warehouseController.viewWarehouse);
router.get('/warehouses/:warehouseId/edit', warehouseController.editWarehouseForm);
router.post('/warehouses/:warehouseId', warehouseController.updateWarehouse);
router.post('/warehouses/:warehouseId/activate', warehouseController.activateWarehouse);
router.post('/warehouses/:warehouseId/deactivate', warehouseController.deactivateWarehouse);
router.delete('/warehouses/:warehouseId', warehouseController.deleteWarehouse);

// Order Fulfillments
router.get('/fulfillments', fulfillmentController.listFulfillments);
router.get('/fulfillments/:fulfillmentId', fulfillmentController.viewFulfillment);
router.post('/fulfillments/:fulfillmentId/status', fulfillmentController.updateFulfillmentStatus);
router.post('/fulfillments/:fulfillmentId/shipped', fulfillmentController.markAsShipped);
router.post('/fulfillments/:fulfillmentId/delivered', fulfillmentController.markAsDelivered);
router.post('/fulfillments/:fulfillmentId/cancel', fulfillmentController.cancelFulfillment);
router.get('/fulfillments/stats', fulfillmentController.getFulfillmentStats);

// Supplier Management
router.get('/suppliers', supplierController.listSuppliers);
router.get('/suppliers/create', supplierController.createSupplierForm);
router.post('/suppliers', supplierController.createSupplier);
router.get('/suppliers/:supplierId', supplierController.viewSupplier);
router.get('/suppliers/:supplierId/edit', supplierController.editSupplierForm);
router.post('/suppliers/:supplierId', supplierController.updateSupplier);
router.post('/suppliers/:supplierId/approve', supplierController.approveSupplier);
router.post('/suppliers/:supplierId/suspend', supplierController.suspendSupplier);
router.post('/suppliers/:supplierId/activate', supplierController.activateSupplier);
router.post('/suppliers/:supplierId/deactivate', supplierController.deactivateSupplier);
router.delete('/suppliers/:supplierId', supplierController.deleteSupplier);

// Cart Analytics
router.get('/baskets/abandoned', basketController.listAbandonedCarts);
router.get('/baskets/abandoned/:basketId', basketController.viewAbandonedCart);
router.post('/baskets/abandoned/:basketId/recover', basketController.recoverAbandonedCart);
router.post('/baskets/abandoned/:basketId/email', basketController.sendRecoveryEmail);
router.post('/baskets/abandoned/:basketId/recovered', basketController.markCartRecovered);
router.post('/baskets/cleanup-expired', basketController.cleanupExpiredBaskets);
router.get('/baskets/analytics', basketController.basketAnalytics);

// Warehouse Dashboard
router.get('/operations/dashboard', fulfillmentController.warehouseDashboard);

// ============================================================================
// Customer Programs Routes
// ============================================================================

// Membership Plans
router.get('/membership/plans', membershipController.listMembershipPlans);
router.get('/membership/plans/create', membershipController.createMembershipPlanForm);
router.post('/membership/plans', membershipController.createMembershipPlan);
router.get('/membership/plans/:planId', membershipController.viewMembershipPlan);
router.get('/membership/plans/:planId/edit', membershipController.editMembershipPlanForm);
router.post('/membership/plans/:planId', membershipController.updateMembershipPlan);
router.post('/membership/plans/:planId/activate', membershipController.activateMembershipPlan);
router.post('/membership/plans/:planId/deactivate', membershipController.deactivateMembershipPlan);
router.delete('/membership/plans/:planId', membershipController.deleteMembershipPlan);

// Membership Benefits
router.get('/membership/benefits', membershipController.listMembershipBenefits);

// Memberships (User memberships)
router.get('/membership/memberships', membershipController.listMemberships);

// Membership Advanced Operations
router.post('/membership/bulk-operations', membershipController.bulkMembershipOperations);
router.post('/membership/memberships/:membershipId/change-tier', membershipController.membershipUpgradeDowngrade);
router.get('/membership/analytics', membershipController.membershipAnalytics);

// Subscription Plans
router.get('/subscription/plans', subscriptionController.listSubscriptionPlans);
router.get('/subscription/plans/create', subscriptionController.createSubscriptionPlanForm);
router.post('/subscription/plans', subscriptionController.createSubscriptionPlan);
router.get('/subscription/plans/:planId', subscriptionController.viewSubscriptionPlan);
router.get('/subscription/plans/:planId/edit', subscriptionController.editSubscriptionPlanForm);
router.post('/subscription/plans/:planId', subscriptionController.updateSubscriptionPlan);
router.delete('/subscription/plans/:planId', subscriptionController.deleteSubscriptionPlan);

// Customer Subscriptions
router.get('/subscription/subscriptions', subscriptionController.listCustomerSubscriptions);
router.get('/subscription/subscriptions/:subscriptionId', subscriptionController.viewCustomerSubscription);
router.post('/subscription/subscriptions/:subscriptionId/status', subscriptionController.updateSubscriptionStatus);
router.post('/subscription/subscriptions/:subscriptionId/cancel', subscriptionController.cancelCustomerSubscription);

// Subscription Billing
router.get('/subscription/billing', subscriptionController.subscriptionBilling);
router.post('/subscription/billing/:subscriptionId/process', subscriptionController.processSubscriptionBilling);
router.post('/subscription/billing/:subscriptionId/manage', subscriptionController.manageFailedPayments);

// Loyalty Tiers
router.get('/loyalty/tiers', loyaltyController.listLoyaltyTiers);

// Loyalty Rewards
router.get('/loyalty/rewards', loyaltyController.listLoyaltyRewards);
router.get('/loyalty/rewards/create', loyaltyController.createLoyaltyRewardForm);
router.post('/loyalty/rewards', loyaltyController.createLoyaltyReward);
router.get('/loyalty/rewards/:rewardId', loyaltyController.viewLoyaltyReward);
router.get('/loyalty/rewards/:rewardId/edit', loyaltyController.editLoyaltyRewardForm);
router.post('/loyalty/rewards/:rewardId', loyaltyController.updateLoyaltyReward);
router.delete('/loyalty/rewards/:rewardId', loyaltyController.deleteLoyaltyReward);

// Customer Loyalty
router.get('/loyalty/customers', loyaltyController.listCustomerLoyalty);
router.get('/loyalty/customers/:customerId', loyaltyController.viewCustomerLoyalty);

// Loyalty Analytics
router.get('/loyalty/analytics', loyaltyController.loyaltyAnalytics);

// B2B Companies
router.get('/b2b/companies', b2bController.listB2bCompanies);
router.get('/b2b/companies/create', b2bController.createB2bCompanyForm);
router.post('/b2b/companies', b2bController.createB2bCompany);
router.get('/b2b/companies/:companyId', b2bController.viewB2bCompany);
router.get('/b2b/companies/:companyId/edit', b2bController.editB2bCompanyForm);
router.post('/b2b/companies/:companyId', b2bController.updateB2bCompany);
router.post('/b2b/companies/:companyId/approve', b2bController.approveB2bCompany);
router.post('/b2b/companies/:companyId/suspend', b2bController.suspendB2bCompany);
router.delete('/b2b/companies/:companyId', b2bController.deleteB2bCompany);

// B2B Company Users
router.get('/b2b/companies/:companyId/users', b2bController.listB2bCompanyUsers);
router.post('/b2b/companies/:companyId/users', b2bController.createB2bCompanyUser);
router.delete('/b2b/companies/:companyId/users/:userId', b2bController.deleteB2bCompanyUser);

// B2B Quotes
router.get('/b2b/quotes', b2bController.listB2bQuotes);
router.get('/b2b/quotes/create', b2bController.createB2bQuoteForm);
router.post('/b2b/quotes', b2bController.createB2bQuote);
router.get('/b2b/quotes/:quoteId', b2bController.viewB2bQuote);
router.get('/b2b/quotes/:quoteId/edit', b2bController.editB2bQuoteForm);
router.post('/b2b/quotes/:quoteId', b2bController.updateB2bQuote);
router.post('/b2b/quotes/:quoteId/send', b2bController.sendB2bQuote);
router.post('/b2b/quotes/:quoteId/accept', b2bController.acceptB2bQuote);
router.post('/b2b/quotes/:quoteId/reject', b2bController.rejectB2bQuote);
router.post('/b2b/quotes/:quoteId/convert', b2bController.convertB2bQuoteToOrder);
router.post('/b2b/quotes/:quoteId/revision', b2bController.createB2bQuoteRevision);
router.delete('/b2b/quotes/:quoteId', b2bController.deleteB2bQuote);

// B2B Quote Items
router.post('/b2b/quotes/:quoteId/items', b2bController.addB2bQuoteItem);
router.put('/b2b/quotes/:quoteId/items/:itemId', b2bController.updateB2bQuoteItem);
router.delete('/b2b/quotes/:quoteId/items/:itemId', b2bController.deleteB2bQuoteItem);

// B2B Analytics
router.get('/b2b/analytics', b2bController.b2bQuoteAnalytics);

// ============================================================================
// Advanced Analytics & Intelligence (Phase 7)
// ============================================================================

// Analytics Dashboard
router.get('/analytics', analyticsController.analyticsDashboard);
router.get('/analytics/dashboard', analyticsController.analyticsDashboard);

// Predictive Analytics
router.get('/analytics/predictive', analyticsController.predictiveAnalytics);

// Customer Analytics
router.get('/analytics/customers', analyticsController.customerAnalytics);
router.get('/analytics/customers/:segmentId', analyticsController.customerAnalytics);

// AI Recommendations
router.get('/analytics/ai-recommendations', analyticsController.aiRecommendations);

// Executive Dashboard
router.get('/analytics/executive', analyticsController.executiveDashboard);

// Real-time Metrics API
router.get('/api/analytics/realtime', analyticsController.realTimeMetrics);

// Automated Reporting Management
router.get('/analytics/reports', analyticsController.automatedReports);
router.post('/analytics/reports/schedules', analyticsController.createReportSchedule);
router.put('/analytics/reports/schedules/:scheduleId', analyticsController.updateReportSchedule);
router.delete('/analytics/reports/schedules/:scheduleId', analyticsController.deleteReportSchedule);
router.post('/analytics/reports/run-now', analyticsController.runReportNow);

// ============================================================================
// Admin Users & Roles (Phase 8)
// ============================================================================

// Admin Users
router.get('/users', usersController.listUsers);
router.get('/users/create', usersController.createUserForm);
router.post('/users', usersController.createUser);
router.get('/users/:userId', usersController.viewUser);
router.put('/users/:userId', usersController.updateUser);
router.delete('/users/:userId', usersController.deleteUser);

// Roles & Permissions
router.get('/roles', usersController.listRoles);
router.post('/roles', usersController.createRole);
router.put('/roles/:roleId', usersController.updateRole);
router.delete('/roles/:roleId', usersController.deleteRole);

// ============================================================================
// Settings (Phase 8)
// ============================================================================

// Store Settings
router.get('/settings/store', settingsController.storeSettings);
router.post('/settings/store', settingsController.updateStoreSettings);

// Business Information
router.get('/settings/business', settingsController.businessInfo);
router.post('/settings/business', settingsController.updateBusinessInfo);

// Localization
router.get('/settings/localization', localizationController.localizationDashboard);
router.get('/settings/localization/languages', localizationController.listLanguages);
router.get('/settings/localization/languages/create', localizationController.createLanguageForm);
router.post('/settings/localization/languages', localizationController.createLanguage);
router.get('/settings/localization/languages/:languageId/edit', localizationController.editLanguageForm);
router.post('/settings/localization/languages/:languageId', localizationController.updateLanguage);
router.delete('/settings/localization/languages/:languageId', localizationController.deleteLanguage);

router.get('/settings/localization/currencies', localizationController.listCurrencies);
router.get('/settings/localization/currencies/create', localizationController.createCurrencyForm);
router.post('/settings/localization/currencies', localizationController.createCurrency);
router.get('/settings/localization/currencies/:currencyId/edit', localizationController.editCurrencyForm);
router.post('/settings/localization/currencies/:currencyId', localizationController.updateCurrency);
router.delete('/settings/localization/currencies/:currencyId', localizationController.deleteCurrency);

router.get('/settings/localization/regions', localizationController.listRegions);
router.get('/settings/localization/regions/create', localizationController.createRegionForm);
router.post('/settings/localization/regions', localizationController.createRegion);
router.get('/settings/localization/regions/:regionId/edit', localizationController.editRegionForm);
router.post('/settings/localization/regions/:regionId', localizationController.updateRegion);
router.delete('/settings/localization/regions/:regionId', localizationController.deleteRegion);

// Legacy settings routes (keep for backward compatibility)
router.post('/settings/languages', settingsController.createLanguage);
router.put('/settings/languages/:languageId', settingsController.updateLanguage);
router.delete('/settings/languages/:languageId', settingsController.deleteLanguage);
router.post('/settings/currencies', settingsController.createCurrency);
router.put('/settings/currencies/:currencyId', settingsController.updateCurrency);
router.delete('/settings/currencies/:currencyId', settingsController.deleteCurrency);

// ============================================================================
// Sales Channels Routes
// ============================================================================

router.get('/settings/channels', channelController.listChannels);
router.get('/settings/channels/create', channelController.createChannelForm);
router.post('/settings/channels', channelController.createChannel);
router.get('/settings/channels/:channelId', channelController.viewChannel);
router.get('/settings/channels/:channelId/edit', channelController.editChannelForm);
router.post('/settings/channels/:channelId', channelController.updateChannel);
router.put('/settings/channels/:channelId', channelController.updateChannel);
router.delete('/settings/channels/:channelId', channelController.deleteChannel);
router.post('/settings/channels/:channelId/activate', channelController.activateChannel);
router.post('/settings/channels/:channelId/deactivate', channelController.deactivateChannel);

// ============================================================================
// Checkout Settings Routes
// ============================================================================

router.get('/settings/checkout', checkoutController.checkoutSettings);
router.post('/settings/checkout', checkoutController.updateCheckoutSettings);
router.get('/settings/checkout/payment-methods', checkoutController.listPaymentMethods);
router.post('/settings/checkout/payment-methods/order', checkoutController.updatePaymentMethodOrder);
router.get('/settings/checkout/shipping-options', checkoutController.listShippingOptions);
router.post('/settings/checkout/shipping-options/order', checkoutController.updateShippingOptionOrder);

// ============================================================================
// Customer Segments Routes
// ============================================================================

router.get('/sales/segments', segmentController.listSegments);
router.get('/sales/segments/create', segmentController.createSegmentForm);
router.post('/sales/segments', segmentController.createSegment);
router.get('/sales/segments/:segmentId', segmentController.viewSegment);
router.get('/sales/segments/:segmentId/edit', segmentController.editSegmentForm);
router.post('/sales/segments/:segmentId', segmentController.updateSegment);
router.put('/sales/segments/:segmentId', segmentController.updateSegment);
router.delete('/sales/segments/:segmentId', segmentController.deleteSegment);
router.get('/sales/segments/:segmentId/customers', segmentController.viewSegmentCustomers);
router.post('/sales/segments/:segmentId/refresh', segmentController.refreshSegment);

// ============================================================================
// Merchants Routes
// ============================================================================

router.get('/operations/merchants', merchantController.listMerchants);
router.get('/operations/merchants/create', merchantController.createMerchantForm);
router.post('/operations/merchants', merchantController.createMerchant);
router.get('/operations/merchants/:merchantId', merchantController.viewMerchant);
router.get('/operations/merchants/:merchantId/edit', merchantController.editMerchantForm);
router.post('/operations/merchants/:merchantId', merchantController.updateMerchant);
router.put('/operations/merchants/:merchantId', merchantController.updateMerchant);
router.delete('/operations/merchants/:merchantId', merchantController.deleteMerchant);
router.post('/operations/merchants/:merchantId/approve', merchantController.approveMerchant);
router.post('/operations/merchants/:merchantId/suspend', merchantController.suspendMerchant);

// ============================================================================
// Media Library Routes
// ============================================================================

router.get('/content/media', mediaController.listMedia);
router.get('/content/media/upload', mediaController.uploadMediaForm);
router.post('/content/media/upload', mediaController.uploadMedia);
router.get('/content/media/:mediaId', mediaController.viewMedia);
router.get('/content/media/:mediaId/edit', mediaController.editMediaForm);
router.post('/content/media/:mediaId', mediaController.updateMedia);
router.delete('/content/media/:mediaId', mediaController.deleteMedia);
router.post('/content/media/bulk-delete', mediaController.bulkDeleteMedia);
router.post('/content/media/folders', mediaController.createFolder);

export const adminRouter = router;
