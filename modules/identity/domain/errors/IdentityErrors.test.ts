import {
  InvalidCredentialsError, AccountLockedError, AccountNotActiveError, InvalidRefreshTokenError,
  EmailRequiredError, SocialAccountAlreadyLinkedError, SocialAccountNotLinkedError,
  CannotUnlinkOnlyLoginMethodError, EmailAndPasswordRequiredError, InvalidEmailFormatError,
  PasswordTooShortError, EmailAlreadyRegisteredError, TokenRequiredError, InvalidOrExpiredTokenError,
  TokenAlreadyUsedError, TokenExpiredError, VerificationTokenRequiredError, InvalidVerificationTokenError,
  VerificationTokenAlreadyUsedError, VerificationTokenExpiredError, EmailAlreadyVerifiedError,
  AdminFieldsRequiredError, OnlySuperAdminCanCreateError, EmailRequiredOnlyError,
  CustomerIdAndTokenRequiredError, OrganizationCodeRequiredError, OrganizationNotFoundError,
  OrganizationNotActiveError, OrganizationRegistrationFieldsRequiredError, UserNotFoundError,
  StoreNotFoundError, UserAlreadyAssignedToStoreError, UserStoreAssignmentNotFoundError,
  RefreshTokenRequiredError, RefreshTokenRevokedError, RefreshTokenExpiredError,
  InvalidTokenRecordError, TokenRequiredOnlyError, UserIdRequiredError, FailedToCreateSessionError,
  FailedToCreateRefreshTokenError, FailedToCreateBlacklistEntryError, FailedToCreateSocialAccountError,
} from './IdentityErrors';

describe('IdentityErrors', () => {
  it('InvalidCredentialsError', () => { expect(new InvalidCredentialsError().statusCode).toBe(401); });
  it('AccountLockedError', () => { expect(new AccountLockedError().statusCode).toBe(401); });
  it('AccountNotActiveError', () => { expect(new AccountNotActiveError().statusCode).toBe(403); });
  it('InvalidRefreshTokenError', () => { expect(new InvalidRefreshTokenError().statusCode).toBe(401); });
  it('EmailRequiredError', () => { expect(new EmailRequiredError().statusCode).toBe(400); });
  it('SocialAccountAlreadyLinkedError', () => { expect(new SocialAccountAlreadyLinkedError('google').statusCode).toBe(409); });
  it('SocialAccountNotLinkedError', () => { expect(new SocialAccountNotLinkedError('google').statusCode).toBe(404); });
  it('CannotUnlinkOnlyLoginMethodError', () => { expect(new CannotUnlinkOnlyLoginMethodError().statusCode).toBe(400); });
  it('EmailAndPasswordRequiredError', () => { expect(new EmailAndPasswordRequiredError().statusCode).toBe(400); });
  it('InvalidEmailFormatError', () => { expect(new InvalidEmailFormatError().statusCode).toBe(400); });
  it('PasswordTooShortError', () => { expect(new PasswordTooShortError().statusCode).toBe(400); });
  it('EmailAlreadyRegisteredError', () => { expect(new EmailAlreadyRegisteredError().statusCode).toBe(409); });
  it('TokenRequiredError', () => { expect(new TokenRequiredError().statusCode).toBe(400); });
  it('InvalidOrExpiredTokenError', () => { expect(new InvalidOrExpiredTokenError().statusCode).toBe(400); });
  it('TokenAlreadyUsedError', () => { expect(new TokenAlreadyUsedError().statusCode).toBe(400); });
  it('TokenExpiredError', () => { expect(new TokenExpiredError().statusCode).toBe(400); });
  it('VerificationTokenRequiredError', () => { expect(new VerificationTokenRequiredError().statusCode).toBe(400); });
  it('InvalidVerificationTokenError', () => { expect(new InvalidVerificationTokenError().statusCode).toBe(400); });
  it('VerificationTokenAlreadyUsedError', () => { expect(new VerificationTokenAlreadyUsedError().statusCode).toBe(400); });
  it('VerificationTokenExpiredError', () => { expect(new VerificationTokenExpiredError().statusCode).toBe(400); });
  it('EmailAlreadyVerifiedError', () => { expect(new EmailAlreadyVerifiedError().statusCode).toBe(400); });
  it('AdminFieldsRequiredError', () => { expect(new AdminFieldsRequiredError().statusCode).toBe(400); });
  it('OnlySuperAdminCanCreateError', () => { expect(new OnlySuperAdminCanCreateError().statusCode).toBe(403); });
  it('EmailRequiredOnlyError', () => { expect(new EmailRequiredOnlyError().statusCode).toBe(400); });
  it('CustomerIdAndTokenRequiredError', () => { expect(new CustomerIdAndTokenRequiredError().statusCode).toBe(400); });
  it('OrganizationCodeRequiredError', () => { expect(new OrganizationCodeRequiredError().statusCode).toBe(400); });
  it('OrganizationNotFoundError', () => { expect(new OrganizationNotFoundError().statusCode).toBe(404); });
  it('OrganizationNotActiveError', () => { expect(new OrganizationNotActiveError().statusCode).toBe(403); });
  it('OrganizationRegistrationFieldsRequiredError', () => { expect(new OrganizationRegistrationFieldsRequiredError().statusCode).toBe(400); });
  it('UserNotFoundError', () => { expect(new UserNotFoundError().statusCode).toBe(404); });
  it('StoreNotFoundError', () => { expect(new StoreNotFoundError().statusCode).toBe(404); });
  it('UserAlreadyAssignedToStoreError', () => { expect(new UserAlreadyAssignedToStoreError().statusCode).toBe(409); });
  it('UserStoreAssignmentNotFoundError', () => { expect(new UserStoreAssignmentNotFoundError().statusCode).toBe(404); });
  it('RefreshTokenRequiredError', () => { expect(new RefreshTokenRequiredError().statusCode).toBe(400); });
  it('RefreshTokenRevokedError', () => { expect(new RefreshTokenRevokedError().statusCode).toBe(401); });
  it('RefreshTokenExpiredError', () => { expect(new RefreshTokenExpiredError().statusCode).toBe(401); });
  it('InvalidTokenRecordError', () => { expect(new InvalidTokenRecordError().statusCode).toBe(400); });
  it('TokenRequiredOnlyError', () => { expect(new TokenRequiredOnlyError().statusCode).toBe(400); });
  it('UserIdRequiredError', () => { expect(new UserIdRequiredError().statusCode).toBe(400); });
  it('FailedToCreateSessionError', () => { expect(new FailedToCreateSessionError().statusCode).toBe(500); });
  it('FailedToCreateRefreshTokenError', () => { expect(new FailedToCreateRefreshTokenError().statusCode).toBe(500); });
  it('FailedToCreateBlacklistEntryError', () => { expect(new FailedToCreateBlacklistEntryError().statusCode).toBe(500); });
  it('FailedToCreateSocialAccountError', () => { expect(new FailedToCreateSocialAccountError().statusCode).toBe(500); });
});
