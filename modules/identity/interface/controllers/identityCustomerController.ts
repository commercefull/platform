import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import identityDataRepository from '../../infrastructure/repositories/IdentityDataRepository';

const tokenRepo = identityDataRepository.tokens;
import { generateAccessToken, verifyAccessToken, parseExpirationDate } from '../../utils/jwtHelpers';
import { emitCustomerLogin, emitCustomerRegistered, emitCustomerTokenRefreshed } from '../../domain/events/emitIdentityEvent';
import { JobScheduler } from '../../../../libs/jobs/cronScheduler';
import { eventBus } from '../../../../libs/events/eventBus';
import { CustomerCredentialSubjectAdapter } from '../../infrastructure/acl/CustomerCredentialSubjectAdapter';
import type { CredentialSubjectPort } from '../../application/ports/CredentialSubjectPort';

// Environment configuration with secure defaults
const CUSTOMER_JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || 'customer-secret-key-should-be-in-env';
const ACCESS_TOKEN_DURATION = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_DURATION = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

const credentialPort: CredentialSubjectPort = new CustomerCredentialSubjectAdapter();
const refreshTokenRepo = tokenRepo;
const tokenBlacklistRepo = tokenRepo;

interface LoginBody {
  email: string;
  password: string;
}

interface RegisterBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface RefreshTokenBody {
  refreshToken: string;
}

interface TokenBody {
  token: string;
}

interface EmailBody {
  email: string;
}

interface ResetPasswordBody {
  token: string;
  newPassword?: string;
  password?: string;
}

/**
 * Authenticates a customer and returns a basic JWT token
 * Use this for simple session-based auth
 */
export const loginCustomer = async (req: TypedRequest<Record<string, string>, unknown, LoginBody>, res: Response): Promise<void> => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
    return;
  }

  // Authenticate customer
  const subject = await credentialPort.authenticate(email, password);
  if (!subject) {
    res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
    return;
  }

  // Track login activity
  await credentialPort.updateLoginTimestamp(subject.id);

  // Emit login event
  emitCustomerLogin({
    customerId: subject.id,
    email: subject.email,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Generate access token
  const accessToken = generateAccessToken(subject.id, subject.email, 'customer', CUSTOMER_JWT_SECRET, ACCESS_TOKEN_DURATION);

  res.json({
    success: true,
    accessToken,
    customer: {
      id: subject.id,
      email: subject.email,
    },
  });
  
};

/**
 * Registers a new customer account
 */
export const registerCustomer = async (req: TypedRequest<Record<string, string>, unknown, RegisterBody>, res: Response): Promise<void> => {
  const { email, password, firstName, lastName, phone } = req.body;

  // Validate required fields
  if (!email || !password || !firstName || !lastName) {
    res.status(400).json({
      success: false,
      message: 'Email, password, first name, and last name are required',
    });
    return;
  }

  // Validate password strength
  if (password.length < 8) {
    res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long',
    });
    return;
  }

  // Check for existing customer
  const existing = await credentialPort.findByEmail(email);
  if (existing) {
    res.status(409).json({
      success: false,
      message: 'An account with this email already exists',
    });
    return;
  }

  // Create new customer
  const newSubject = await credentialPort.createWithPassword({
    email,
    firstName,
    lastName,
    password,
    phone,
    isActive: true,
    isVerified: false,
  });

  // Emit registration event
  emitCustomerRegistered({
    customerId: newSubject.id,
    email: newSubject.email,
    firstName: newSubject.firstName || '',
    lastName: newSubject.lastName || '',
  });

  // Generate access token for immediate login
  const accessToken = generateAccessToken(
    newSubject.id,
    newSubject.email,
    'customer',
    CUSTOMER_JWT_SECRET,
    ACCESS_TOKEN_DURATION,
  );

  res.status(201).json({
    success: true,
    accessToken,
    customer: {
      id: newSubject.id,
      email: newSubject.email,
      firstName: newSubject.firstName,
      lastName: newSubject.lastName,
    },
  });
  
};

/**
 * Issues both access and refresh tokens for headless/mobile clients
 * More secure than simple login as refresh tokens can be revoked
 */
export const issueTokenPair = async (req: TypedRequest<Record<string, string>, unknown, LoginBody>, res: Response): Promise<void> => {
  const { email, password } = req.body;

  // Validate credentials
  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
    return;
  }

  const subject = await credentialPort.authenticate(email, password);
  if (!subject) {
    res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
    return;
  }

  // Track login activity
  await credentialPort.updateLoginTimestamp(subject.id);

  // Generate access token (short-lived)
  const accessToken = generateAccessToken(subject.id, subject.email, 'customer', CUSTOMER_JWT_SECRET, ACCESS_TOKEN_DURATION);

  // Generate refresh token (long-lived)
  const refreshToken = generateAccessToken(subject.id, subject.email, 'customer', CUSTOMER_JWT_SECRET, REFRESH_TOKEN_DURATION);

  // Store refresh token in database for tracking/revocation
  await refreshTokenRepo.createRefreshToken({
    token: refreshToken,
    userType: 'customer',
    userId: subject.id,
    expiresAt: parseExpirationDate(REFRESH_TOKEN_DURATION),
    userAgent: req.headers['user-agent'] || null,
    ipAddress: req.ip || null,
  });

  res.json({
    success: true,
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: ACCESS_TOKEN_DURATION,
    customer: {
      id: subject.id,
      email: subject.email,
    },
  });
  
};

/**
 * Refreshes an expired access token using a valid refresh token
 */
export const renewAccessToken = async (req: TypedRequest<Record<string, string>, unknown, RefreshTokenBody>, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({
      success: false,
      message: 'Refresh token is required',
    });
    return;
  }

  // Verify refresh token signature
  const tokenPayload = verifyAccessToken(refreshToken, CUSTOMER_JWT_SECRET);
  if (!tokenPayload || !tokenPayload.id) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
    return;
  }

  // Verify refresh token exists in database and hasn't been revoked
  const storedToken = await refreshTokenRepo.findRefreshToken(refreshToken);
  if (!storedToken || storedToken.userId !== tokenPayload.id || storedToken.userType !== 'customer') {
    res.status(401).json({
      success: false,
      message: 'Refresh token has been revoked or is invalid',
    });
    return;
  }

  // Verify customer still exists and is active
  const subject = await credentialPort.findById(tokenPayload.id);
  if (!subject) {
    res.status(401).json({
      success: false,
      message: 'Customer account not found',
    });
    return;
  }

  // Generate new access token
  const newAccessToken = generateAccessToken(subject.id, subject.email, 'customer', CUSTOMER_JWT_SECRET, ACCESS_TOKEN_DURATION);

  // Mark refresh token as used (optional - for tracking)
  await refreshTokenRepo.markRefreshTokenUsed(refreshToken);

  // Emit token refreshed event
  emitCustomerTokenRefreshed({
    userId: subject.id,
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    accessToken: newAccessToken,
    tokenType: 'Bearer',
    expiresIn: ACCESS_TOKEN_DURATION,
  });
  
};

/**
 * Validates a customer access token
 */
export const checkTokenValidity = async (req: TypedRequest<Record<string, string>, unknown, TokenBody>, res: Response): Promise<void> => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({
      success: false,
      message: 'Token is required',
    });
    return;
  }

  // Verify token signature and expiration
  const decodedPayload = verifyAccessToken(token, CUSTOMER_JWT_SECRET);

  if (!decodedPayload || decodedPayload.role !== 'customer') {
    res.status(401).json({
      success: false,
      valid: false,
      message: 'Token is invalid or has expired',
    });
    return;
  }

  res.json({
    success: true,
    valid: true,
    customer: {
      id: decodedPayload.id,
      email: decodedPayload.email,
      role: decodedPayload.role,
    },
  });
  
};

/**
 * Initiates password reset flow by generating a reset token
 */
export const requestPasswordReset = async (req: TypedRequest<Record<string, string>, unknown, EmailBody>, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({
      success: false,
      message: 'Email is required',
    });
    return;
  }

  const subject = await credentialPort.findByEmail(email);

  // Always return success to prevent email enumeration attacks
  if (!subject?.id) {
    res.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent',
    });
    return;
  }

  // Generate secure reset token
  const resetToken = await credentialPort.createPasswordResetToken(subject.id);

  // Send password reset email
  await JobScheduler.scheduleEmail({
    to: email,
    subject: 'Password Reset Request',
    template: 'password-reset',
    data: { resetToken, email },
  });

  res.json({
    success: true,
    message: 'Password reset instructions have been sent to your email',
    // REMOVE IN PRODUCTION - only for development
    resetToken,
  });
  
};

/**
 * Completes password reset using a valid reset token
 */
export const resetPassword = async (req: TypedRequest<Record<string, string>, unknown, ResetPasswordBody>, res: Response): Promise<void> => {
  const { token, newPassword, password } = req.body;
  const finalPassword = newPassword || password;

  if (!token || !finalPassword) {
    res.status(400).json({
      success: false,
      message: 'Reset token and new password are required',
    });
    return;
  }

  // Verify reset token and get customer ID
  const customerId = await credentialPort.verifyPasswordResetToken(token);
  if (!customerId) {
    res.status(400).json({
      success: false,
      message: 'Password reset token is invalid or has expired',
    });
    return;
  }

  // Update customer password
  await credentialPort.changePassword(customerId, finalPassword);

  res.json({
    success: true,
    message: 'Your password has been successfully reset',
  });
  
};

/**
 * Logout customer by blacklisting access token and revoking refresh token
 */
interface LogoutBody {
  refreshToken?: string;
}

export const logoutCustomer = async (req: TypedRequest<Record<string, string>, unknown, LogoutBody>, res: Response): Promise<void> => {
  const customerId = req.user?.customerId || req.user?.id;
  const accessToken = req.headers['authorization']?.split(' ')[1];
  const { refreshToken } = req.body;

  if (!customerId || !accessToken) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
    return;
  }

  // Blacklist the access token
  await tokenBlacklistRepo.blacklistToken({
    token: accessToken,
    userId: customerId,
    userType: 'customer',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Revoke refresh token if provided
  if (refreshToken) {
    await refreshTokenRepo.revokeRefreshToken(refreshToken);
  }

  // Emit logout event
  eventBus.emit('customer.logged_out', { customerId });

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
  
};

/**
 * Get 2FA status for authenticated customer
 */
export const get2FAStatus = async (req: TypedRequest<Record<string, string>, unknown>, res: Response): Promise<void> => {
  const customerId = req.user?.customerId || req.user?.id;

  if (!customerId) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
    return;
  }

  res.json({
    success: true,
    data: {
      enabled: false,
      method: null,
    },
  });
  
};
