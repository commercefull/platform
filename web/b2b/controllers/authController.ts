/**
 * B2B Auth Controller
 * Handles B2B user login/logout with session management
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { SessionService } from '../../../libs/session';
import { query, queryOne } from '../../../libs/db';
import { b2bRespond } from '../../respond';

const SESSION_COOKIE_NAME = 'cf_session';

interface B2BUser {
  b2bUserId: string;
  b2bCompanyId: string;
  email: string;
  name: string;
  passwordHash: string;
  role: string;
  permissions: string[];
  status: string;
}

/**
 * GET: B2B login page
 */
export const getLogin = async (req: Request, res: Response) => {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  if (sessionId) {
    const session = await SessionService.getSession(sessionId);
    if (session && session.userType === 'b2b') {
      return res.redirect('/b2b');
    }
  }

  b2bRespond(req, res, 'login', {
    pageName: 'B2B Portal Login',
    error: null,
  });
};

/**
 * POST: B2B login form submission
 */
export const postLogin = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return b2bRespond(req, res, 'login', {
        pageName: 'B2B Portal Login',
        error: 'Email and password are required',
      });
    }

    // Find B2B user
    const user = await queryOne<B2BUser>(
      `SELECT u.*, c."name" as "companyName"
       FROM "b2bUser" u
       JOIN "b2bCompany" c ON u."b2bCompanyId" = c."b2bCompanyId"
       WHERE u."email" = $1 AND u."deletedAt" IS NULL`,
      [email.toLowerCase()]
    );

    if (!user) {
      return b2bRespond(req, res, 'login', {
        pageName: 'B2B Portal Login',
        error: 'Invalid email or password',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return b2bRespond(req, res, 'login', {
        pageName: 'B2B Portal Login',
        error: 'Invalid email or password',
      });
    }

    if (user.status !== 'active') {
      return b2bRespond(req, res, 'login', {
        pageName: 'B2B Portal Login',
        error: 'Your account is not active. Please contact your administrator.',
      });
    }

    // Create session with company isolation
    const sessionId = await SessionService.createSession({
      userId: user.b2bUserId,
      userType: 'b2b',
      email: user.email,
      name: user.name,
      companyId: user.b2bCompanyId, // Critical for data isolation
      role: user.role,
      permissions: user.permissions || [],
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
    await query(
      `UPDATE "b2bUser" SET "lastLoginAt" = NOW() WHERE "b2bUserId" = $1`,
      [user.b2bUserId]
    );

    return res.redirect('/b2b');
  } catch (error) {
    logger.error('Error:', error);
    
    b2bRespond(req, res, 'login', {
      pageName: 'B2B Portal Login',
      error: 'An error occurred during login',
    });
  }
};

/**
 * POST: B2B logout
 */
export const postLogout = async (req: Request, res: Response) => {
  try {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
    if (sessionId) {
      await SessionService.invalidateSession(sessionId);
    }
    res.clearCookie(SESSION_COOKIE_NAME);
    res.redirect('/b2b/login');
  } catch (error) {
    logger.error('Error:', error);
    
    res.clearCookie(SESSION_COOKIE_NAME);
    res.redirect('/b2b/login');
  }
};
