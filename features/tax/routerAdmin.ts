import { Router } from 'express';
import taxController from './controllers/taxController';
import { isAdmin } from '../../libs/auth';

const taxAdminRouter = Router();

// Apply admin role verification to all routes

// -------------------- Tax Rate Routes --------------------
taxAdminRouter.get('/rates', isAdmin, (req, res) => {
  taxController.getAllTaxRates(req, res);
});

taxAdminRouter.get('/rates/:id', isAdmin, (req, res) => {
  taxController.getTaxRate(req, res);
});

taxAdminRouter.post('/rates', isAdmin, (req, res) => {
  taxController.createTaxRate(req, res);
});

taxAdminRouter.put('/rates/:id', isAdmin, (req, res) => {
  taxController.updateTaxRate(req, res);
});

taxAdminRouter.delete('/rates/:id', isAdmin, (req, res) => {
  taxController.deleteTaxRate(req, res);
});

// -------------------- Tax Category Routes --------------------
taxAdminRouter.get('/categories', isAdmin, (req, res) => {
  taxController.getAllTaxCategories(req, res);
});

taxAdminRouter.get('/categories/:id', isAdmin, (req, res) => {
  taxController.getTaxCategory(req, res);
});

taxAdminRouter.post('/categories', isAdmin, (req, res) => {
  taxController.createTaxCategory(req, res);
});

taxAdminRouter.put('/categories/:id', isAdmin, (req, res) => {
  taxController.updateTaxCategory(req, res);
});

taxAdminRouter.delete('/categories/:id', isAdmin, (req, res) => {
  taxController.deleteTaxCategory(req, res);
});

// -------------------- Tax Exemption Routes --------------------
taxAdminRouter.get('/exemptions/:id', isAdmin, (req, res) => {
  taxController.getTaxExemption(req, res);
});

taxAdminRouter.get('/exemptions/customer/:customerId', isAdmin, (req, res) => {
  taxController.getCustomerTaxExemptions(req, res);
});

taxAdminRouter.post('/exemptions', isAdmin, (req, res) => {
  taxController.createTaxExemption(req, res);
});

taxAdminRouter.put('/exemptions/:id', isAdmin, (req, res) => {
  taxController.updateTaxExemption(req, res);
});

taxAdminRouter.delete('/exemptions/:id', isAdmin, (req, res) => {
  taxController.deleteTaxExemption(req, res);
});

// -------------------- NEW: Tax Zone Routes --------------------
taxAdminRouter.get('/zones', isAdmin, (req, res) => {
  taxController.getAllTaxZones(req, res);
});

taxAdminRouter.get('/zones/:id', isAdmin, (req, res) => {
  taxController.getTaxZone(req, res);
});

taxAdminRouter.post('/zones', isAdmin, (req, res) => {
  taxController.createTaxZone(req, res);
});

taxAdminRouter.put('/zones/:id', isAdmin, (req, res) => {
  taxController.updateTaxZone(req, res);
});

taxAdminRouter.delete('/zones/:id', isAdmin, (req, res) => {
  taxController.deleteTaxZone(req, res);
});

taxAdminRouter.post('/zones/find-by-address', isAdmin, (req, res) => {
  taxController.getTaxZoneForAddress(req, res);
});

// -------------------- NEW: Tax Settings Routes --------------------
taxAdminRouter.get('/settings/:merchantId', isAdmin, (req, res) => {
  taxController.getTaxSettings(req, res);
});

taxAdminRouter.post('/settings/:merchantId', isAdmin, (req, res) => {
  taxController.createOrUpdateTaxSettings(req, res);
});

// -------------------- NEW: Tax Calculation Routes --------------------
taxAdminRouter.post('/calculate', isAdmin, (req, res) => {
  taxController.calculateTax(req, res);
});

export default taxAdminRouter;
