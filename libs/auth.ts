import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SessionService } from './session';

const isJsonRequest = (req: Request): boolean => {
  return Boolean(req.xhr || req.headers.accept?.indexOf('json') !== -1);
};

// JWT secrets — validated via libs/secrets (fail-fast in production)
import { getSecret } from './secrets';

const ORGANIZATION_JWT_SECRET = getSecret('ORGANIZATION_JWT_SECRET');
const CUSTOMER_JWT_SECRET = getSecret('CUSTOMER_JWT_SECRET');
const ADMIN_JWT_SECRET = getSecret('ADMIN_JWT_SECRET');
const _B2B_JWT_SECRET = getSecret('B2B_JWT_SECRET');

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
    req.user = decoded as Express.User;
    return next();
  } catch {
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
  userType: 'admin' | 'organization' | 'b2b' | 'customer',
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
      userId: session.userId,
      id: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      type: session.userType,
      organizationId: session.organizationId,
      companyId: session.companyId,
      storeId: session.storeId,
      storeRole: session.storeRole,
      storeIds: session.storeIds,
      permissions: session.permissions,
    };

    return next();
  } catch {
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
  if (isJsonRequest(req)) {
    return authenticateToken(req, res, next, ADMIN_JWT_SECRET);
  }

  // Web request - use session
  return authenticateSession(req, res, next, 'admin', '/admin/login');
};

/**
 * Merchant authentication middleware
 * Uses session for web, JWT for API
 */
export const isOrganizationLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
  // Check if it's an API call
  if (isJsonRequest(req)) {
    return authenticateToken(req, res, next, ORGANIZATION_JWT_SECRET);
  }

  // Web request - use session
  return authenticateSession(req, res, next, 'organization', '/organization/login');
};

export const isCustomerLoggedIn = (req: Request, res: Response, next: NextFunction) => {
  if (isJsonRequest(req)) {
    return authenticateToken(req, res, next, CUSTOMER_JWT_SECRET);
  }

  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/login');
};

export const optionalCustomerAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, String(CUSTOMER_JWT_SECRET));
      req.user = decoded as Express.User;
    } catch {
      // Invalid token — continue without user
    }
  }

  next();
};

