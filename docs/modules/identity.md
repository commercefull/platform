# Identity Feature

The Identity feature unifies customer and merchant authentication under `features/identity`. It provides login, registration, token lifecycle, and password recovery flows across web and headless channels while enforcing business rules like merchant status checks and refresh token governance.

## Business Scenarios (Given/When/Then)

### Scenario: Customer signs in to the storefront

- **Given** an existing customer provides a valid email and password
- **When** the client calls `POST /identity/customer/login`
- **Then** the platform verifies the credentials, updates the customer’s last login timestamp, and returns an access token for the storefront session

### Scenario: Customer self-registers

- **Given** a shopper submits unique contact details and a password
- **When** the client calls `POST /identity/customer/register`
- **Then** the platform creates an active customer profile and immediately returns an access token so the customer can continue checkout without disruption

### Scenario: Customer obtains headless access

- **Given** a customer needs API-driven or mobile access
- **When** they call `POST /identity/customer/token` with valid credentials
- **Then** the platform issues both access and refresh tokens and records the refresh token in `identityRefreshTokens` with device metadata

### Scenario: Customer renews an expired access token

- **Given** a customer holds an unrevoked refresh token on record
- **When** they call `POST /identity/customer/token/refresh`
- **Then** the platform validates the token signature and database entry, marks the refresh token as used, and returns a fresh access token

### Scenario: Customer validates an access token

- **Given** an API consumer needs to confirm a customer token
- **When** it calls `POST /identity/customer/token/validate`
- **Then** the platform confirms the token’s authenticity and role, returning the customer identity details when the token is valid

### Scenario: Customer resets a forgotten password

- **Given** a customer requests help accessing their account
- **When** they call `POST /identity/customer/password-reset/request` with their email
- **Then** the platform generates a reset token and signals that instructions were sent without leaking whether the email exists
- **And** when the customer later calls `POST /identity/customer/password-reset/reset` with the token and a new password, the platform verifies the token and updates the stored credentials

### Scenario: Merchant authenticates an active storefront account

- **Given** a merchant with an active status provides valid credentials
- **When** the client calls `POST /identity/merchant/login`
- **Then** the platform validates the login, ensures the merchant account is active, and returns an access token containing the merchant’s identity and status

### Scenario: Merchant applies for access

- **Given** a prospective merchant supplies business details with a unique email
- **When** they call `POST /identity/merchant/register`
- **Then** the platform creates a merchant account in `pending` status and confirms that approval is required before access is granted

### Scenario: Merchant obtains headless access

- **Given** an active merchant requests programmatic access
- **When** they call `POST /identity/merchant/token` with valid credentials
- **Then** the platform issues access and refresh tokens and stores the refresh token in `identityRefreshTokens` with user agent and IP metadata

### Scenario: Merchant renews access securely

- **Given** an active merchant holds a valid refresh token entry
- **When** they call `POST /identity/merchant/token/refresh`
- **Then** the platform verifies the token, confirms the merchant remains active, records the usage, and returns a new access token

### Scenario: Merchant resets a forgotten password

- **Given** a merchant cannot access their dashboard
- **When** they call `POST /identity/merchant/password-reset/request` with their email
- **Then** the platform issues a reset token and acknowledges the request without revealing merchant existence
- **And** when the merchant calls `POST /identity/merchant/password-reset/reset` with the token and new password, the platform validates the token and updates the stored password

