import express from "express";
import { isMerchantLoggedIn } from "../../libs/auth";
import { generateToken, login, refreshToken, register, requestPasswordReset, resetPassword, validateTokenEndpoint } from "./controllers/authBusinessController";

const router = express.Router();

// Merchant public routes
router.post('/login', login);
router.post('/register', register);
router.post('/token', generateToken);
router.post('/token/refresh', isMerchantLoggedIn, refreshToken);
router.post('/token/validate', validateTokenEndpoint);

// Password reset (for both customer and merchant)
router.post('/password-reset/request', requestPasswordReset);
router.post('/password-reset/reset', resetPassword);

export const authMerchantRouter = router;
