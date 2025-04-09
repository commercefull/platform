import express from 'express';
import currencyPublicController from './controllers/currencyPublicController';

const router = express.Router();

// Get available currencies
router.get('/currencies', (req, res) => {
  currencyPublicController.getAvailableCurrencies(req, res);
});

// Get default currency
router.get('/default-currency', (req, res) => {
  currencyPublicController.getDefaultCurrency(req, res);
});

// Get suggested currency based on IP
router.get('/suggested-currency', (req, res) => {
  currencyPublicController.getSuggestedCurrency(req, res);
});

// Get currency for specific region
router.get('/regions/:regionCode/currency', (req, res) => {
  currencyPublicController.getRegionCurrency(req, res);
});

// Convert price between currencies
router.post('/convert', (req, res) => {
  currencyPublicController.convertPrice(req, res);
});

// Batch convert multiple prices
router.post('/batch-convert', (req, res) => {
  currencyPublicController.batchConvertPrices(req, res);
});

export const currencyRouter = router;
