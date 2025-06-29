import express from 'express';
import { generateToken, login, refreshToken, register, requestPasswordReset, resetPassword, validateTokenEndpoint } from './controllers/authCustomerController';
import { isCustomerLoggedIn } from '../../libs/auth';

const router = express.Router();

// Customer public routes
router.post('/login', login);
router.post('/register', register);
router.post('/token', generateToken);
router.post('/token/refresh', isCustomerLoggedIn, refreshToken);
router.post('/token/validate', validateTokenEndpoint);

// Password reset (for both customer and merchant)
router.post('/password-reset/request', requestPasswordReset);
router.post('/password-reset/reset', resetPassword);

export const authCustomerRouter = router;
