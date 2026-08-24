import {
  LoyaltyTierNotFoundError, LoyaltyAccountNotFoundError, InsufficientPointsError,
  LoyaltyRewardNotFoundError, RewardNotAvailableError, RedemptionNotFoundError,
  PointsMustBePositiveError, LoyaltyTransactionNotFoundError, FailedToRedeemRewardError,
  FailedToAdjustPointsError, LoyaltyValidationError, LoyaltyProgramNotFoundError,
  LoyaltyMemberNotFoundError, FailedToCreateLoyaltyError, NoDefaultTierError, RewardNotActiveError,
} from './LoyaltyErrors';

describe('LoyaltyErrors', () => {
  it('LoyaltyTierNotFoundError', () => { expect(new LoyaltyTierNotFoundError('t1').statusCode).toBe(404); });
  it('LoyaltyAccountNotFoundError', () => { expect(new LoyaltyAccountNotFoundError('a1').statusCode).toBe(404); });
  it('InsufficientPointsError', () => { expect(new InsufficientPointsError(100, 50).statusCode).toBe(400); });
  it('LoyaltyRewardNotFoundError', () => { expect(new LoyaltyRewardNotFoundError('r1').statusCode).toBe(404); });
  it('RewardNotAvailableError', () => { expect(new RewardNotAvailableError('r1').statusCode).toBe(400); });
  it('RedemptionNotFoundError', () => { expect(new RedemptionNotFoundError('r1').statusCode).toBe(404); });
  it('PointsMustBePositiveError', () => { expect(new PointsMustBePositiveError().statusCode).toBe(400); });
  it('LoyaltyTransactionNotFoundError', () => { expect(new LoyaltyTransactionNotFoundError('t1').statusCode).toBe(404); });
  it('FailedToRedeemRewardError', () => { expect(new FailedToRedeemRewardError().statusCode).toBe(500); });
  it('FailedToAdjustPointsError', () => { expect(new FailedToAdjustPointsError().statusCode).toBe(500); });
  it('LoyaltyValidationError', () => { expect(new LoyaltyValidationError('bad').statusCode).toBe(400); });
  it('LoyaltyProgramNotFoundError', () => { expect(new LoyaltyProgramNotFoundError().statusCode).toBe(404); });
  it('LoyaltyMemberNotFoundError', () => { expect(new LoyaltyMemberNotFoundError('c1').statusCode).toBe(404); });
  it('FailedToCreateLoyaltyError', () => { expect(new FailedToCreateLoyaltyError().statusCode).toBe(500); });
  it('NoDefaultTierError', () => { expect(new NoDefaultTierError().statusCode).toBe(500); });
  it('RewardNotActiveError', () => { expect(new RewardNotActiveError('r1').statusCode).toBe(400); });
});
