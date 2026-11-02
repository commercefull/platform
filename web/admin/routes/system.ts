import type { HttpRouter } from 'libs/http';
import { asyncHandler } from '../../../libs/asyncHandler';
import {
  createRole,
  createUser,
  createUserForm,
  deleteRole,
  deleteUser,
  listRoles,
  listUsers,
  updateRole,
  updateUser,
  viewUser,
} from '../../../modules/identity';
import {
  businessInfo,
  storeSettings,
  updateBusinessInfo,
  updateStoreSettings,
  createCurrencySetting as createCurrency,
  createLanguageSetting as createLanguage,
  deleteCurrencySetting as deleteCurrency,
  deleteLanguageSetting as deleteLanguage,
  updateCurrencySetting as updateCurrency,
  updateLanguageSetting as updateLanguage,
  createCurrency as createCurrencyLocalization,
  createCurrencyForm,
  createLanguage as createLanguageLocalization,
  createLanguageForm,
  createRegion,
  createRegionForm,
  deleteCurrency as deleteCurrencyLocalization,
  deleteLanguage as deleteLanguageLocalization,
  deleteRegion,
  editCurrencyForm,
  editLanguageForm,
  editRegionForm,
  listCurrencies,
  listLanguages,
  listRegions,
  localizationDashboard,
  updateCurrency as updateCurrencyLocalization,
  updateLanguage as updateLanguageLocalization,
  updateRegion,
} from '../../../modules/localization';
import {
  checkoutSettings,
  listPaymentMethods as listPaymentMethodsCheckout,
  listShippingOptions,
  updateCheckoutSettings,
  updatePaymentMethodOrder,
  updateShippingOptionOrder,
} from '../../../modules/checkout';
import {
  activateAutomationRule,
  createAutomationRule,
  createAutomationRuleForm,
  deactivateAutomationRule,
  deleteAutomationRule,
  editAutomationRuleForm,
  listAutomationRules,
  triggerAutomationRule,
  updateAutomationRule,
  viewAutomationRule,
} from '../../../modules/automation';
import {
  approveReturn,
  cancelReturn,
  completeInspection,
  completeReturn,
  createReturn,
  createReturnForm,
  denyReturn,
  listReturns,
  markInTransit,
  markReceived,
  viewReturn,
  viewStoreCredit,
  createReturnRule,
  deleteReturnRule,
  listReturnRules,
} from '../../../modules/returns';
import {
  activateIntegration,
  addCredential,
  createIntegration,
  createIntegrationForm,
  createSubscription,
  deactivateIntegration,
  deleteCredential,
  deleteIntegration,
  deleteSubscription,
  listIntegrations,
  updateIntegration,
  updateSubscription,
  viewIntegration,
} from '../../../modules/integration';
import { listAuditLogs, viewAuditLog, auditStats, verifyChain } from '../../../modules/audit';
import {
  listB2BCompanies,
  viewB2BCompany,
  createB2BCompanyForm,
  createB2BCompany,
  editB2BCompanyForm,
  updateB2BCompany,
  approveB2BCompany,
  suspendB2BCompany,
  reactivateB2BCompany,
  listB2BQuotes,
  viewB2BQuote,
} from '../../../modules/b2b';
import {
  listSystemConfigurations,
  viewSystemConfiguration,
  createSystemConfigurationForm,
  createSystemConfiguration,
  editSystemConfigurationForm,
  updateSystemConfiguration,
} from '../../../modules/configuration';
import {
  listVendors,
  viewVendor,
  createVendorForm,
  createVendor,
  editVendorForm,
  updateVendor,
  approveVendor,
  suspendVendor,
  listCommissionRules,
  viewCommissionRule,
  listPayouts,
  viewPayout,
} from '../../../modules/marketplace';
import {
  listSegments,
  viewSegment,
  createSegmentForm,
  createSegment,
  editSegmentForm,
  updateSegment,
  deleteSegment,
  evaluateSegment,
  viewSegmentMembers,
} from '../../../modules/segment';
import {
  listTrackingConfigs,
  viewTrackingConfig,
  createTrackingConfigForm,
  createTrackingConfig,
  editTrackingConfigForm,
  activateTrackingConfig,
  disableTrackingConfig,
  deleteTrackingConfig,
} from '../../../modules/tracking';
import {
  listWebhookEndpoints,
  viewWebhookEndpoint,
  createWebhookForm as createWebhookEndpointForm,
  createWebhook as createWebhookEndpoint,
  editWebhookForm as editWebhookEndpointForm,
  updateWebhook,
  deleteWebhook as deleteWebhookEndpoint,
  viewWebhookDeliveries,
} from '../../../modules/webhook';
import {
  listImportJobs,
  viewImportJob,
  createImportJobForm,
  createImportJob,
  startImportJob,
  pauseImportJob,
  cancelImportJob,
  deleteImportJob,
  viewImportMappings,
  viewImportErrors,
  resolveImportError,
} from '../../../modules/migration';

/**
 * System admin routes: users/roles, settings, automation, returns,
 * integrations, audit, B2B, configuration, marketplace, segments,
 * tracking, webhooks, and migration.
 */
export function registerSystemRoutes(router: HttpRouter): void {
  registerAccessAndSettingsRoutes(router);
  registerWorkflowRoutes(router);
  registerEcosystemRoutes(router);
}

/**
 * Admin users, roles, and settings (store, business, localization, checkout).
 */
function registerAccessAndSettingsRoutes(router: HttpRouter): void {
  // ==========================================================================
  // Admin Users & Roles (Phase 8)
  // ==========================================================================

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

  // ==========================================================================
  // Settings (Phase 8)
  // ==========================================================================

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

  // ==========================================================================
  // Checkout Settings Routes
  // ==========================================================================

  router.get('/settings/checkout', asyncHandler(checkoutSettings));
  router.post('/settings/checkout', asyncHandler(updateCheckoutSettings));
  router.get('/settings/checkout/payment-methods', asyncHandler(listPaymentMethodsCheckout));
  router.post('/settings/checkout/payment-methods/order', asyncHandler(updatePaymentMethodOrder));
  router.get('/settings/checkout/shipping-options', asyncHandler(listShippingOptions));
  router.post('/settings/checkout/shipping-options/order', asyncHandler(updateShippingOptionOrder));
}

/**
 * Automation, returns, integrations, and audit logs.
 */
function registerWorkflowRoutes(router: HttpRouter): void {
  // ==========================================================================
  // Automation Routes
  // ==========================================================================

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

  // ==========================================================================
  // Returns & Store Credit Routes
  // ==========================================================================

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

  // Return Rules (Epic F + Epic I)
  router.get('/returns/rules', asyncHandler(listReturnRules));
  router.post('/returns/rules', asyncHandler(createReturnRule));
  router.delete('/returns/rules/:returnRuleId', asyncHandler(deleteReturnRule));

  // ==========================================================================
  // Integrations Routes
  // ==========================================================================

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

  // ==========================================================================
  // Audit Logs Routes
  // ==========================================================================

  router.get('/audit', asyncHandler(listAuditLogs));
  router.get('/audit/stats', asyncHandler(auditStats));
  router.get('/audit/verify-chain', asyncHandler(verifyChain));
  router.get('/audit/:logId', asyncHandler(viewAuditLog));
}

/**
 * B2B, configuration, marketplace, segments, tracking, webhooks, migration.
 */
function registerEcosystemRoutes(router: HttpRouter): void {
  // ==========================================================================
  // B2B Routes
  // ==========================================================================

  router.get('/b2b/companies', asyncHandler(listB2BCompanies));
  router.get('/b2b/companies/create', asyncHandler(createB2BCompanyForm));
  router.post('/b2b/companies', asyncHandler(createB2BCompany));
  router.get('/b2b/companies/:companyId', asyncHandler(viewB2BCompany));
  router.get('/b2b/companies/:companyId/edit', asyncHandler(editB2BCompanyForm));
  router.post('/b2b/companies/:companyId', asyncHandler(updateB2BCompany));
  router.post('/b2b/companies/:companyId/approve', asyncHandler(approveB2BCompany));
  router.post('/b2b/companies/:companyId/suspend', asyncHandler(suspendB2BCompany));
  router.post('/b2b/companies/:companyId/reactivate', asyncHandler(reactivateB2BCompany));
  router.get('/b2b/quotes', asyncHandler(listB2BQuotes));
  router.get('/b2b/quotes/:quoteId', asyncHandler(viewB2BQuote));

  // ==========================================================================
  // System Configuration Routes
  // ==========================================================================

  router.get('/configuration', asyncHandler(listSystemConfigurations));
  router.get('/configuration/create', asyncHandler(createSystemConfigurationForm));
  router.post('/configuration', asyncHandler(createSystemConfiguration));
  router.get('/configuration/:configId', asyncHandler(viewSystemConfiguration));
  router.get('/configuration/:configId/edit', asyncHandler(editSystemConfigurationForm));
  router.post('/configuration/:configId', asyncHandler(updateSystemConfiguration));

  // ==========================================================================
  // Marketplace Routes
  // ==========================================================================

  router.get('/marketplace/vendors', asyncHandler(listVendors));
  router.get('/marketplace/vendors/create', asyncHandler(createVendorForm));
  router.post('/marketplace/vendors', asyncHandler(createVendor));
  router.get('/marketplace/vendors/:vendorId', asyncHandler(viewVendor));
  router.get('/marketplace/vendors/:vendorId/edit', asyncHandler(editVendorForm));
  router.post('/marketplace/vendors/:vendorId', asyncHandler(updateVendor));
  router.post('/marketplace/vendors/:vendorId/approve', asyncHandler(approveVendor));
  router.post('/marketplace/vendors/:vendorId/suspend', asyncHandler(suspendVendor));
  router.get('/marketplace/commissions', asyncHandler(listCommissionRules));
  router.get('/marketplace/commissions/:ruleId', asyncHandler(viewCommissionRule));
  router.get('/marketplace/payouts', asyncHandler(listPayouts));
  router.get('/marketplace/payouts/:payoutId', asyncHandler(viewPayout));

  // ==========================================================================
  // Segment Routes
  // ==========================================================================

  router.get('/segments', asyncHandler(listSegments));
  router.get('/segments/create', asyncHandler(createSegmentForm));
  router.post('/segments', asyncHandler(createSegment));
  router.get('/segments/:segmentId', asyncHandler(viewSegment));
  router.get('/segments/:segmentId/edit', asyncHandler(editSegmentForm));
  router.post('/segments/:segmentId', asyncHandler(updateSegment));
  router.post('/segments/:segmentId/delete', asyncHandler(deleteSegment));
  router.post('/segments/:segmentId/evaluate', asyncHandler(evaluateSegment));
  router.get('/segments/:segmentId/members', asyncHandler(viewSegmentMembers));

  // ==========================================================================
  // Tracking Routes
  // ==========================================================================

  router.get('/tracking', asyncHandler(listTrackingConfigs));
  router.get('/tracking/create', asyncHandler(createTrackingConfigForm));
  router.post('/tracking', asyncHandler(createTrackingConfig));
  router.get('/tracking/:storeId', asyncHandler(viewTrackingConfig));
  router.get('/tracking/:storeId/edit', asyncHandler(editTrackingConfigForm));
  router.post('/tracking/:storeId/activate', asyncHandler(activateTrackingConfig));
  router.post('/tracking/:storeId/disable', asyncHandler(disableTrackingConfig));
  router.post('/tracking/:storeId/delete', asyncHandler(deleteTrackingConfig));

  // ==========================================================================
  // Webhook Routes
  // ==========================================================================

  router.get('/webhooks', asyncHandler(listWebhookEndpoints));
  router.get('/webhooks/create', asyncHandler(createWebhookEndpointForm));
  router.post('/webhooks', asyncHandler(createWebhookEndpoint));
  router.get('/webhooks/:webhookEndpointId', asyncHandler(viewWebhookEndpoint));
  router.get('/webhooks/:webhookEndpointId/edit', asyncHandler(editWebhookEndpointForm));
  router.post('/webhooks/:webhookEndpointId', asyncHandler(updateWebhook));
  router.post('/webhooks/:webhookEndpointId/delete', asyncHandler(deleteWebhookEndpoint));
  router.get('/webhooks/:webhookEndpointId/deliveries', asyncHandler(viewWebhookDeliveries));

  // ==========================================================================
  // Migration Routes
  // ==========================================================================

  router.get('/migration', asyncHandler(listImportJobs));
  router.get('/migration/create', asyncHandler(createImportJobForm));
  router.post('/migration', asyncHandler(createImportJob));
  router.get('/migration/:importJobId', asyncHandler(viewImportJob));
  router.post('/migration/:importJobId/start', asyncHandler(startImportJob));
  router.post('/migration/:importJobId/pause', asyncHandler(pauseImportJob));
  router.post('/migration/:importJobId/cancel', asyncHandler(cancelImportJob));
  router.post('/migration/:importJobId/delete', asyncHandler(deleteImportJob));
  router.get('/migration/:importJobId/mappings', asyncHandler(viewImportMappings));
  router.get('/migration/:importJobId/errors', asyncHandler(viewImportErrors));
  router.post('/migration/:importJobId/errors/:importErrorId/resolve', asyncHandler(resolveImportError));
}
