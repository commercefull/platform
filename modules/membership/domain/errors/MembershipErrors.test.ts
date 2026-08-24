import {
  MembershipNotFoundError, MembershipPlanNotFoundError, MembershipAlreadyActiveError,
  MembershipExpiredError, MembershipCannotBeDowngradedError, MembershipCannotBeUpgradedError,
  FailedToAssignMembershipError, FailedToRenewMembershipError, MembershipValidationError,
  FailedToCreateMembershipError, MembershipBenefitNotFoundError, MembershipBenefitAlreadyExistsError,
  MembershipPlanAlreadyExistsError, MembershipPlanBenefitAlreadyExistsError, UserMembershipNotFoundError,
} from './MembershipErrors';

describe('MembershipErrors', () => {
  it('MembershipNotFoundError', () => { expect(new MembershipNotFoundError('m1').statusCode).toBe(404); });
  it('MembershipPlanNotFoundError', () => { expect(new MembershipPlanNotFoundError('p1').statusCode).toBe(404); });
  it('MembershipAlreadyActiveError', () => { expect(new MembershipAlreadyActiveError('c1').statusCode).toBe(409); });
  it('MembershipExpiredError', () => { expect(new MembershipExpiredError('m1').statusCode).toBe(400); });
  it('MembershipCannotBeDowngradedError', () => { expect(new MembershipCannotBeDowngradedError('gold').statusCode).toBe(400); });
  it('MembershipCannotBeUpgradedError', () => { expect(new MembershipCannotBeUpgradedError('basic').statusCode).toBe(400); });
  it('FailedToAssignMembershipError', () => { expect(new FailedToAssignMembershipError().statusCode).toBe(500); });
  it('FailedToRenewMembershipError', () => { expect(new FailedToRenewMembershipError().statusCode).toBe(500); });
  it('MembershipValidationError', () => { expect(new MembershipValidationError('bad').statusCode).toBe(400); });
  it('FailedToCreateMembershipError', () => { expect(new FailedToCreateMembershipError().statusCode).toBe(500); });
  it('MembershipBenefitNotFoundError', () => { expect(new MembershipBenefitNotFoundError('b1').statusCode).toBe(404); });
  it('MembershipBenefitAlreadyExistsError', () => { expect(new MembershipBenefitAlreadyExistsError('code').statusCode).toBe(409); });
  it('MembershipPlanAlreadyExistsError', () => { expect(new MembershipPlanAlreadyExistsError('code').statusCode).toBe(409); });
  it('MembershipPlanBenefitAlreadyExistsError', () => { expect(new MembershipPlanBenefitAlreadyExistsError().statusCode).toBe(409); });
  it('UserMembershipNotFoundError', () => { expect(new UserMembershipNotFoundError('m1').statusCode).toBe(404); });
});
