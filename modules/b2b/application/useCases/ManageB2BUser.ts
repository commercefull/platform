import { B2BUser, B2BUserRole, SpendingLimit } from '../../domain/entities/B2BUser';
import { CompanyRepository, B2BUserRepository } from '../../domain/repositories/B2BRepository';
import {
  CompanyNotFoundError, B2BUserNotFoundError, B2BUserAlreadyExistsError,
  B2BUserStatusError, SpendingLimitExceededError,
} from '../../domain/errors/B2BErrors';
import { eventBus } from '../../../../libs/events/eventBus';

export class ManageB2BUserUseCase {
  constructor(
    private userRepo: B2BUserRepository,
    private companyRepo: CompanyRepository,
  ) {}

  async invite(input: {
    companyId: string;
    organizationId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: B2BUserRole;
    spendingLimits?: SpendingLimit;
    department?: string;
    costCenter?: string;
  }): Promise<B2BUser> {
    const company = await this.companyRepo.findById(input.companyId);
    if (!company) throw new CompanyNotFoundError(input.companyId);

    const existing = await this.userRepo.findByEmail(input.email, input.companyId);
    if (existing) throw new B2BUserAlreadyExistsError(input.email);

    const user = B2BUser.create(input);
    await this.userRepo.save(user);
    await eventBus.emit('company.user.invited', { userId: user.userId, companyId: user.companyId, email: user.email });
    return user;
  }

  async get(userId: string): Promise<B2BUser> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new B2BUserNotFoundError(userId);
    return user;
  }

  async listByCompany(companyId: string): Promise<B2BUser[]> {
    return this.userRepo.findByCompanyId(companyId);
  }

  async listByOrganization(organizationId: string): Promise<B2BUser[]> {
    return this.userRepo.findByOrganizationId(organizationId);
  }

  async activate(userId: string): Promise<B2BUser> {
    const user = await this.get(userId);
    user.activate();
    await this.userRepo.save(user);
    await eventBus.emit('b2b_user.activated', { userId: user.userId, companyId: user.companyId });
    return user;
  }

  async suspend(userId: string): Promise<B2BUser> {
    const user = await this.get(userId);
    user.suspend();
    await this.userRepo.save(user);
    return user;
  }

  async reactivate(userId: string): Promise<B2BUser> {
    const user = await this.get(userId);
    user.reactivate();
    await this.userRepo.save(user);
    return user;
  }

  async remove(userId: string): Promise<B2BUser> {
    const user = await this.get(userId);
    user.remove();
    await this.userRepo.save(user);
    return user;
  }

  async setRole(userId: string, role: B2BUserRole): Promise<B2BUser> {
    const user = await this.get(userId);
    user.setRole(role);
    await this.userRepo.save(user);
    return user;
  }

  async setSpendingLimits(userId: string, limits: SpendingLimit): Promise<B2BUser> {
    const user = await this.get(userId);
    user.setSpendingLimits(limits);
    await this.userRepo.save(user);
    return user;
  }

  async updateProfile(
    userId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      department?: string;
      costCenter?: string;
    },
  ): Promise<B2BUser> {
    const user = await this.get(userId);
    user.updateProfile(updates);
    await this.userRepo.save(user);
    return user;
  }

  async recordLogin(userId: string): Promise<void> {
    const user = await this.get(userId);
    user.recordLogin();
    await this.userRepo.save(user);
  }

  async checkSpendingLimit(userId: string, amount: number, periodSpent: number, period: keyof SpendingLimit): Promise<boolean> {
    const user = await this.get(userId);
    if (!user.isActive) throw new B2BUserStatusError(userId, 'place order', user.status);
    const limit = user.spendingLimits[period];
    if (limit !== undefined && periodSpent + amount > limit) {
      throw new SpendingLimitExceededError(userId, amount, limit);
    }
    return true;
  }
}

