# Identity & Access

Organization users, store assignments, customer authentication, SSO, and
SCIM provisioning. Business routes are under `/business`, customer routes
under `/customer`.

## Model

- **Organization users** — staff who access `/business` APIs and the admin
  portal; scoped to the organization, optionally assigned to specific stores.
- **Customers** — storefront shoppers; separate identity and token space.
- **Roles/permissions** — enforced by `libs/rbac` middleware and policy
  evaluation; every `/business` route requires `isOrganizationLoggedIn`
  except public auth endpoints.

## 1. Organization authentication

| Method | Path                             | Purpose                       |
| ------ | -------------------------------- | ----------------------------- |
| `POST` | `/business/auth/login`           | Organization user login       |
| `POST` | `/business/auth/register`        | Register organization + owner |
| `POST` | `/business/auth/token`           | Issue token pair              |
| `POST` | `/business/auth/refresh`         | Renew access token            |
| `POST` | `/business/auth/forgot-password` | Request reset                 |
| `POST` | `/business/auth/reset-password`  | Reset password                |
| `POST` | `/business/auth/revoke-tokens`   | Revoke a user's tokens        |
| `POST` | `/business/auth/force-reset`     | Force password reset          |

Bootstrap the first admin with `yarn job:new:admin`.

## 2. Store scoping

| Method   | Path                                           | Purpose                |
| -------- | ---------------------------------------------- | ---------------------- |
| `POST`   | `/business/auth/users/:userId/stores`          | Assign user to a store |
| `GET`    | `/business/auth/users/:userId/stores`          | List a user's stores   |
| `GET`    | `/business/auth/stores/:storeId/users`         | List users on a store  |
| `DELETE` | `/business/auth/users/:userId/stores/:storeId` | Remove assignment      |

Use store assignment to restrict regional staff to their store's orders,
catalog, and settings.

## 3. Customer authentication

Customer auth lives under `/customer/...` (login, register, token refresh,
social account linking via `identitySocialRouter`). Customer sessions are
independent of organization sessions — a customer token never grants
business access.

## 4. SSO & SCIM provisioning

- `ssoRouter` — enterprise SSO login flows for organization users.
- `scimRouter` — SCIM 2.0 provisioning: create/update/deactivate users from
  an external IdP (Okta, Entra ID…).

Both mount under the business surface; configure via environment (see
`docs/generated/configuration.md`).

## 5. Authorization model

- Authentication middleware: `isOrganizationLoggedIn` (business),
  `isCustomerLoggedIn` (customer), `isAdmin` (admin portal).
- Authorization: `libs/rbac` checks the user's role permissions per route;
  extend roles through admin user management rather than hardcoding checks.
- API consumers should use `/business/auth/token` + `Authorization: Bearer`
  headers; storefront uses the customer token cookie/header pair.
