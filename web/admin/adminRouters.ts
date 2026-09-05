import express from 'express';
import { asyncHandler } from '../../libs/asyncHandler';
import { isAdminLoggedIn } from '../../libs/auth';
import { getAdminDashboard, getAdminLogin, getAdminProfile, postAdminLogin, postAdminLogout } from './controllers/adminController';

// Import feature controllers
import { createProduct, createProductCategory, createProductCategoryForm, createProductCollection, createProductCollectionForm, createProductForm, createProductTag, deleteProduct, deleteProductCategory, deleteProductCollection, deleteProductTag, deleteReviewMedia, editProductCategoryForm, editProductCollectionForm, editProductForm, listProductCategories, listProductCollections, listProductPrices, listProductQa, listProductTags, listProducts, listReviewMedia, publishProduct, unpublishProduct, updateProduct, updateProductCategory, updateProductCollection, updateProductStatus, updateQaStatus, upsertProductPrice, viewProduct } from './controllers/productController';
import { addOrderNote, cancelOrder, deleteOrderNote, listFulfillmentPackages, listOrderNotes, listOrderRefunds, listOrders, processRefund, refundForm, updateOrderStatus, updatePackageTracking, viewOrder } from './controllers/orderController';
import { addCustomerAddress, customerAddresses, deactivateCustomer, editCustomerForm, listCustomers, reactivateCustomer, updateCustomer, verifyCustomer, viewCustomer } from './controllers/customerController';
import { createPromotion, createPromotionForm, deletePromotion, editPromotionForm, listPromotions, updatePromotion, viewPromotion } from './controllers/promotionController';
import { createPaymentGateway, createPaymentGatewayForm, deletePaymentGateway, editPaymentGatewayForm, listDisputes, listPaymentFees, listPaymentGateways, listPaymentMethods, listPaymentReports, listPaymentSettings, listPaymentTransactions, updateDisputeStatus, updatePaymentGateway, updatePaymentSettings, viewDispute, viewPaymentBalance, viewPaymentGateway, viewPaymentReport } from './controllers/paymentController';
import { activateShippingMethod, createShippingMethod, createShippingMethodForm, deactivateShippingMethod, deleteShippingMethod, editShippingMethodForm, listShippingMethods, updateShippingMethod, viewShippingMethod } from './controllers/shippingController';
import { createContentPage, createContentPageForm, deleteContentPage, editContentPageForm, listContentMedia, listContentPages, listContentTemplates, publishContentPage, updateContentPage, viewContentPage } from './controllers/contentController';
import { createCoupon, createCouponForm, deleteCoupon, editCouponForm, listCoupons, updateCoupon, validateCoupon, viewCoupon } from './controllers/couponController';
import { activateGiftCardAction, assignGiftCardAction, cancelGiftCardAction, checkGiftCardBalance, createGiftCard, createGiftCardForm, editGiftCardForm, listGiftCards, refundToGiftCardAction, reloadGiftCardAction, viewGiftCard } from './controllers/giftCardController';
import { activateShippingZone, createShippingZone, createShippingZoneForm, deactivateShippingZone, deleteShippingZone, editShippingZoneForm, listShippingZones, updateShippingZone, viewShippingZone } from './controllers/shippingZoneController';
import { activateShippingRate, calculateShippingRate, createShippingRate, createShippingRateForm, deactivateShippingRate, deleteShippingRate, editShippingRateForm, listShippingRates, updateShippingRate, viewShippingRate } from './controllers/shippingRateController';
import { activateNotificationTemplate, cloneNotificationTemplate, createNotificationTemplate, createNotificationTemplateForm, createWebhook, createWebhookForm, deactivateNotificationTemplate, deactivateWebhook, deleteNotificationTemplate, editNotificationTemplateForm, listBatches, listNotificationTemplates, listTemplateTranslations, listWebhooks, previewNotificationTemplate, updateNotificationTemplate, viewBatch, viewNotificationTemplate } from './controllers/notificationController';
import { generateRobotsTxt, generateSitemap, listSEOSettings, updateSEOSettings } from './controllers/seoController';
import { createContentBlock, createContentBlockForm, deleteContentBlock, editContentBlockForm, listContentBlocks, reorderContentBlocks, updateContentBlock } from './controllers/contentBlocksController';
import { createDraft, createDraftForm, deleteDraft, listPageBuilderDrafts, pageBuilderEditor, pageBuilderPreview, publishDraft } from './controllers/pageBuilderController';
import { activateTheme, archiveTheme, assignTheme, deleteTheme, listThemes, saveOverride, themeDetail, themePreview, unassignTheme } from './controllers/themeController';
import { activateWarehouse, createWarehouse, createWarehouseForm, deactivateWarehouse, deleteWarehouse, editWarehouseForm, listWarehouses, updateWarehouse, viewWarehouse } from './controllers/warehouseController';
import { basketAnalytics, cleanupExpiredBaskets, listAbandonedCarts, markCartRecovered, recoverAbandonedCart, sendRecoveryEmail, viewAbandonedCart } from './controllers/basketController';
import { cancelFulfillment, getFulfillmentStats, listFulfillments, markAsDelivered, markAsShipped, updateFulfillmentStatus, viewFulfillment, warehouseDashboard } from './controllers/fulfillmentController';
import { activateSupplier, approveSupplier, createSupplier, createSupplierForm, deactivateSupplier, deleteSupplier, editSupplierForm, listSuppliers, suspendSupplier, updateSupplier, viewSupplier } from './controllers/supplierController';
import { activateMembershipPlan, bulkMembershipOperations, createMembershipPlan, createMembershipPlanForm, deactivateMembershipPlan, deleteMembershipPlan, editMembershipPlanForm, listMembershipBenefits, listMembershipPlans, listMemberships, membershipAnalytics, membershipUpgradeDowngrade, updateMembershipPlan, viewMembershipPlan } from './controllers/membershipController';
import { cancelCustomerSubscription, createSubscriptionPlan, createSubscriptionPlanForm, deleteSubscriptionPlan, editSubscriptionPlanForm, listCustomerSubscriptions, listSubscriptionPlans, manageFailedPayments, processSubscriptionBilling, subscriptionBilling, updateSubscriptionPlan, updateSubscriptionStatus, viewCustomerSubscription, viewSubscriptionPlan } from './controllers/subscriptionController';
import { createLoyaltyReward, createLoyaltyRewardForm, deleteLoyaltyReward, editLoyaltyRewardForm, listCustomerLoyalty, listLoyaltyRewards, listLoyaltyTiers, loyaltyAnalytics, updateLoyaltyReward, viewCustomerLoyalty, viewLoyaltyReward } from './controllers/loyaltyController';
import { aiRecommendations, analyticsDashboard, automatedReports, createReportSchedule, customerAnalytics, deleteReportSchedule, executiveDashboard, predictiveAnalytics, realTimeMetrics, runReportNow, storeSalesDashboard, updateReportSchedule } from './controllers/analyticsController';
import { createRole, createUser, createUserForm, deleteRole, deleteUser, listRoles, listUsers, updateRole, updateUser, viewUser } from './controllers/usersController';
import { businessInfo, createCurrency, createLanguage, deleteCurrency, deleteLanguage, storeSettings, updateBusinessInfo, updateCurrency, updateLanguage, updateStoreSettings } from './controllers/settingsController';
import { adjustStock, approveDispatch, cancelDispatch, createDispatch, createDispatchForm, listDispatches, listInventory, listLocations, lowStockReport, markDispatched, receiveDispatch, viewDispatch, viewInventoryHistory } from './controllers/inventoryController';
import { createTaxClass, createTaxRate, createTaxZone, deleteTaxClass, deleteTaxRate, deleteTaxZone, listTaxSettings, updateTaxClass, updateTaxRate, updateTaxZone } from './controllers/taxController';
import { loyaltyDashboard, membershipDashboard, subscriptionDashboard } from './controllers/programsController';
import { operationsDashboard } from './controllers/operationsController';
import { completeGdprRequest, consentManagement, createGdprRequest, gdprDashboard, processGdprRequest, viewGdprRequest } from './controllers/gdprController';
import { createFaq, deleteFaq, listFaqs, listSupportTickets, supportDashboard, updateFaq, updateTicketStatus, viewSupportTicket } from './controllers/supportController';
import { createCategory, createCategoryForm, createCollection, createCollectionForm, deleteCategory, deleteCollection, editCategoryForm, editCollectionForm, listCategories, listCollections, reorderCategories, updateCategory, updateCollection, viewCategory, viewCollection } from './controllers/assortmentController';
import { createPriceList, createPriceListForm, createPriceRule, createPriceRuleForm, deletePriceList, deletePriceRule, editPriceListForm, editPriceRuleForm, listPriceLists, listPriceRules, updatePriceList, updatePriceRule, viewPriceList, viewPriceRule } from './controllers/pricingController';
import { createCurrency as createCurrencyLocalization, createCurrencyForm, createLanguage as createLanguageLocalization, createLanguageForm, createRegion, createRegionForm, deleteCurrency as deleteCurrencyLocalization, deleteLanguage as deleteLanguageLocalization, deleteRegion, editCurrencyForm, editLanguageForm, editRegionForm, listCurrencies, listLanguages, listRegions, localizationDashboard, updateCurrency as updateCurrencyLocalization, updateLanguage as updateLanguageLocalization, updateRegion } from './controllers/localizationController';
import { approveOrganization, createOrganization, createOrganizationForm, deleteOrganization, editOrganizationForm, listOrganizations, suspendOrganization, updateOrganization, viewOrganization } from './controllers/organizationController';
import { bulkDeleteMedia, createFolder, deleteMedia, editMediaForm, listMedia, updateMedia, uploadMedia, uploadMediaForm, viewMedia } from './controllers/mediaController';
import { checkoutSettings, listPaymentMethods as listPaymentMethodsCheckout, listShippingOptions, updateCheckoutSettings, updatePaymentMethodOrder, updateShippingOptionOrder } from './controllers/checkoutController';
import { assignUserToStore, createStore, createStoreForm, editStoreForm, listStores, manageStoreUsers, removeUserFromStore, updateStore, viewStore } from './controllers/storeController';
import { createSchedule, createScheduleForm, deleteSchedule, editScheduleForm, generateReport, listSchedules, reportingDashboard, updateSchedule, viewSchedule } from './controllers/reportingController';
import { activateAutomationRule, createAutomationRule, createAutomationRuleForm, deactivateAutomationRule, deleteAutomationRule, editAutomationRuleForm, listAutomationRules, triggerAutomationRule, updateAutomationRule, viewAutomationRule } from './controllers/automationController';
import { approveReturn, cancelReturn, completeInspection, completeReturn, createReturn, createReturnForm, denyReturn, listReturns, markInTransit, markReceived, viewReturn, viewStoreCredit } from './controllers/returnsController';
import { activateIntegration, addCredential, createIntegration, createIntegrationForm, createSubscription, deactivateIntegration, deleteCredential, deleteIntegration, deleteSubscription, listIntegrations, updateIntegration, updateSubscription, viewIntegration } from './controllers/integrationController';

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

router.get('/catalog/categories', asyncHandler(listCategories));
router.get('/catalog/categories/create', asyncHandler(createCategoryForm));
router.post('/catalog/categories', asyncHandler(createCategory));
router.get('/catalog/categories/:categoryId', asyncHandler(viewCategory));
router.get('/catalog/categories/:categoryId/edit', asyncHandler(editCategoryForm));
router.post('/catalog/categories/:categoryId', asyncHandler(updateCategory));
router.put('/catalog/categories/:categoryId', asyncHandler(updateCategory));
router.delete('/catalog/categories/:categoryId', asyncHandler(deleteCategory));
router.post('/catalog/categories/reorder', asyncHandler(reorderCategories));

// ============================================================================
// Catalog - Collections Routes
// ============================================================================

router.get('/catalog/collections', asyncHandler(listCollections));
router.get('/catalog/collections/create', asyncHandler(createCollectionForm));
router.post('/catalog/collections', asyncHandler(createCollection));
router.get('/catalog/collections/:collectionId', asyncHandler(viewCollection));
router.get('/catalog/collections/:collectionId/edit', asyncHandler(editCollectionForm));
router.post('/catalog/collections/:collectionId', asyncHandler(updateCollection));
router.put('/catalog/collections/:collectionId', asyncHandler(updateCollection));
router.delete('/catalog/collections/:collectionId', asyncHandler(deleteCollection));

// ============================================================================
// Catalog - Pricing Routes
// ============================================================================

router.get('/catalog/pricing', asyncHandler(listPriceLists));
router.get('/catalog/pricing/lists/create', asyncHandler(createPriceListForm));
router.post('/catalog/pricing/lists', asyncHandler(createPriceList));
router.get('/catalog/pricing/lists/:listId', asyncHandler(viewPriceList));
router.get('/catalog/pricing/lists/:listId/edit', asyncHandler(editPriceListForm));
router.post('/catalog/pricing/lists/:listId', asyncHandler(updatePriceList));
router.put('/catalog/pricing/lists/:listId', asyncHandler(updatePriceList));
router.delete('/catalog/pricing/lists/:listId', asyncHandler(deletePriceList));

router.get('/catalog/pricing/rules', asyncHandler(listPriceRules));
router.get('/catalog/pricing/rules/create', asyncHandler(createPriceRuleForm));
router.post('/catalog/pricing/rules', asyncHandler(createPriceRule));
router.get('/catalog/pricing/rules/:ruleId', asyncHandler(viewPriceRule));
router.get('/catalog/pricing/rules/:ruleId/edit', asyncHandler(editPriceRuleForm));
router.post('/catalog/pricing/rules/:ruleId', asyncHandler(updatePriceRule));
router.put('/catalog/pricing/rules/:ruleId', asyncHandler(updatePriceRule));
router.delete('/catalog/pricing/rules/:ruleId', asyncHandler(deletePriceRule));

// ============================================================================
// Product Routes
// ============================================================================

router.get('/products', asyncHandler(listProducts));
router.get('/products/create', asyncHandler(createProductForm));
router.post('/products', asyncHandler(createProduct));

// Product Categories (standalone productCategory records)
router.get('/products/categories', asyncHandler(listProductCategories));
router.get('/products/categories/create', asyncHandler(createProductCategoryForm));
router.post('/products/categories', asyncHandler(createProductCategory));
router.get('/products/categories/:categoryId/edit', asyncHandler(editProductCategoryForm));
router.post('/products/categories/:categoryId', asyncHandler(updateProductCategory));
router.delete('/products/categories/:categoryId', asyncHandler(deleteProductCategory));

// Product Tags
router.get('/products/tags', asyncHandler(listProductTags));
router.post('/products/tags', asyncHandler(createProductTag));
router.delete('/products/tags/:tagId', asyncHandler(deleteProductTag));

// Product Collections
router.get('/products/collections', asyncHandler(listProductCollections));
router.get('/products/collections/create', asyncHandler(createProductCollectionForm));
router.post('/products/collections', asyncHandler(createProductCollection));
router.get('/products/collections/:collectionId/edit', asyncHandler(editProductCollectionForm));
router.post('/products/collections/:collectionId', asyncHandler(updateProductCollection));
router.delete('/products/collections/:collectionId', asyncHandler(deleteProductCollection));

router.get('/products/:productId', asyncHandler(viewProduct));
router.get('/products/:productId/edit', asyncHandler(editProductForm));
router.post('/products/:productId', asyncHandler(updateProduct)); // Form POST (method override)
router.put('/products/:productId', asyncHandler(updateProduct)); // API PUT
router.delete('/products/:productId', asyncHandler(deleteProduct));
router.post('/products/:productId/status', asyncHandler(updateProductStatus));
router.post('/products/:productId/publish', asyncHandler(publishProduct));
router.post('/products/:productId/unpublish', asyncHandler(unpublishProduct));

// Product Q&A
router.get('/products/:productId/qa', asyncHandler(listProductQa));
router.post('/products/:productId/qa/:qaId/status', asyncHandler(updateQaStatus));

// Product Review Media
router.get('/products/:productId/reviews/media', asyncHandler(listReviewMedia));
router.delete('/products/:productId/reviews/media/:mediaId', asyncHandler(deleteReviewMedia));

// Product Prices
router.get('/products/:productId/prices', asyncHandler(listProductPrices));
router.post('/products/:productId/prices', asyncHandler(upsertProductPrice));

// ============================================================================
// Order Routes
// ============================================================================

router.get('/orders', asyncHandler(listOrders));
router.get('/orders/:orderId', asyncHandler(viewOrder));
router.post('/orders/:orderId/status', asyncHandler(updateOrderStatus));
router.post('/orders/:orderId/cancel', asyncHandler(cancelOrder));
router.get('/orders/:orderId/refund', asyncHandler(refundForm));
router.post('/orders/:orderId/refund', asyncHandler(processRefund));

// Order sub-sections (notes, refunds, packages)
router.get('/orders/:orderId/notes', asyncHandler(listOrderNotes));
router.post('/orders/:orderId/notes', asyncHandler(addOrderNote));
router.post('/orders/:orderId/notes/:noteId/delete', asyncHandler(deleteOrderNote));
router.get('/orders/:orderId/refunds', asyncHandler(listOrderRefunds));
router.get('/orders/:orderId/packages', asyncHandler(listFulfillmentPackages));
router.post('/orders/:orderId/packages/:packageId/tracking', asyncHandler(updatePackageTracking));

// ============================================================================
// Store Routes
// ============================================================================

router.get('/stores', asyncHandler(listStores));
router.get('/stores/create', asyncHandler(createStoreForm));
router.post('/stores', asyncHandler(createStore));
router.get('/stores/:storeId', asyncHandler(viewStore));
router.get('/stores/:storeId/edit', asyncHandler(editStoreForm));
router.post('/stores/:storeId', asyncHandler(updateStore));
router.get('/stores/:storeId/users', asyncHandler(manageStoreUsers));
router.post('/stores/:storeId/users', asyncHandler(assignUserToStore));
router.delete('/stores/:storeId/users/:userId', asyncHandler(removeUserFromStore));

// ============================================================================
// Organization Routes
// ============================================================================

router.get('/organizations', asyncHandler(listOrganizations));
router.get('/organizations/create', asyncHandler(createOrganizationForm));
router.post('/organizations', asyncHandler(createOrganization));
router.get('/organizations/:organizationId', asyncHandler(viewOrganization));
router.get('/organizations/:organizationId/edit', asyncHandler(editOrganizationForm));
router.post('/organizations/:organizationId', asyncHandler(updateOrganization));
router.delete('/organizations/:organizationId', asyncHandler(deleteOrganization));

// ============================================================================
// Reporting Routes
// ============================================================================

router.get('/reporting', asyncHandler(reportingDashboard));
router.post('/reporting/generate', asyncHandler(generateReport));
router.get('/reporting/schedules', asyncHandler(listSchedules));
router.get('/reporting/schedules/create', asyncHandler(createScheduleForm));
router.post('/reporting/schedules', asyncHandler(createSchedule));
router.get('/reporting/schedules/:scheduleId', asyncHandler(viewSchedule));
router.get('/reporting/schedules/:scheduleId/edit', asyncHandler(editScheduleForm));
router.post('/reporting/schedules/:scheduleId', asyncHandler(updateSchedule));
router.delete('/reporting/schedules/:scheduleId', asyncHandler(deleteSchedule));

// ============================================================================
// Customer Routes
// ============================================================================

router.get('/customers', asyncHandler(listCustomers));
router.get('/customers/:customerId', asyncHandler(viewCustomer));
router.get('/customers/:customerId/edit', asyncHandler(editCustomerForm));
router.post('/customers/:customerId', asyncHandler(updateCustomer)); // Form POST
router.put('/customers/:customerId', asyncHandler(updateCustomer)); // API PUT
router.post('/customers/:customerId/deactivate', asyncHandler(deactivateCustomer));
router.post('/customers/:customerId/reactivate', asyncHandler(reactivateCustomer));
router.post('/customers/:customerId/verify', asyncHandler(verifyCustomer));
router.get('/customers/:customerId/addresses', asyncHandler(customerAddresses));
router.post('/customers/:customerId/addresses', asyncHandler(addCustomerAddress));

// ============================================================================
// Inventory Routes
// ============================================================================

router.get('/inventory', asyncHandler(listInventory));
router.post('/inventory/adjust', asyncHandler(adjustStock));
router.get('/inventory/locations', asyncHandler(listLocations));
router.get('/inventory/low-stock', asyncHandler(lowStockReport));
router.get('/inventory/:inventoryLevelId/history', asyncHandler(viewInventoryHistory));
router.get('/dispatches', asyncHandler(listDispatches));
router.get('/dispatches/create', asyncHandler(createDispatchForm));
router.post('/dispatches', asyncHandler(createDispatch));
router.get('/dispatches/:dispatchId', asyncHandler(viewDispatch));
router.post('/dispatches/:dispatchId/approve', asyncHandler(approveDispatch));
router.post('/dispatches/:dispatchId/dispatch', asyncHandler(markDispatched));
router.post('/dispatches/:dispatchId/receive', asyncHandler(receiveDispatch));
router.post('/dispatches/:dispatchId/cancel', asyncHandler(cancelDispatch));

// ============================================================================
// Tax Routes
// ============================================================================

router.get('/tax', asyncHandler(listTaxSettings));
router.post('/tax/rates', asyncHandler(createTaxRate));
router.put('/tax/rates/:taxRateId', asyncHandler(updateTaxRate));
router.delete('/tax/rates/:taxRateId', asyncHandler(deleteTaxRate));
router.post('/tax/zones', asyncHandler(createTaxZone));
router.put('/tax/zones/:taxZoneId', asyncHandler(updateTaxZone));
router.delete('/tax/zones/:taxZoneId', asyncHandler(deleteTaxZone));
router.post('/tax/classes', asyncHandler(createTaxClass));
router.put('/tax/classes/:taxClassId', asyncHandler(updateTaxClass));
router.delete('/tax/classes/:taxClassId', asyncHandler(deleteTaxClass));

// ============================================================================
// Programs Dashboard Routes
// ============================================================================

router.get('/programs/membership', asyncHandler(membershipDashboard));
router.get('/programs/subscription', asyncHandler(subscriptionDashboard));
router.get('/programs/loyalty', asyncHandler(loyaltyDashboard));

// ============================================================================
// Operations Dashboard
// ============================================================================

router.get('/operations', asyncHandler(operationsDashboard));

// ============================================================================
// GDPR Compliance
// ============================================================================

router.get('/gdpr', asyncHandler(gdprDashboard));
router.post('/gdpr/requests', asyncHandler(createGdprRequest));
router.get('/gdpr/requests/:requestId', asyncHandler(viewGdprRequest));
router.post('/gdpr/requests/:requestId/process', asyncHandler(processGdprRequest));
router.post('/gdpr/requests/:requestId/complete', asyncHandler(completeGdprRequest));
router.get('/gdpr/consent', asyncHandler(consentManagement));

// ============================================================================
// Support Center
// ============================================================================

router.get('/support', asyncHandler(supportDashboard));
router.get('/support/tickets', asyncHandler(listSupportTickets));
router.get('/support/tickets/:ticketId', asyncHandler(viewSupportTicket));
router.post('/support/tickets/:ticketId/status', asyncHandler(updateTicketStatus));
router.get('/support/faqs', asyncHandler(listFaqs));
router.post('/support/faqs', asyncHandler(createFaq));
router.put('/support/faqs/:faqId', asyncHandler(updateFaq));
router.delete('/support/faqs/:faqId', asyncHandler(deleteFaq));

// ============================================================================
// Promotion Routes
// ============================================================================

router.get('/promotions', asyncHandler(listPromotions));
router.get('/promotions/create', asyncHandler(createPromotionForm));
router.post('/promotions', asyncHandler(createPromotion));
router.get('/promotions/:promotionId', asyncHandler(viewPromotion));
router.get('/promotions/:promotionId/edit', asyncHandler(editPromotionForm));
router.post('/promotions/:promotionId', asyncHandler(updatePromotion)); // Form POST
router.put('/promotions/:promotionId', asyncHandler(updatePromotion)); // API PUT
router.delete('/promotions/:promotionId', asyncHandler(deletePromotion));

// ============================================================================
// Coupon Routes
// ============================================================================

router.get('/promotions/coupons', asyncHandler(listCoupons));
router.get('/promotions/coupons/create', asyncHandler(createCouponForm));
router.post('/promotions/coupons', asyncHandler(createCoupon));
router.get('/promotions/coupons/:couponId', asyncHandler(viewCoupon));
router.get('/promotions/coupons/:couponId/edit', asyncHandler(editCouponForm));
router.post('/promotions/coupons/:couponId', asyncHandler(updateCoupon));
router.delete('/promotions/coupons/:couponId', asyncHandler(deleteCoupon));
router.post('/promotions/coupons/validate', asyncHandler(validateCoupon));

// ============================================================================
// Gift Card Routes
// ============================================================================

router.get('/promotions/gift-cards', asyncHandler(listGiftCards));
router.get('/promotions/gift-cards/create', asyncHandler(createGiftCardForm));
router.post('/promotions/gift-cards', asyncHandler(createGiftCard));
router.get('/promotions/gift-cards/:giftCardId', asyncHandler(viewGiftCard));
router.get('/promotions/gift-cards/:giftCardId/edit', asyncHandler(editGiftCardForm));
router.post('/promotions/gift-cards/:giftCardId/activate', asyncHandler(activateGiftCardAction));
router.post('/promotions/gift-cards/:giftCardId/assign', asyncHandler(assignGiftCardAction));
router.post('/promotions/gift-cards/:giftCardId/reload', asyncHandler(reloadGiftCardAction));
router.post('/promotions/gift-cards/:giftCardId/refund', asyncHandler(refundToGiftCardAction));
router.post('/promotions/gift-cards/:giftCardId/cancel', asyncHandler(cancelGiftCardAction));
router.get('/promotions/gift-cards/balance/:code', asyncHandler(checkGiftCardBalance));

// ============================================================================
// Payment Routes
// ============================================================================

router.get('/payments', asyncHandler(listPaymentGateways));
router.get('/payments/gateways', asyncHandler(listPaymentGateways));
router.get('/payments/gateways/create', asyncHandler(createPaymentGatewayForm));
router.post('/payments/gateways', asyncHandler(createPaymentGateway));
router.get('/payments/gateways/:gatewayId', asyncHandler(viewPaymentGateway));
router.get('/payments/gateways/:gatewayId/edit', asyncHandler(editPaymentGatewayForm));
router.post('/payments/gateways/:gatewayId', asyncHandler(updatePaymentGateway));
router.delete('/payments/gateways/:gatewayId', asyncHandler(deletePaymentGateway));

router.get('/payments/methods', asyncHandler(listPaymentMethods));
router.get('/payments/transactions', asyncHandler(listPaymentTransactions));

// Payment Disputes
router.get('/payments/disputes', asyncHandler(listDisputes));
router.get('/payments/disputes/:disputeId', asyncHandler(viewDispute));
router.post('/payments/disputes/:disputeId/status', asyncHandler(updateDisputeStatus));

// Payment Fees
router.get('/payments/fees', asyncHandler(listPaymentFees));

// Payment Settings
router.get('/payments/settings', asyncHandler(listPaymentSettings));
router.post('/payments/settings/:organizationId', asyncHandler(updatePaymentSettings));

// Payment Balance
router.get('/payments/balance', asyncHandler(viewPaymentBalance));

// Payment Reports
router.get('/payments/reports', asyncHandler(listPaymentReports));
router.get('/payments/reports/:reportId', asyncHandler(viewPaymentReport));

// ============================================================================
// Shipping Routes
// ============================================================================

// Shipping overview - redirect to methods
router.get('/shipping', asyncHandler(listShippingMethods));
router.get('/shipping/methods/create', asyncHandler(createShippingMethodForm));
router.post('/shipping/methods', asyncHandler(createShippingMethod));
router.get('/shipping/methods/:methodId', asyncHandler(viewShippingMethod));
router.get('/shipping/methods/:methodId/edit', asyncHandler(editShippingMethodForm));
router.post('/shipping/methods/:methodId', asyncHandler(updateShippingMethod));
router.delete('/shipping/methods/:methodId', asyncHandler(deleteShippingMethod));
router.post('/shipping/methods/:methodId/activate', asyncHandler(activateShippingMethod));
router.post('/shipping/methods/:methodId/deactivate', asyncHandler(deactivateShippingMethod));

// ============================================================================
// Shipping Zones Routes
// ============================================================================

router.get('/shipping/zones', asyncHandler(listShippingZones));
router.get('/shipping/zones/create', asyncHandler(createShippingZoneForm));
router.post('/shipping/zones', asyncHandler(createShippingZone));
router.get('/shipping/zones/:zoneId', asyncHandler(viewShippingZone));
router.get('/shipping/zones/:zoneId/edit', asyncHandler(editShippingZoneForm));
router.post('/shipping/zones/:zoneId', asyncHandler(updateShippingZone));
router.post('/shipping/zones/:zoneId/activate', asyncHandler(activateShippingZone));
router.post('/shipping/zones/:zoneId/deactivate', asyncHandler(deactivateShippingZone));
router.delete('/shipping/zones/:zoneId', asyncHandler(deleteShippingZone));

// ============================================================================
// Shipping Rates Routes
// ============================================================================

router.get('/shipping/rates', asyncHandler(listShippingRates));
router.get('/shipping/rates/create', asyncHandler(createShippingRateForm));
router.post('/shipping/rates', asyncHandler(createShippingRate));
router.get('/shipping/rates/:rateId', asyncHandler(viewShippingRate));
router.get('/shipping/rates/:rateId/edit', asyncHandler(editShippingRateForm));
router.post('/shipping/rates/:rateId', asyncHandler(updateShippingRate));
router.post('/shipping/rates/:rateId/activate', asyncHandler(activateShippingRate));
router.post('/shipping/rates/:rateId/deactivate', asyncHandler(deactivateShippingRate));
router.delete('/shipping/rates/:rateId', asyncHandler(deleteShippingRate));
router.post('/shipping/rates/calculate', asyncHandler(calculateShippingRate));

router.get('/content/pages', asyncHandler(listContentPages));
router.get('/content/pages/create', asyncHandler(createContentPageForm));
router.post('/content/pages', asyncHandler(createContentPage));
router.get('/content/pages/:pageId', asyncHandler(viewContentPage));
router.get('/content/pages/:pageId/edit', asyncHandler(editContentPageForm));
router.post('/content/pages/:pageId', asyncHandler(updateContentPage));
router.post('/content/pages/:pageId/publish', asyncHandler(publishContentPage));
router.delete('/content/pages/:pageId', asyncHandler(deleteContentPage));

router.get('/content/templates', asyncHandler(listContentTemplates));
router.get('/content/media', asyncHandler(listContentMedia));

// ============================================================================
// SEO Routes
// ============================================================================

router.get('/marketing/seo', asyncHandler(listSEOSettings));
router.post('/marketing/seo', asyncHandler(updateSEOSettings));
router.get('/marketing/seo/robots.txt', asyncHandler(generateRobotsTxt));
router.get('/marketing/seo/sitemap.xml', asyncHandler(generateSitemap));

// ============================================================================
// Notification Routes
// ============================================================================

router.get('/notifications/templates', asyncHandler(listNotificationTemplates));
router.get('/notifications/templates/create', asyncHandler(createNotificationTemplateForm));
router.post('/notifications/templates', asyncHandler(createNotificationTemplate));
router.get('/notifications/templates/:templateId', asyncHandler(viewNotificationTemplate));
router.get('/notifications/templates/:templateId/edit', asyncHandler(editNotificationTemplateForm));
router.post('/notifications/templates/:templateId', asyncHandler(updateNotificationTemplate));
router.post('/notifications/templates/:templateId/activate', asyncHandler(activateNotificationTemplate));
router.post('/notifications/templates/:templateId/deactivate', asyncHandler(deactivateNotificationTemplate));
router.delete('/notifications/templates/:templateId', asyncHandler(deleteNotificationTemplate));
router.post('/notifications/templates/:templateId/clone', asyncHandler(cloneNotificationTemplate));
router.post('/notifications/templates/:templateId/preview', asyncHandler(previewNotificationTemplate));
router.get('/notifications/templates/:templateId/translations', asyncHandler(listTemplateTranslations));
router.get('/notifications/batches', asyncHandler(listBatches));
router.get('/notifications/batches/:batchId', asyncHandler(viewBatch));
router.get('/notifications/webhooks', asyncHandler(listWebhooks));
router.get('/notifications/webhooks/create', asyncHandler(createWebhookForm));
router.post('/notifications/webhooks', asyncHandler(createWebhook));
router.post('/notifications/webhooks/:webhookId/deactivate', asyncHandler(deactivateWebhook));

// ============================================================================
// Content Blocks Routes
// ============================================================================

router.get('/content/blocks', asyncHandler(listContentBlocks));
router.get('/content/blocks/create', asyncHandler(createContentBlockForm));
router.post('/content/blocks', asyncHandler(createContentBlock));
router.get('/content/blocks/:blockId/edit', asyncHandler(editContentBlockForm));
router.post('/content/blocks/:blockId', asyncHandler(updateContentBlock));
router.delete('/content/blocks/:blockId', asyncHandler(deleteContentBlock));
router.post('/content/pages/:pageId/reorder-blocks', asyncHandler(reorderContentBlocks));

// ============================================================================
// Operations Routes
// ============================================================================

// Warehouse Operations
router.get('/warehouses', asyncHandler(listWarehouses));
router.get('/warehouses/create', asyncHandler(createWarehouseForm));
router.post('/warehouses', asyncHandler(createWarehouse));
router.get('/warehouses/:warehouseId', asyncHandler(viewWarehouse));
router.get('/warehouses/:warehouseId/edit', asyncHandler(editWarehouseForm));
router.post('/warehouses/:warehouseId', asyncHandler(updateWarehouse));
router.post('/warehouses/:warehouseId/activate', asyncHandler(activateWarehouse));
router.post('/warehouses/:warehouseId/deactivate', asyncHandler(deactivateWarehouse));
router.delete('/warehouses/:warehouseId', asyncHandler(deleteWarehouse));

// Order Fulfillments
router.get('/fulfillments', asyncHandler(listFulfillments));
router.get('/fulfillments/:fulfillmentId', asyncHandler(viewFulfillment));
router.post('/fulfillments/:fulfillmentId/status', asyncHandler(updateFulfillmentStatus));
router.post('/fulfillments/:fulfillmentId/shipped', asyncHandler(markAsShipped));
router.post('/fulfillments/:fulfillmentId/delivered', asyncHandler(markAsDelivered));
router.post('/fulfillments/:fulfillmentId/cancel', asyncHandler(cancelFulfillment));
router.get('/fulfillments/stats', asyncHandler(getFulfillmentStats));

// Supplier Management
router.get('/suppliers', asyncHandler(listSuppliers));
router.get('/suppliers/create', asyncHandler(createSupplierForm));
router.post('/suppliers', asyncHandler(createSupplier));
router.get('/suppliers/:supplierId', asyncHandler(viewSupplier));
router.get('/suppliers/:supplierId/edit', asyncHandler(editSupplierForm));
router.post('/suppliers/:supplierId', asyncHandler(updateSupplier));
router.post('/suppliers/:supplierId/approve', asyncHandler(approveSupplier));
router.post('/suppliers/:supplierId/suspend', asyncHandler(suspendSupplier));
router.post('/suppliers/:supplierId/activate', asyncHandler(activateSupplier));
router.post('/suppliers/:supplierId/deactivate', asyncHandler(deactivateSupplier));
router.delete('/suppliers/:supplierId', asyncHandler(deleteSupplier));

// Cart Analytics
router.get('/baskets/abandoned', asyncHandler(listAbandonedCarts));
router.get('/baskets/abandoned/:basketId', asyncHandler(viewAbandonedCart));
router.post('/baskets/abandoned/:basketId/recover', asyncHandler(recoverAbandonedCart));
router.post('/baskets/abandoned/:basketId/email', asyncHandler(sendRecoveryEmail));
router.post('/baskets/abandoned/:basketId/recovered', asyncHandler(markCartRecovered));
router.post('/baskets/cleanup-expired', asyncHandler(cleanupExpiredBaskets));
router.get('/baskets/analytics', asyncHandler(basketAnalytics));

// Warehouse Dashboard
router.get('/operations/dashboard', asyncHandler(warehouseDashboard));

// ============================================================================
// Customer Programs Routes
// ============================================================================

// Membership Plans
router.get('/membership/plans', asyncHandler(listMembershipPlans));
router.get('/membership/plans/create', asyncHandler(createMembershipPlanForm));
router.post('/membership/plans', asyncHandler(createMembershipPlan));
router.get('/membership/plans/:planId', asyncHandler(viewMembershipPlan));
router.get('/membership/plans/:planId/edit', asyncHandler(editMembershipPlanForm));
router.post('/membership/plans/:planId', asyncHandler(updateMembershipPlan));
router.post('/membership/plans/:planId/activate', asyncHandler(activateMembershipPlan));
router.post('/membership/plans/:planId/deactivate', asyncHandler(deactivateMembershipPlan));
router.delete('/membership/plans/:planId', asyncHandler(deleteMembershipPlan));

// Membership Benefits
router.get('/membership/benefits', asyncHandler(listMembershipBenefits));

// Memberships (User memberships)
router.get('/membership/memberships', asyncHandler(listMemberships));

// Membership Advanced Operations
router.post('/membership/bulk-operations', asyncHandler(bulkMembershipOperations));
router.post('/membership/memberships/:membershipId/change-tier', asyncHandler(membershipUpgradeDowngrade));
router.get('/membership/analytics', asyncHandler(membershipAnalytics));

// Subscription Plans
router.get('/subscription/plans', asyncHandler(listSubscriptionPlans));
router.get('/subscription/plans/create', asyncHandler(createSubscriptionPlanForm));
router.post('/subscription/plans', asyncHandler(createSubscriptionPlan));
router.get('/subscription/plans/:planId', asyncHandler(viewSubscriptionPlan));
router.get('/subscription/plans/:planId/edit', asyncHandler(editSubscriptionPlanForm));
router.post('/subscription/plans/:planId', asyncHandler(updateSubscriptionPlan));
router.delete('/subscription/plans/:planId', asyncHandler(deleteSubscriptionPlan));

// Customer Subscriptions
router.get('/subscription/subscriptions', asyncHandler(listCustomerSubscriptions));
router.get('/subscription/subscriptions/:subscriptionId', asyncHandler(viewCustomerSubscription));
router.post('/subscription/subscriptions/:subscriptionId/status', asyncHandler(updateSubscriptionStatus));
router.post('/subscription/subscriptions/:subscriptionId/cancel', asyncHandler(cancelCustomerSubscription));

// Subscription Billing
router.get('/subscription/billing', asyncHandler(subscriptionBilling));
router.post('/subscription/billing/:subscriptionId/process', asyncHandler(processSubscriptionBilling));
router.post('/subscription/billing/:subscriptionId/manage', asyncHandler(manageFailedPayments));

// Loyalty Tiers
router.get('/loyalty/tiers', asyncHandler(listLoyaltyTiers));

// Loyalty Rewards
router.get('/loyalty/rewards', asyncHandler(listLoyaltyRewards));
router.get('/loyalty/rewards/create', asyncHandler(createLoyaltyRewardForm));
router.post('/loyalty/rewards', asyncHandler(createLoyaltyReward));
router.get('/loyalty/rewards/:rewardId', asyncHandler(viewLoyaltyReward));
router.get('/loyalty/rewards/:rewardId/edit', asyncHandler(editLoyaltyRewardForm));
router.post('/loyalty/rewards/:rewardId', asyncHandler(updateLoyaltyReward));
router.delete('/loyalty/rewards/:rewardId', asyncHandler(deleteLoyaltyReward));

// Customer Loyalty
router.get('/loyalty/customers', asyncHandler(listCustomerLoyalty));
router.get('/loyalty/customers/:customerId', asyncHandler(viewCustomerLoyalty));

// Loyalty Analytics
router.get('/loyalty/analytics', asyncHandler(loyaltyAnalytics));

// ============================================================================
// Advanced Analytics & Intelligence (Phase 7)
// ============================================================================

// Analytics Dashboard
router.get('/analytics', asyncHandler(analyticsDashboard));
router.get('/analytics/dashboard', asyncHandler(analyticsDashboard));
router.get('/analytics/store-sales', asyncHandler(storeSalesDashboard));

// Predictive Analytics
router.get('/analytics/predictive', asyncHandler(predictiveAnalytics));

// Customer Analytics
router.get('/analytics/customers', asyncHandler(customerAnalytics));
router.get('/analytics/customers/:segmentId', asyncHandler(customerAnalytics));

// AI Recommendations
router.get('/analytics/ai-recommendations', asyncHandler(aiRecommendations));

// Executive Dashboard
router.get('/analytics/executive', asyncHandler(executiveDashboard));

// Real-time Metrics API
router.get('/api/analytics/realtime', asyncHandler(realTimeMetrics));

// Automated Reporting Management
router.get('/analytics/reports', asyncHandler(automatedReports));
router.post('/analytics/reports/schedules', asyncHandler(createReportSchedule));
router.put('/analytics/reports/schedules/:scheduleId', asyncHandler(updateReportSchedule));
router.delete('/analytics/reports/schedules/:scheduleId', asyncHandler(deleteReportSchedule));
router.post('/analytics/reports/run-now', asyncHandler(runReportNow));

// ============================================================================
// Admin Users & Roles (Phase 8)
// ============================================================================

// Admin Users
router.get('/users', asyncHandler(listUsers));
router.get('/users/create', asyncHandler(createUserForm));
router.post('/users', asyncHandler(createUser));
router.get('/users/:userId', asyncHandler(viewUser));
router.put('/users/:userId', asyncHandler(updateUser));
router.delete('/users/:userId', asyncHandler(deleteUser));

// Roles & Permissions
router.get('/roles', asyncHandler(listRoles));
router.post('/roles', asyncHandler(createRole));
router.put('/roles/:roleId', asyncHandler(updateRole));
router.delete('/roles/:roleId', asyncHandler(deleteRole));

// ============================================================================
// Settings (Phase 8)
// ============================================================================

// Store Settings
router.get('/settings/store', asyncHandler(storeSettings));
router.post('/settings/store', asyncHandler(updateStoreSettings));

// Business Information
router.get('/settings/business', asyncHandler(businessInfo));
router.post('/settings/business', asyncHandler(updateBusinessInfo));

// Localization
router.get('/settings/localization', asyncHandler(localizationDashboard));
router.get('/settings/localization/languages', asyncHandler(listLanguages));
router.get('/settings/localization/languages/create', asyncHandler(createLanguageForm));
router.post('/settings/localization/languages', asyncHandler(createLanguageLocalization));
router.get('/settings/localization/languages/:languageId/edit', asyncHandler(editLanguageForm));
router.post('/settings/localization/languages/:languageId', asyncHandler(updateLanguageLocalization));
router.delete('/settings/localization/languages/:languageId', asyncHandler(deleteLanguageLocalization));

router.get('/settings/localization/currencies', asyncHandler(listCurrencies));
router.get('/settings/localization/currencies/create', asyncHandler(createCurrencyForm));
router.post('/settings/localization/currencies', asyncHandler(createCurrencyLocalization));
router.get('/settings/localization/currencies/:currencyId/edit', asyncHandler(editCurrencyForm));
router.post('/settings/localization/currencies/:currencyId', asyncHandler(updateCurrencyLocalization));
router.delete('/settings/localization/currencies/:currencyId', asyncHandler(deleteCurrencyLocalization));

router.get('/settings/localization/regions', asyncHandler(listRegions));
router.get('/settings/localization/regions/create', asyncHandler(createRegionForm));
router.post('/settings/localization/regions', asyncHandler(createRegion));
router.get('/settings/localization/regions/:regionId/edit', asyncHandler(editRegionForm));
router.post('/settings/localization/regions/:regionId', asyncHandler(updateRegion));
router.delete('/settings/localization/regions/:regionId', asyncHandler(deleteRegion));

// Legacy settings routes (keep for backward compatibility)
router.post('/settings/languages', asyncHandler(createLanguage));
router.put('/settings/languages/:languageId', asyncHandler(updateLanguage));
router.delete('/settings/languages/:languageId', asyncHandler(deleteLanguage));
router.post('/settings/currencies', asyncHandler(createCurrency));
router.put('/settings/currencies/:currencyId', asyncHandler(updateCurrency));
router.delete('/settings/currencies/:currencyId', asyncHandler(deleteCurrency));

// ============================================================================
// Checkout Settings Routes
// ============================================================================

router.get('/settings/checkout', asyncHandler(checkoutSettings));
router.post('/settings/checkout', asyncHandler(updateCheckoutSettings));
router.get('/settings/checkout/payment-methods', asyncHandler(listPaymentMethodsCheckout));
router.post('/settings/checkout/payment-methods/order', asyncHandler(updatePaymentMethodOrder));
router.get('/settings/checkout/shipping-options', asyncHandler(listShippingOptions));
router.post('/settings/checkout/shipping-options/order', asyncHandler(updateShippingOptionOrder));

// ============================================================================
// Organizations Routes
// ============================================================================

router.get('/operations/organizations', asyncHandler(listOrganizations));
router.get('/operations/organizations/create', asyncHandler(createOrganizationForm));
router.post('/operations/organizations', asyncHandler(createOrganization));

router.get('/operations/organizations/:organizationId', asyncHandler(viewOrganization));
router.get('/operations/organizations/:organizationId/edit', asyncHandler(editOrganizationForm));
router.post('/operations/organizations/:organizationId', asyncHandler(updateOrganization));
router.put('/operations/organizations/:organizationId', asyncHandler(updateOrganization));
router.delete('/operations/organizations/:organizationId', asyncHandler(deleteOrganization));
router.post('/operations/organizations/:organizationId/approve', asyncHandler(approveOrganization));
router.post('/operations/organizations/:organizationId/suspend', asyncHandler(suspendOrganization));

// ============================================================================
// Media Library Routes
// ============================================================================

router.get('/content/media', asyncHandler(listMedia));
router.get('/content/media/upload', asyncHandler(uploadMediaForm));
router.post('/content/media/upload', asyncHandler(uploadMedia));
router.get('/content/media/:mediaId', asyncHandler(viewMedia));
router.get('/content/media/:mediaId/edit', asyncHandler(editMediaForm));
router.post('/content/media/:mediaId', asyncHandler(updateMedia));
router.delete('/content/media/:mediaId', asyncHandler(deleteMedia));
router.post('/content/media/bulk-delete', asyncHandler(bulkDeleteMedia));
router.post('/content/media/folders', asyncHandler(createFolder));

// ============================================================================
// Automation Routes
// ============================================================================

router.get('/automation', asyncHandler(listAutomationRules));
router.get('/automation/create', asyncHandler(createAutomationRuleForm));
router.post('/automation', asyncHandler(createAutomationRule));
router.get('/automation/:ruleId', asyncHandler(viewAutomationRule));
router.get('/automation/:ruleId/edit', asyncHandler(editAutomationRuleForm));
router.post('/automation/:ruleId', asyncHandler(updateAutomationRule));
router.post('/automation/:ruleId/delete', asyncHandler(deleteAutomationRule));
router.post('/automation/:ruleId/activate', asyncHandler(activateAutomationRule));
router.post('/automation/:ruleId/deactivate', asyncHandler(deactivateAutomationRule));
router.post('/automation/:ruleId/trigger', asyncHandler(triggerAutomationRule));

// ============================================================================
// Returns & Store Credit Routes
// ============================================================================

router.get('/returns', asyncHandler(listReturns));
router.get('/returns/create', asyncHandler(createReturnForm));
router.post('/returns', asyncHandler(createReturn));
router.get('/returns/store-credit', asyncHandler(viewStoreCredit));
router.get('/returns/:returnId', asyncHandler(viewReturn));
router.post('/returns/:returnId/approve', asyncHandler(approveReturn));
router.post('/returns/:returnId/deny', asyncHandler(denyReturn));
router.post('/returns/:returnId/in-transit', asyncHandler(markInTransit));
router.post('/returns/:returnId/received', asyncHandler(markReceived));
router.post('/returns/:returnId/inspect', asyncHandler(completeInspection));
router.post('/returns/:returnId/complete', asyncHandler(completeReturn));
router.post('/returns/:returnId/cancel', asyncHandler(cancelReturn));

// ============================================================================
// Page Builder Routes
// ============================================================================

router.get('/page-builder', asyncHandler(listPageBuilderDrafts));
router.get('/page-builder/create', asyncHandler(createDraftForm));
router.post('/page-builder/create', asyncHandler(createDraft));
router.get('/page-builder/:draftId', asyncHandler(pageBuilderEditor));
router.get('/page-builder/:draftId/preview', asyncHandler(pageBuilderPreview));
router.post('/page-builder/:draftId/publish', asyncHandler(publishDraft));
router.delete('/page-builder/:draftId', asyncHandler(deleteDraft));

// ============================================================================
// Theme Management Routes
// ============================================================================

router.get('/themes', asyncHandler(listThemes));
router.get('/themes/:themeId', asyncHandler(themeDetail));
router.get('/themes/:themeId/preview', asyncHandler(themePreview));
router.post('/themes/:themeId/assign', asyncHandler(assignTheme));
router.post('/themes/:themeId/unassign', asyncHandler(unassignTheme));
router.post('/themes/:themeId/override', asyncHandler(saveOverride));
router.post('/themes/:themeId/activate', asyncHandler(activateTheme));
router.post('/themes/:themeId/archive', asyncHandler(archiveTheme));
router.post('/themes/:themeId/delete', asyncHandler(deleteTheme));

// ============================================================================
// Integrations Routes
// ============================================================================

router.get('/integrations', asyncHandler(listIntegrations));
router.get('/integrations/create', asyncHandler(createIntegrationForm));
router.post('/integrations', asyncHandler(createIntegration));
router.get('/integrations/:integrationId', asyncHandler(viewIntegration));
router.post('/integrations/:integrationId', asyncHandler(updateIntegration));
router.post('/integrations/:integrationId/activate', asyncHandler(activateIntegration));
router.post('/integrations/:integrationId/deactivate', asyncHandler(deactivateIntegration));
router.post('/integrations/:integrationId/delete', asyncHandler(deleteIntegration));
router.post('/integrations/:integrationId/credentials', asyncHandler(addCredential));
router.post('/integrations/:integrationId/credentials/:credentialId/delete', asyncHandler(deleteCredential));
router.post('/integrations/:integrationId/subscriptions', asyncHandler(createSubscription));
router.post('/integrations/:integrationId/subscriptions/:subscriptionId', asyncHandler(updateSubscription));
router.post('/integrations/:integrationId/subscriptions/:subscriptionId/delete', asyncHandler(deleteSubscription));

export const adminRouter = router;
