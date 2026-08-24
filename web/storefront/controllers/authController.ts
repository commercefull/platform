/**
 * Storefront Customer Authentication Controller
 * Handles login, signup, profile, and logout for customers
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { storefrontRespond } from '../../respond';
import {
  AuthenticateCustomerCommand,
} from '../../../modules/customer/application/useCases/AuthenticateCustomer';
import { RegisterCustomerCommand } from '../../../modules/customer/application/useCases/RegisterCustomer';
import {
  getCustomerUseCase,
  updateCustomerUseCase,
  authenticateCustomerUseCase,
  registerCustomerUseCase,
  changePasswordUseCase,
} from '../../../modules/customer/application/useCases/wired';
import { GetCustomerCommand } from '../../../modules/customer/application/useCases/GetCustomer';
import { UpdateCustomerCommand } from '../../../modules/customer/application/useCases/UpdateCustomer';
import { ChangePasswordCommand } from '../../../modules/customer/application/useCases/ChangePassword';

// ============================================================================
// Sign In Form
// ============================================================================

export const signInForm = async (req: TypedRequest, res: Response): Promise<void> => {
  // If already logged in, redirect to profile
  if (req.user) {
    res.redirect('/profile');
    return;
  }

  storefrontRespond(req, res, 'user/signin', {
    pageName: 'Sign In',
    redirectTo: req.query.redirect || '/',
  });
};

// ============================================================================
// Sign Up Form
// ============================================================================

export const signUpForm = async (req: TypedRequest, res: Response): Promise<void> => {
  // If already logged in, redirect to profile
  if (req.user) {
    res.redirect('/profile');
    return;
  }

  storefrontRespond(req, res, 'user/signup', {
    pageName: 'Sign Up',
  });
};

// ============================================================================
// Sign In Process
// ============================================================================

export const signIn = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { email, password, redirectTo = '/' } = body;

    if (!email || !password) {
      req.flash('error', 'Email and password are required');
      return res.redirect('/signin?redirect=' + encodeURIComponent(redirectTo as string));
    }

    const command = new AuthenticateCustomerCommand(email as string, password as string);
    const customer = await authenticateCustomerUseCase.execute(command);

    if (!customer) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/signin?redirect=' + encodeURIComponent(redirectTo as string));
    }

    // Set customer session
    (req as unknown as Record<string, unknown>).user = {
      customerId: customer.customerId,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
    };

    req.flash('success', `Welcome back, ${customer.firstName}!`);
    res.redirect(redirectTo as string);
  } catch (error: unknown) {
    logger.warn('Error:', error);

    req.flash('error', (error as Error).message || 'Failed to sign in');
    res.redirect('/signin');
  }
};

// ============================================================================
// Sign Up Process
// ============================================================================

export const signUp = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { firstName, lastName, email, password, confirmPassword, _acceptsMarketing = false, _acceptsAnalytics = false } = body;

    // Basic validation
    if (!firstName || !lastName || !email || !password) {
      req.flash('error', 'All fields are required');
      return res.redirect('/signup');
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/signup');
    }

    if ((password as string).length < 8) {
      req.flash('error', 'Password must be at least 8 characters long');
      return res.redirect('/signup');
    }

    const command = new RegisterCustomerCommand(email as string, firstName as string, lastName as string, password as string);

    const customer = await registerCustomerUseCase.execute(command);

    // Auto-login after registration
    (req as unknown as Record<string, unknown>).user = {
      customerId: customer.customerId,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
    };

    req.flash('success', `Welcome to our store, ${customer.firstName}!`);
    res.redirect('/profile');
  } catch (error: unknown) {
    logger.warn('Error:', error);

    req.flash('error', (error as Error).message || 'Failed to create account');
    res.redirect('/signup');
  }
};

// ============================================================================
// Profile View
// ============================================================================

export const profile = async (req: TypedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    return res.redirect('/signin?redirect=/profile');
  }

  const command = new GetCustomerCommand(req.user.customerId);
  const customer = await getCustomerUseCase.execute(command);

  if (!customer) {
    // Clear invalid session
    req.user = undefined;
    return res.redirect('/signin');
  }

  storefrontRespond(req, res, 'user/profile', {
    pageName: 'My Profile',
    customer,
  });
  
};

// ============================================================================
// Update Profile
// ============================================================================

export const updateProfile = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      return res.redirect('/signin');
    }

    const body = req.body as RequestBody;
    const { firstName, lastName, phone, _acceptsMarketing, _acceptsAnalytics } = body;

    const command = new UpdateCustomerCommand(req.user.customerId as string, {
      firstName: firstName as string | undefined,
      lastName: lastName as string | undefined,
      phone: phone as string | undefined,
    });

    await updateCustomerUseCase.execute(command);

    req.flash('success', 'Profile updated successfully');
    res.redirect('/profile');
  } catch (error: unknown) {
    logger.warn('Error:', error);

    req.flash('error', (error as Error).message || 'Failed to update profile');
    res.redirect('/profile');
  }
};

// ============================================================================
// Sign Out
// ============================================================================

export const signOut = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    // Clear user session
    req.user = undefined;
    if (req.session) {
      (req.session as unknown as Record<string, unknown> & { destroy?: (cb: () => void) => void }).destroy?.(() => {});
    }

    req.flash('success', 'You have been signed out successfully');
    res.redirect('/');
  } catch (error: unknown) {
    logger.warn('Error:', error);

    res.redirect('/');
  }
};

// ============================================================================
// Change Password
// ============================================================================

export const changePassword = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      return res.redirect('/signin');
    }

    const body = req.body as RequestBody;
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      req.flash('error', 'All password fields are required');
      return res.redirect('/profile');
    }

    if (newPassword !== confirmPassword) {
      req.flash('error', 'New passwords do not match');
      return res.redirect('/profile');
    }

    if ((newPassword as string).length < 8) {
      req.flash('error', 'New password must be at least 8 characters long');
      return res.redirect('/profile');
    }

    // Use ChangePassword use case
    const changeCommand = new ChangePasswordCommand(req.user.customerId as string, currentPassword as string, newPassword as string);

    await changePasswordUseCase.execute(changeCommand);

    req.flash('success', 'Password changed successfully');
    res.redirect('/profile');
  } catch (error: unknown) {
    logger.warn('Error:', error);

    req.flash('error', (error as Error).message || 'Failed to change password');
    res.redirect('/profile');
  }
};
