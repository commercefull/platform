import { Router } from 'express';
import taxPublicController from './controllers/taxPublicController';
import { isLoggedIn } from '../../libs/auth';

const taxRouter = Router();

// Public tax calculation endpoints
taxRouter.post('/calculate', (req, res) => {
  taxPublicController.calculateTaxForLineItem(req, res);
});

// Protected routes require authentication
taxRouter.post('/calculate/basket/:basketId', isLoggedIn, (req, res) => {
  taxPublicController.calculateTaxForBasket(req, res);
});

// Public tax information endpoints
taxRouter.get('/rates', (req, res) => {
  taxPublicController.getTaxRates(req, res);
});

taxRouter.get('/categories/:code', (req, res) => {
  taxPublicController.getTaxCategoryByCode(req, res);
});

// Customer exemption check (requires authentication)
taxRouter.get('/exemption/:customerId', isLoggedIn, (req, res) => {
  taxPublicController.checkCustomerTaxExemption(req, res);
});

export default taxRouter;
