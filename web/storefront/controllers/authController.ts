/**
 * Storefront Customer Authentication Controller
 * Handles login, signup, profile, and logout for customers
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import { storefrontRespond } from '../../respond';
import CustomerRepo from '../../../modules/customer/infrastructure/repositories/CustomerRepository';
import { AuthenticateCustomerCommand, AuthenticateCustomerUseCase } from '../../../modules/customer/useCases/AuthenticateCustomer';
import { RegisterCustomerCommand, RegisterCustomerUseCase } from '../../../modules/customer/useCases/RegisterCustomer';
import { GetCustomerCommand, GetCustomerUseCase } from '../../../modules/customer/useCases/GetCustomer';
import { UpdateCustomerCommand, UpdateCustomerUseCase } from '../../../modules/customer/useCases/UpdateCustomer';
import { ChangePasswordCommand, ChangePasswordUseCase } from '../../../modules/customer/useCases/ChangePassword';

// ============================================================================
// Sign In Form
// ============================================================================

export const signInForm = async (req: Request, res: Response): Promise<void> => {
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

export const signUpForm = async (req: Request, res: Response): Promise<void> => {
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

export const signIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, redirectTo = '/' } = req.body;

    if (!email || !password) {
      req.flash('error', 'Email and password are required');
      return res.redirect('/signin?redirect=' + encodeURIComponent(redirectTo as string));
    }

    const command = new AuthenticateCustomerCommand(email, password);
    const useCase = new AuthenticateCustomerUseCase(CustomerRepo);
    const customer = await useCase.execute(command);

    if (!customer) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/signin?redirect=' + encodeURIComponent(redirectTo as string));
    }

    // Set customer session
    (req as any).user = {
      customerId: customer.customerId,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      isGuest: false,
    };

    req.flash('success', `Welcome back, ${customer.firstName}!`);
    res.redirect(redirectTo as string);
  } catch (error: any) {
    logger.error('Error:', error);

    req.flash('error', error.message || 'Failed to sign in');
    res.redirect('/signin');
  }
};

// ============================================================================
// Sign Up Process
// ============================================================================

export const signUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, confirmPassword, acceptsMarketing = false, acceptsAnalytics = false } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !password) {
      req.flash('error', 'All fields are required');
      return res.redirect('/signup');
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/signup');
    }

    if (password.length < 8) {
      req.flash('error', 'Password must be at least 8 characters long');
      return res.redirect('/signup');
    }

    const command = new RegisterCustomerCommand(email, firstName, lastName, password);

    const useCase = new RegisterCustomerUseCase(CustomerRepo);
    const customer = await useCase.execute(command);

    // Auto-login after registration
    (req as any).user = {
      customerId: customer.customerId,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      isGuest: false,
    };

    req.flash('success', `Welcome to our store, ${customer.firstName}!`);
    res.redirect('/profile');
  } catch (error: any) {
    logger.error('Error:', error);

    req.flash('error', error.message || 'Failed to create account');
    res.redirect('/signup');
  }
};

// ============================================================================
// Profile View
// ============================================================================

export const profile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      return res.redirect('/signin?redirect=/profile');
    }

    const command = new GetCustomerCommand((req as any).user.customerId);
    const useCase = new GetCustomerUseCase(CustomerRepo);
    const customer = await useCase.execute(command);

    if (!customer) {
      // Clear invalid session
      (req as any).user = null;
      return res.redirect('/signin');
    }

    storefrontRespond(req, res, 'user/profile', {
      pageName: 'My Profile',
      customer,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load profile',
    });
  }
};

// ============================================================================
// Update Profile
// ============================================================================

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      return res.redirect('/signin');
    }

    const { firstName, lastName, phone, acceptsMarketing, acceptsAnalytics } = req.body;

    const command = new UpdateCustomerCommand((req as any).user.customerId, {
      firstName,
      lastName,
      phone,
    });

    const useCase = new UpdateCustomerUseCase(CustomerRepo);
    await useCase.execute(command);

    req.flash('success', 'Profile updated successfully');
    res.redirect('/profile');
  } catch (error: any) {
    logger.error('Error:', error);

    req.flash('error', error.message || 'Failed to update profile');
    res.redirect('/profile');
  }
};

// ============================================================================
// Sign Out
// ============================================================================

export const signOut = async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear user session
    (req as any).user = null;
    if (req.session) {
      (req.session as any).destroy?.(() => {});
    }

    req.flash('success', 'You have been signed out successfully');
    res.redirect('/');
  } catch (error: any) {
    logger.error('Error:', error);

    res.redirect('/');
  }
};

// ============================================================================
// Change Password
// ============================================================================

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      return res.redirect('/signin');
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      req.flash('error', 'All password fields are required');
      return res.redirect('/profile');
    }

    if (newPassword !== confirmPassword) {
      req.flash('error', 'New passwords do not match');
      return res.redirect('/profile');
    }

    if (newPassword.length < 8) {
      req.flash('error', 'New password must be at least 8 characters long');
      return res.redirect('/profile');
    }

    // Use ChangePassword use case
    const changeCommand = new ChangePasswordCommand((req as any).user.customerId, currentPassword, newPassword);

    const changeUseCase = new ChangePasswordUseCase(CustomerRepo);
    await changeUseCase.execute(changeCommand);

    req.flash('success', 'Password changed successfully');
    res.redirect('/profile');
  } catch (error: any) {
    logger.error('Error:', error);

    req.flash('error', error.message || 'Failed to change password');
    res.redirect('/profile');
  }
};
