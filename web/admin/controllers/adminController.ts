import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { SessionService } from '../../../libs/session';
import AdminRepository from '../../../modules/identity/infrastructure/repositories/AdminRepository';
import DashboardQueryRepository from '../../../modules/analytics/infrastructure/repositories/DashboardQueryRepository';
import { adminRespond } from '../../respond';

// Session cookie name
const SESSION_COOKIE_NAME = 'cf_session';

// GET: admin dashboard
export const getAdminDashboard = async (req: Request, res: Response) => {
  try {
    // Fetch real dashboard data using query repository
    const [stats, recentOrders, topProducts, revenueByDay] = await Promise.all([
      DashboardQueryRepository.getAdminDashboardStats(),
      DashboardQueryRepository.getRecentOrders(5),
      DashboardQueryRepository.getTopProducts(5),
      DashboardQueryRepository.getRevenueByDay(7),
    ]);

    const dashboardData = {
      pageName: 'Dashboard',
      stats,
      recentOrders,
      topProducts,
      revenueByDay,
    };

    adminRespond(req, res, 'dashboard', dashboardData);
  } catch (error) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load dashboard',
    });
  }
};

// GET: admin login page
export const getAdminLogin = async (req: Request, res: Response) => {
  // Check if already logged in via session
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  if (sessionId) {
    const session = await SessionService.getSession(sessionId);
    if (session && session.userType === 'admin') {
      return res.redirect('/admin');
    }
  }

  adminRespond(req, res, 'login', {
    pageName: 'Admin Login',
  });
};

// POST: admin login (handled by auth routes)

// GET: admin logout (handled by auth routes)

// POST: admin login form submission
export const postAdminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Basic validation
    if (!email || !password) {
      return adminRespond(req, res, 'login', {
        pageName: 'Admin Login',
        error: 'Email and password are required',
      });
    }

    // Authenticate against admin database
    const admin = await AdminRepository.findByEmail(email);

    if (!admin) {
      return adminRespond(req, res, 'login', {
        pageName: 'Admin Login',
        error: 'Invalid email or password',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
    if (!isValidPassword) {
      return adminRespond(req, res, 'login', {
        pageName: 'Admin Login',
        error: 'Invalid email or password',
      });
    }

    // Check admin status
    if (admin.status !== 'active') {
      return adminRespond(req, res, 'login', {
        pageName: 'Admin Login',
        error: 'Account is not active. Please contact super admin.',
      });
    }

    // Create session
    const sessionId = await SessionService.createSession({
      userId: admin.adminId,
      userType: 'admin',
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      expiresInHours: rememberMe ? 168 : 8, // 7 days or 8 hours
    });

    // Set session cookie
    res.cookie(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    // Update last login
    await AdminRepository.updateLastLogin(admin.adminId);

    // Redirect to dashboard
    return res.redirect('/admin');
  } catch (error) {
    logger.error('Error:', error);

    adminRespond(req, res, 'login', {
      pageName: 'Admin Login',
      error: 'An error occurred during login',
    });
  }
};

// POST: admin logout
export const postAdminLogout = async (req: Request, res: Response) => {
  try {
    // Get session ID from cookie
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME];

    // Invalidate session in database
    if (sessionId) {
      await SessionService.invalidateSession(sessionId);
    }

    // Clear session cookie
    res.clearCookie(SESSION_COOKIE_NAME);

    // Redirect to login page
    res.redirect('/admin/login');
  } catch (error) {
    logger.error('Error:', error);

    res.clearCookie(SESSION_COOKIE_NAME);
    res.redirect('/admin/login');
  }
};

// GET: admin profile
export const getAdminProfile = async (req: Request, res: Response) => {
  try {
    adminRespond(req, res, 'profile', {
      pageName: 'Admin Profile',
    });
  } catch (error) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: 'Failed to load profile',
    });
  }
};
