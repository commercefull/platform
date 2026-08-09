/**
 * Users Controller
 * Handles admin user management, roles, and permissions
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import bcrypt from 'bcryptjs';
import { adminRespond } from '../../respond';
import * as adminUserRepo from '../../../modules/identity/infrastructure/repositories/identityAdminUserManagementRepo';
import * as roleRepo from '../../../modules/identity/infrastructure/repositories/roleRepo';

// ============================================================================
// Admin Users Management
// ============================================================================

export const listUsers = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { status, page = '1' } = req.query;
    const limit = 20;
    const offset = (parseInt(page as string) - 1) * limit;

    const { users, total } = await adminUserRepo.listAdminUsers({
      status: status as string | undefined,
      limit,
      offset,
    });

    const roles = await roleRepo.listRoles();

    adminRespond(req, res, 'users/index', {
      pageName: 'Admin Users',
      users,
      roles,
      total,
      currentPage: parseInt(page as string),
      totalPages: Math.ceil(total / limit),
      filters: { status },
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load users' });
  }
};

export const viewUser = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await adminUserRepo.findAdminUserById(userId);

    if (!user) {
      adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'User not found' });
      return;
    }

    let permissions: string[] = [];
    if (user.roleId) {
      const role = await roleRepo.findRoleById(user.roleId);
      permissions = (role?.permissions as string[]) || [];
    }

    const roles = await roleRepo.listRoles();

    adminRespond(req, res, 'users/view', {
      pageName: 'User Details',
      adminUser: user,
      permissions,
      roles,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load user' });
  }
};

export const createUserForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const roles = await roleRepo.listRoles();

    adminRespond(req, res, 'users/create', {
      pageName: 'Create Admin User',
      roles,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load form' });
  }
};

export const createUser = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { email, password, firstName, lastName, roleId } = body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const existing = await adminUserRepo.findAdminUserByEmail(email);

    if (existing) {
      res.status(400).json({ success: false, message: 'Email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await adminUserRepo.createAdminUser({
      email,
      passwordHash,
      firstName,
      lastName,
      roleId,
    });

    res.json({ success: true, userId });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateUser = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const body = req.body as RequestBody;
    const { firstName, lastName, status, roleId } = body;

    await adminUserRepo.updateAdminUser(userId, { firstName, lastName, status, roleId });

    res.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteUser = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (req.user?.userId === userId) {
      res.status(400).json({ success: false, message: 'Cannot delete your own account' });
      return;
    }

    await adminUserRepo.deleteAdminUser(userId);

    res.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Roles Management
// ============================================================================

export const listRoles = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const roles = await roleRepo.listRoles();

    adminRespond(req, res, 'users/roles', {
      pageName: 'Roles & Permissions',
      roles,
      availablePermissions: AVAILABLE_PERMISSIONS,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: (error as Error).message || 'Failed to load roles' });
  }
};

export const createRole = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { name, description, permissions } = body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Role name is required' });
      return;
    }

    const roleId = await roleRepo.createRole({ name, description, permissions });

    res.json({ success: true, roleId });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateRole = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { roleId } = req.params;
    const body = req.body as RequestBody;
    const { name, description, permissions } = body;

    const role = await roleRepo.findRoleById(roleId);

    if (role?.isSystem) {
      res.status(400).json({ success: false, message: 'Cannot modify system roles' });
      return;
    }

    await roleRepo.updateRole(roleId, { name, description, permissions });

    res.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteRole = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { roleId } = req.params;

    const role = await roleRepo.findRoleById(roleId);

    if (role?.isSystem) {
      res.status(400).json({ success: false, message: 'Cannot delete system roles' });
      return;
    }

    const usageCount = await roleRepo.countRoleAssignments(roleId);

    if (usageCount > 0) {
      res.status(400).json({ success: false, message: 'Cannot delete role that is assigned to users' });
      return;
    }

    await roleRepo.deleteRole(roleId);

    res.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ============================================================================
// Available Permissions
// ============================================================================

const AVAILABLE_PERMISSIONS = [
  // Dashboard
  { key: 'dashboard.view', name: 'View Dashboard', category: 'Dashboard' },

  // Products
  { key: 'products.view', name: 'View Products', category: 'Products' },
  { key: 'products.create', name: 'Create Products', category: 'Products' },
  { key: 'products.edit', name: 'Edit Products', category: 'Products' },
  { key: 'products.delete', name: 'Delete Products', category: 'Products' },

  // Orders
  { key: 'orders.view', name: 'View Orders', category: 'Orders' },
  { key: 'orders.edit', name: 'Edit Orders', category: 'Orders' },
  { key: 'orders.refund', name: 'Process Refunds', category: 'Orders' },

  // Customers
  { key: 'customers.view', name: 'View Customers', category: 'Customers' },
  { key: 'customers.edit', name: 'Edit Customers', category: 'Customers' },
  { key: 'customers.delete', name: 'Delete Customers', category: 'Customers' },

  // Analytics
  { key: 'analytics.view', name: 'View Analytics', category: 'Analytics' },
  { key: 'analytics.export', name: 'Export Reports', category: 'Analytics' },

  // Settings
  { key: 'settings.view', name: 'View Settings', category: 'Settings' },
  { key: 'settings.edit', name: 'Edit Settings', category: 'Settings' },

  // Users
  { key: 'users.view', name: 'View Admin Users', category: 'Users' },
  { key: 'users.create', name: 'Create Admin Users', category: 'Users' },
  { key: 'users.edit', name: 'Edit Admin Users', category: 'Users' },
  { key: 'users.delete', name: 'Delete Admin Users', category: 'Users' },

  // Roles
  { key: 'roles.view', name: 'View Roles', category: 'Roles' },
  { key: 'roles.manage', name: 'Manage Roles', category: 'Roles' },
];

export { AVAILABLE_PERMISSIONS };
