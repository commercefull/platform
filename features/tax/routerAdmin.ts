import { Router } from 'express';
import taxController from './controllers/taxController';
import { isAdmin } from '../../libs/auth';

const taxAdminRouter = Router();

// Apply admin role verification to all routes
// Tax Rate routes
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

// Tax Category routes
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

// Tax Exemption routes
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

export default taxAdminRouter;
