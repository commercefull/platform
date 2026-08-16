/**
 * User Repository Interface (Identity)
 */

import { PaginatedResult, PaginationOptions } from 'libs/types/shared';
import { User, UserType, UserStatus } from '../entities/User';

export interface UserFilters {
  userType?: UserType;
  status?: UserStatus;
  emailVerified?: boolean;
  search?: string;
}

export interface UserRepository {
  findById(userId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByRefreshToken(token: string): Promise<User | null>;
  findAll(filters?: UserFilters, pagination?: PaginationOptions): Promise<PaginatedResult<User>>;
  save(user: User): Promise<User>;
  delete(userId: string): Promise<void>;
  count(filters?: UserFilters): Promise<number>;

  // Authentication
  validateCredentials(email: string, password: string): Promise<User | null>;
  updateLastLogin(userId: string, ip?: string): Promise<void>;

  // Token management
  createPasswordResetToken(userId: string): Promise<string>;
  validatePasswordResetToken(token: string): Promise<User | null>;
  createEmailVerificationToken(userId: string): Promise<string>;
  validateEmailVerificationToken(token: string): Promise<User | null>;
}
