import { AppError } from '../../../../libs/errors';

export class LoyaltyTierNotFoundError extends AppError {
  constructor(tierId: string) {
    super(`Loyalty tier not found: ${tierId}`, 404, { code: 'loyalty.tier_not_found' });
  }
}

export class LoyaltyAccountNotFoundError extends AppError {
  constructor(accountId: string) {
    super(`Loyalty account not found: ${accountId}`, 404, { code: 'loyalty.account_not_found' });
  }
}

export class InsufficientPointsError extends AppError {
  constructor(required: number, available: number) {
    super(`Insufficient points: required ${required}, available ${available}`, 400, { code: 'loyalty.insufficient_points' });
  }
}

export class LoyaltyRewardNotFoundError extends AppError {
  constructor(rewardId: string) {
    super(`Loyalty reward not found: ${rewardId}`, 404, { code: 'loyalty.reward_not_found' });
  }
}

export class RewardNotAvailableError extends AppError {
  constructor(rewardId: string) {
    super(`Reward ${rewardId} is not available`, 400, { code: 'loyalty.reward_not_available' });
  }
}

export class RedemptionNotFoundError extends AppError {
  constructor(redemptionId: string) {
    super(`Redemption not found: ${redemptionId}`, 404, { code: 'loyalty.redemption_not_found' });
  }
}

export class PointsMustBePositiveError extends AppError {
  constructor() {
    super('Points must be greater than zero', 400, { code: 'loyalty.points_must_be_positive' });
  }
}

export class LoyaltyTransactionNotFoundError extends AppError {
  constructor(transactionId: string) {
    super(`Loyalty transaction not found: ${transactionId}`, 404, { code: 'loyalty.transaction_not_found' });
  }
}

export class FailedToRedeemRewardError extends AppError {
  constructor() {
    super('Failed to redeem reward', 500, { code: 'loyalty.redemption_failed' });
  }
}

export class FailedToAdjustPointsError extends AppError {
  constructor() {
    super('Failed to adjust loyalty points', 500, { code: 'loyalty.points_adjustment_failed' });
  }
}

export class LoyaltyValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, { code: 'loyalty.validation_error' });
  }
}

export class LoyaltyProgramNotFoundError extends AppError {
  constructor() {
    super('Loyalty program not found', 404, { code: 'loyalty.program_not_found' });
  }
}

export class LoyaltyMemberNotFoundError extends AppError {
  constructor(customerId: string) {
    super(`Loyalty member not found for customer: ${customerId}`, 404, { code: 'loyalty.member_not_found' });
  }
}

export class FailedToCreateLoyaltyError extends AppError {
  constructor(message: string = 'Failed to create loyalty entity') {
    super(message, 500, { code: 'loyalty.creation_failed' });
  }
}

export class NoDefaultTierError extends AppError {
  constructor() {
    super('No default loyalty tier found', 500, { code: 'loyalty.no_default_tier' });
  }
}

export class RewardNotActiveError extends AppError {
  constructor(rewardId: string) {
    super(`Reward ${rewardId} is not active`, 400, { code: 'loyalty.reward_not_active' });
  }
}
