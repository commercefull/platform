/**
 * Merchant Auth Controller
 * Handles merchant login/logout with session management
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { SessionService } from '../../../libs/session';
import { merchantRespond } from '../../respond';
import MerchantRepo from '../../../modules/merchant/repos/merchantRepo';

const SESSION_COOKIE_NAME = 'cf_session';

/**
 * GET: Merchant login page
 */
export const getLogin = async (req: Request, res: Response) => {
  // Check if already logged in
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  if (sessionId) {
    const session = await SessionService.getSession(sessionId);
    if (session && session.userType === 'merchant') {
      return res.redirect('/merchant');
    }
  }

  merchantRespond(req, res, 'login', {
    pageName: 'Merchant Login',
    error: null,
  });
};

/**
 * POST: Merchant login form submission
 */
export const postLogin = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return merchantRespond(req, res, 'login', {
        pageName: 'Merchant Login',
        error: 'Email and password are required',
      });
    }

    // Authenticate merchant
    const merchant = await MerchantRepo.authenticateMerchant({ email, password });

    if (!merchant) {
      return merchantRespond(req, res, 'login', {
        pageName: 'Merchant Login',
        error: 'Invalid email or password',
      });
    }

    if (merchant.status !== 'active' && merchant.status !== 'approved') {
      return merchantRespond(req, res, 'login', {
        pageName: 'Merchant Login',
        error: 'Your account is not active. Please contact support.',
      });
    }

    // Create session with merchant isolation data
    const sessionId = await SessionService.createSession({
      userId: merchant.merchantId,
      userType: 'merchant',
      email: merchant.email,
      name: merchant.name,
      merchantId: merchant.merchantId, // Critical for data isolation
      role: 'merchant',
      permissions: [],
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      expiresInHours: rememberMe ? 168 : 8,
    });

    // Set session cookie
    res.cookie(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    // Update last login
    await MerchantRepo.updateLastLogin(merchant.merchantId);

    return res.redirect('/merchant');
  } catch (error) {
    logger.error('Error:', error);

    merchantRespond(req, res, 'login', {
      pageName: 'Merchant Login',
      error: 'An error occurred during login',
    });
  }
};

/**
 * POST: Merchant logout
 */
export const postLogout = async (req: Request, res: Response) => {
  try {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
    if (sessionId) {
      await SessionService.invalidateSession(sessionId);
    }
    res.clearCookie(SESSION_COOKIE_NAME);
    res.redirect('/merchant/login');
  } catch (error) {
    logger.error('Error:', error);

    res.clearCookie(SESSION_COOKIE_NAME);
    res.redirect('/merchant/login');
  }
};
