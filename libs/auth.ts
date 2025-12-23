import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SessionService } from './session';

// Environment variables should be properly loaded in your application
const MERCHANT_JWT_SECRET = process.env.MERCHANT_JWT_SECRET || 'merchant-secret-key-should-be-in-env';
const CUSTOMER_JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || 'customer-secret-key-should-be-in-env';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-secret-key-should-be-in-env';
const B2B_JWT_SECRET = process.env.B2B_JWT_SECRET || 'b2b-secret-key-should-be-in-env';

// Session cookie name
const SESSION_COOKIE_NAME = 'cf_session';

/**
 * Authenticate API requests via JWT
 */
const authenticateToken = (req: Request, res: Response, next: NextFunction, secret: string): void => {
  // Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format

  if (!token) {
    res.status(401).json({ success: false, message: 'Access token is required' });
    return;
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, String(secret));
    req.user = decoded;
    return next();
  } catch (error) {
    // Return 401 for invalid/expired tokens (not 403 which is for authorization failures)
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * Authenticate web requests via session
 */
const authenticateSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
  userType: 'admin' | 'merchant' | 'b2b' | 'customer',
  loginPath: string,
): Promise<void> => {
  // Get session ID from cookie
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];

  if (!sessionId) {
    return res.redirect(loginPath);
  }

  try {
    const session = await SessionService.getSession(sessionId);

    if (!session) {
      res.clearCookie(SESSION_COOKIE_NAME);
      return res.redirect(loginPath);
    }

    // Check user type matches
    if (session.userType !== userType) {
      res.clearCookie(SESSION_COOKIE_NAME);
      return res.redirect(loginPath);
    }

    // Update session activity
    await SessionService.updateActivity(sessionId);

    // Attach user to request
    req.user = {
      id: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      type: session.userType,
      merchantId: session.merchantId,
      companyId: session.companyId,
      permissions: session.permissions,
    };

    return next();
  } catch (error) {
    res.clearCookie(SESSION_COOKIE_NAME);
    return res.redirect(loginPath);
  }
};

/**
 * Admin authentication middleware
 * Uses session for web, JWT for API
 */
export const isAdminLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
  // Check if it's an API call
  if (req.xhr || req.headers.accept?.indexOf('json') !== -1) {
    return authenticateToken(req, res, next, ADMIN_JWT_SECRET);
  }

  // Web request - use session
  return authenticateSession(req, res, next, 'admin', '/admin/login');
};

/**
 * Merchant authentication middleware
 * Uses session for web, JWT for API
 */
export const isMerchantLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
  // Check if it's an API call
  if (req.xhr || req.headers.accept?.indexOf('json') !== -1) {
    return authenticateToken(req, res, next, MERCHANT_JWT_SECRET);
  }

  // Web request - use session
  return authenticateSession(req, res, next, 'merchant', '/merchant/login');
};

/**
 * B2B user authentication middleware
 * Uses session for web, JWT for API
 */
export const isB2BLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
  // Check if it's an API call
  if (req.xhr || req.headers.accept?.indexOf('json') !== -1) {
    return authenticateToken(req, res, next, B2B_JWT_SECRET);
  }

  // Web request - use session
  return authenticateSession(req, res, next, 'b2b', '/b2b/login');
};

export const isCustomerLoggedIn = (req: Request, res: Response, next: NextFunction) => {
  if (req.xhr || req.headers.accept?.indexOf('json') !== -1) {
    return authenticateToken(req, res, next, CUSTOMER_JWT_SECRET);
  }

  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/login');
};

/**
 * Middleware to check if a customer is NOT logged in
 * Useful for pages that should only be accessible to non-authenticated users (signup, login)
 */
export const isCustomerNotLoggedIn = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return res.redirect('/user/profile'); // Redirect to profile if already authenticated
  }
  next(); // Continue if not authenticated
};
