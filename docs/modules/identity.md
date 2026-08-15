# Identity Feature

The Identity feature unifies customer and merchant authentication under `features/identity`. It provides login, registration, token lifecycle, and password recovery flows across web and headless channels while enforcing business rules like merchant status checks and refresh token governance.

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-IDT-001 | Customer Login | Customer | Authenticate a customer with email/password and return an access token for the storefront session |
| UC-IDT-002 | Customer Register | Customer | Create a new active customer profile and return an access token for immediate checkout |
| UC-IDT-003 | Customer Token (Headless) | Customer | Issue access and refresh tokens for API-driven or mobile access with device metadata |
| UC-IDT-004 | Customer Token Refresh | Customer | Validate an unrevoked refresh token and return a fresh access token |
| UC-IDT-005 | Customer Token Validate | API Consumer | Confirm a customer access token's authenticity and return identity details |
| UC-IDT-006 | Customer Password Reset Request | Customer | Generate a password reset token and send instructions without revealing whether the email exists |
| UC-IDT-007 | Customer Password Reset | Customer | Verify a reset token and update the customer's stored password |
| UC-IDT-008 | Merchant Login | Merchant | Authenticate an active merchant with email/password and return an access token with identity and status |
| UC-IDT-009 | Merchant Register | Merchant | Create a merchant account in pending status requiring approval before access |
| UC-IDT-010 | Merchant Token (Headless) | Merchant | Issue access and refresh tokens for programmatic merchant access with device metadata |
| UC-IDT-011 | Merchant Token Refresh | Merchant | Verify a refresh token, confirm merchant is still active, and return a new access token |
| UC-IDT-012 | Merchant Password Reset Request | Merchant | Generate a password reset token and acknowledge the request without revealing merchant existence |
| UC-IDT-013 | Merchant Password Reset | Merchant | Verify a reset token and update the merchant's stored password |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-IDT-001 | POST | `/identity/customer/login` |
| UC-IDT-002 | POST | `/identity/customer/register` |
| UC-IDT-003 | POST | `/identity/customer/token` |
| UC-IDT-004 | POST | `/identity/customer/token/refresh` |
| UC-IDT-005 | POST | `/identity/customer/token/validate` |
| UC-IDT-006 | POST | `/identity/customer/password-reset/request` |
| UC-IDT-007 | POST | `/identity/customer/password-reset/reset` |
| UC-IDT-008 | POST | `/identity/merchant/login` |
| UC-IDT-009 | POST | `/identity/merchant/register` |
| UC-IDT-010 | POST | `/identity/merchant/token` |
| UC-IDT-011 | POST | `/identity/merchant/token/refresh` |
| UC-IDT-012 | POST | `/identity/merchant/password-reset/request` |
| UC-IDT-013 | POST | `/identity/merchant/password-reset/reset` |
