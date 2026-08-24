import { AppError } from '../../../../libs/errors';

export class MembershipNotFoundError extends AppError {
  constructor(membershipId: string) {
    super(`Membership not found: ${membershipId}`, 404, { code: 'membership.not_found' });
  }
}

export class MembershipPlanNotFoundError extends AppError {
  constructor(planId: string) {
    super(`Membership plan not found: ${planId}`, 404, { code: 'membership.plan_not_found' });
  }
}

export class MembershipAlreadyActiveError extends AppError {
  constructor(customerId: string) {
    super(`Customer ${customerId} already has an active membership`, 409, { code: 'membership.already_active' });
  }
}

export class MembershipExpiredError extends AppError {
  constructor(membershipId: string) {
    super(`Membership ${membershipId} has expired`, 400, { code: 'membership.expired' });
  }
}

export class MembershipCannotBeDowngradedError extends AppError {
  constructor(currentTier: string) {
    super(`Cannot downgrade from tier ${currentTier} at this time`, 400, { code: 'membership.cannot_downgrade' });
  }
}

export class MembershipCannotBeUpgradedError extends AppError {
  constructor(currentTier: string) {
    super(`Cannot upgrade from tier ${currentTier} at this time`, 400, { code: 'membership.cannot_upgrade' });
  }
}

export class FailedToAssignMembershipError extends AppError {
  constructor() {
    super('Failed to assign membership', 500, { code: 'membership.assignment_failed' });
  }
}

export class FailedToRenewMembershipError extends AppError {
  constructor() {
    super('Failed to renew membership', 500, { code: 'membership.renewal_failed' });
  }
}

export class MembershipValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'membership.validation_error' });
  }
}

export class FailedToCreateMembershipError extends AppError {
  constructor(message: string = 'Failed to create membership entity') {
    super(message, 500, { code: 'membership.creation_failed' });
  }
}

export class MembershipBenefitNotFoundError extends AppError {
  constructor(benefitId: string) {
    super(`Membership benefit not found: ${benefitId}`, 404, { code: 'membership.benefit_not_found' });
  }
}

export class MembershipBenefitAlreadyExistsError extends AppError {
  constructor(code: string) {
    super(`Benefit with code '${code}' already exists`, 409, { code: 'membership.benefit_already_exists' });
  }
}

export class MembershipPlanAlreadyExistsError extends AppError {
  constructor(code: string) {
    super(`Plan with code '${code}' already exists`, 409, { code: 'membership.plan_already_exists' });
  }
}

export class MembershipPlanBenefitAlreadyExistsError extends AppError {
  constructor() {
    super('Benefit already assigned to this plan', 409, { code: 'membership.plan_benefit_already_exists' });
  }
}

export class UserMembershipNotFoundError extends AppError {
  constructor(membershipId: string) {
    super(`User membership not found: ${membershipId}`, 404, { code: 'membership.user_membership_not_found' });
  }
}
