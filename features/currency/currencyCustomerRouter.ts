import express from 'express';
import currencyCustomerController from './controllers/currencyCustomerController';

const router = express.Router();

// Get available currencies
router.get('/currencies', (req, res) => {
  currencyCustomerController.getAvailableCurrencies(req, res);
});

// Get default currency
router.get('/default-currency', (req, res) => {
  currencyCustomerController.getDefaultCurrency(req, res);
});

// Get suggested currency based on IP
router.get('/suggested-currency', (req, res) => {
  currencyCustomerController.getSuggestedCurrency(req, res);
});

// Get currency for specific region
router.get('/regions/:regionCode/currency', (req, res) => {
  currencyCustomerController.getRegionCurrency(req, res);
});

// Convert price between currencies
router.post('/convert', (req, res) => {
  currencyCustomerController.convertPrice(req, res);
});

// Batch convert multiple prices
router.post('/batch-convert', (req, res) => {
  currencyCustomerController.batchConvertPrices(req, res);
});

export const currencyRouter = router;
