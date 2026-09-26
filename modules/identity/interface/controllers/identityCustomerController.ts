import type { HttpRequest, HttpResponse } from 'libs/http';

import { generateAccessToken, verifyAccessToken } from '../../utils/jwtHelpers';
import { emitCustomerLogin } from '../../domain/events/emitIdentityEvent';
import { JobScheduler } from '../../../../libs/jobs/cronScheduler';
import type { CredentialSubjectPort } from '../../application/ports/CredentialSubjectPort';
import {
  customerCredentialPort,
  issueCustomerTokenPairUseCase,
  renewCustomerAccessTokenUseCase,
  logoutSessionUseCase,
} from '../../application/wired';
import { IssueTokenPairCommand } from '../../application/useCases/token/IssueTokenPair';
import { RenewAccessTokenCommand } from '../../application/useCases/token/RenewAccessToken';
import { LogoutSessionCommand } from '../../application/useCases/token/LogoutSession';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';
import { getSecret } from '../../../../libs/secrets';

// Environment configuration
const CUSTOMER_JWT_SECRET = getSecret('CUSTOMER_JWT_SECRET');
const ACCESS_TOKEN_DURATION = process.env.JWT_EXPIRES_IN || '7d';

const credentialPort: CredentialSubjectPort = customerCredentialPort;

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
export const loginCustomer = async (req: HttpRequest<Record<string, string>, unknown, LoginBody>, res: HttpResponse): Promise<void> => {
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
export const registerCustomer = async (
  req: HttpRequest<Record<string, string>, unknown, RegisterBody>,
  res: HttpResponse,
): Promise<void> => {
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

  // The adapter delegates creation to customer's RegisterCustomerUseCase,
  // which emits customer.registered (welcome email, segment, tracking).

  // Generate access token for immediate login
  const accessToken = generateAccessToken(newSubject.id, newSubject.email, 'customer', CUSTOMER_JWT_SECRET, ACCESS_TOKEN_DURATION);

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
export const issueTokenPair = async (req: HttpRequest<Record<string, string>, unknown, LoginBody>, res: HttpResponse): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await issueCustomerTokenPairUseCase.execute(
      new IssueTokenPairCommand(email, password, req.headers['user-agent'] || null, req.ip || null),
    );

    res.json({
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      tokenType: 'Bearer',
      expiresIn: result.expiresIn,
      customer: {
        id: result.subject.id,
        email: result.subject.email,
      },
    });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

/**
 * Refreshes an expired access token using a valid refresh token
 */
export const renewAccessToken = async (
  req: HttpRequest<Record<string, string>, unknown, RefreshTokenBody>,
  res: HttpResponse,
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const result = await renewCustomerAccessTokenUseCase.execute(new RenewAccessTokenCommand(refreshToken, req.ip));

    res.json({
      success: true,
      accessToken: result.accessToken,
      tokenType: 'Bearer',
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

/**
 * Validates a customer access token
 */
export const checkTokenValidity = async (
  req: HttpRequest<Record<string, string>, unknown, TokenBody>,
  res: HttpResponse,
): Promise<void> => {
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

export const requestEmailVerification = async (
  req: HttpRequest<Record<string, string>, unknown, EmailBody>,
  res: HttpResponse,
): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, message: 'Email is required' });
    return;
  }

  const subject = await credentialPort.findByEmail(email);
  let token: string | undefined;
  if (subject && !subject.isVerified && credentialPort.createEmailVerificationToken) {
    token = await credentialPort.createEmailVerificationToken(subject.id);
    await JobScheduler.scheduleEmail({
      to: email,
      subject: 'Verify Your Email',
      template: 'email-verification',
      data: { token, email },
    });
  }

  res.json({
    success: true,
    message: 'If an unverified account exists with that email, a verification link has been sent',
    ...(process.env.NODE_ENV !== 'production' && token ? { data: { token } } : {}),
  });
};

export const verifyEmail = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const token = String(req.query.token || '');
  if (!token) {
    res.status(400).json({ success: false, message: 'Verification token is required' });
    return;
  }

  const customerId = credentialPort.verifyEmailVerificationToken ? await credentialPort.verifyEmailVerificationToken(token) : null;
  if (!customerId) {
    res.status(400).json({ success: false, error: 'Invalid verification token' });
    return;
  }

  res.json({ success: true, message: 'Email verified successfully' });
};

/**
 * Initiates password reset flow by generating a reset token
 */
export const requestPasswordReset = async (
  req: HttpRequest<Record<string, string>, unknown, EmailBody>,
  res: HttpResponse,
): Promise<void> => {
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
export const resetPassword = async (
  req: HttpRequest<Record<string, string>, unknown, ResetPasswordBody>,
  res: HttpResponse,
): Promise<void> => {
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

export const logoutCustomer = async (req: HttpRequest<Record<string, string>, unknown, LogoutBody>, res: HttpResponse): Promise<void> => {
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

  await logoutSessionUseCase.execute(new LogoutSessionCommand(customerId, 'customer', accessToken, refreshToken));

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * Get 2FA status for authenticated customer
 */
export const get2FAStatus = async (req: HttpRequest<Record<string, string>, unknown>, res: HttpResponse): Promise<void> => {
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
