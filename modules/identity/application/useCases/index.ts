/**
 * Identity Use Cases
 *
 * Barrel export for all identity-related use cases.
 */

// Customer authentication
export { LoginCustomerUseCase, LoginCustomerInput, LoginCustomerOutput } from './customer/LoginCustomer';
export { RegisterCustomerUseCase, RegisterCustomerInput, RegisterCustomerOutput } from './customer/RegisterCustomer';
export { LogoutCustomerUseCase, LogoutCustomerInput, LogoutCustomerOutput } from './customer/LogoutCustomer';
export {
  ResetCustomerPasswordUseCase,
  RequestPasswordResetInput,
  ResetPasswordInput,
  RequestPasswordResetOutput,
  ResetPasswordOutput,
} from './customer/ResetCustomerPassword';
export { VerifyCustomerEmailUseCase, VerifyEmailInput, ResendVerificationInput, VerifyEmailOutput, ResendVerificationOutput } from './customer/VerifyCustomerEmail';

// Merchant authentication
export { LoginOrganizationUseCase, LoginOrganizationInput, LoginOrganizationOutput } from './organization/LoginOrganization';
export { RegisterOrganizationUseCase, RegisterOrganizationInput, RegisterOrganizationOutput } from './organization/RegisterOrganization';

// Admin authentication
export * from './admin';

// Token management
export { RefreshTokenUseCase, RefreshTokenInput, RefreshTokenOutput } from './token/RefreshToken';
export { RevokeTokenUseCase, RevokeTokenInput, RevokeAllTokensInput, RevokeTokenOutput } from './token/RevokeToken';
