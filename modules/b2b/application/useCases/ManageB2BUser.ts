/**
 * Manage B2B User Use Case
 * Creates or updates a B2B portal user
 */

import * as b2bUserRepo from '../../infrastructure/repositories/b2bUserRepo';

export interface ManageB2BUserCommand {
  b2bUserId?: string; // if provided, update; otherwise create
  b2bCompanyId?: string; // required for create
  email?: string; // required for create
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
}

export interface ManageB2BUserResponse {
  success: boolean;
  user?: {
    b2bUserId: string;
    b2bCompanyId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    isActive: boolean;
    createdAt: Date;
  };
  error?: string;
}

export class ManageB2BUserUseCase {
  async execute(command: ManageB2BUserCommand): Promise<ManageB2BUserResponse> {
    try {
      if (command.b2bUserId) {
        // Update existing user
        const user = await b2bUserRepo.update(command.b2bUserId, {
          firstName: command.firstName,
          lastName: command.lastName,
          role: command.role,
          isActive: command.isActive,
        });
        if (!user) {
          return { success: false, error: 'B2B user not found' };
        }
        return {
          success: true,
          user: {
            b2bUserId: user.b2bUserId,
            b2bCompanyId: user.b2bCompanyId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
          },
        };
      }

      // Create new user
      if (!command.b2bCompanyId) {
        return { success: false, error: 'Company ID is required to create a user' };
      }
      if (!command.email) {
        return { success: false, error: 'Email is required to create a user' };
      }

      // Check for duplicate email within company
      const existing = await b2bUserRepo.findByEmail(command.email);
      if (existing && existing.b2bCompanyId === command.b2bCompanyId) {
        return { success: false, error: 'A user with this email already exists in the company' };
      }

      const user = await b2bUserRepo.create({
        b2bCompanyId: command.b2bCompanyId,
        email: command.email,
        firstName: command.firstName,
        lastName: command.lastName,
        role: command.role,
        isActive: command.isActive,
      });

      return {
        success: true,
        user: {
          b2bUserId: user.b2bUserId,
          b2bCompanyId: user.b2bCompanyId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
