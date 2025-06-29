import express from 'express';
import currencyController from './controllers/currencyMerchantController';
import { isMerchantLoggedIn } from '../../libs/auth';

const router = express.Router();

// Apply middleware to all routes in this router
router.use(isMerchantLoggedIn);

// Currency routes
router.get('/currencies', (req, res) => {
  currencyController.getAllCurrencies(req, res);
});

router.get('/currencies/:code', (req, res) => {
  currencyController.getCurrencyByCode(req, res);
});

router.post('/currencies', (req, res) => {
  currencyController.saveCurrency(req, res);
});

router.delete('/currencies/:code', (req, res) => {
  currencyController.deleteCurrency(req, res);
});

router.post('/currencies/update-exchange-rates', (req, res) => {
  currencyController.updateExchangeRates(req, res);
});

// Currency region routes
router.get('/currency-regions', (req, res) => {
  currencyController.getAllCurrencyRegions(req, res);
});

router.get('/currency-regions/:id', (req, res) => {
  currencyController.getCurrencyRegionById(req, res);
});

router.post('/currency-regions', (req, res) => {
  currencyController.createCurrencyRegion(req, res);
});

router.put('/currency-regions/:id', (req, res) => {
  currencyController.updateCurrencyRegion(req, res);
});

router.delete('/currency-regions/:id', (req, res) => {
  currencyController.deleteCurrencyRegion(req, res);
});

// Price rule routes
router.get('/price-rules', (req, res) => {
  currencyController.getAllPriceRules(req, res);
});

router.get('/price-rules/:id', (req, res) => {
  currencyController.getPriceRuleById(req, res);
});

router.post('/price-rules', (req, res) => {
  currencyController.createPriceRule(req, res);
});

router.put('/price-rules/:id', (req, res) => {
  currencyController.updatePriceRule(req, res);
});

router.delete('/price-rules/:id', (req, res) => {
  currencyController.deletePriceRule(req, res);
});

export const currencyMerchantRouter = router;
