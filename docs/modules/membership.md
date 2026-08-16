# Membership Feature

## Overview

The Membership feature manages paid membership tiers with exclusive benefits. Unlike loyalty (points-based), membership provides subscription-based access to premium features, discounts, and perks.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-MEM-001 | List Membership Tiers | Merchant/Admin | List all membership tier configurations with pricing and billing periods |
| UC-MEM-002 | Get Membership Tier | Merchant/Admin | Retrieve a specific membership tier by ID |
| UC-MEM-003 | Create Membership Tier | Merchant/Admin | Create a membership tier with recurring pricing and optional trial period |
| UC-MEM-004 | Update Membership Tier | Merchant/Admin | Update an existing membership tier's pricing or configuration |
| UC-MEM-005 | Delete Membership Tier | Merchant/Admin | Permanently delete a membership tier |
| UC-MEM-006 | List Membership Benefits | Merchant/Admin | List all membership benefits |
| UC-MEM-007 | Get Membership Benefit | Merchant/Admin | Retrieve a specific membership benefit by ID |
| UC-MEM-008 | Create Membership Benefit | Merchant/Admin | Create a benefit (discount, free shipping, early access, exclusive products) and assign it to tiers |
| UC-MEM-009 | Update Membership Benefit | Merchant/Admin | Update an existing benefit's configuration or tier assignments |
| UC-MEM-010 | Delete Membership Benefit | Merchant/Admin | Permanently delete a membership benefit |
| UC-MEM-011 | List User Memberships | Merchant/Admin | List all user memberships with optional tier/status filtering |
| UC-MEM-012 | Get User Membership | Merchant/Admin | Retrieve a specific user membership by ID |
| UC-MEM-013 | Create User Membership | Merchant/Admin | Manually assign a membership tier to a user with start/end dates |
| UC-MEM-014 | Update User Membership | Merchant/Admin | Update a user's membership tier, end date, or status |
| UC-MEM-015 | Cancel User Membership | Merchant/Admin | Cancel a user's membership immediately or at period end |
| UC-MEM-016 | Get User Membership by User | Merchant/Admin | Retrieve a specific user's membership details |
| UC-MEM-017 | Get User Membership Benefits | Merchant/Admin | Retrieve the benefits available to a specific user through their membership |
| UC-MEM-018 | Get Membership Tiers | Customer/Guest | Retrieve available membership tiers for public display |
| UC-MEM-019 | Get Membership Tier Details | Customer/Guest | Retrieve details of a specific membership tier |
| UC-MEM-020 | Get Tier Benefits | Customer/Guest | Retrieve benefits associated with a specific tier |
| UC-MEM-021 | Get My Membership | Customer | Retrieve the authenticated customer's current membership |
| UC-MEM-022 | Get My Benefits | Customer | Retrieve the benefits available to the authenticated customer through their membership |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-MEM-001 | GET | `/business/membership/tiers` |
| UC-MEM-002 | GET | `/business/membership/tiers/:id` |
| UC-MEM-003 | POST | `/business/membership/tiers` |
| UC-MEM-004 | PUT | `/business/membership/tiers/:id` |
| UC-MEM-005 | DELETE | `/business/membership/tiers/:id` |
| UC-MEM-006 | GET | `/business/membership/benefits` |
| UC-MEM-007 | GET | `/business/membership/benefits/:id` |
| UC-MEM-008 | POST | `/business/membership/benefits` |
| UC-MEM-009 | PUT | `/business/membership/benefits/:id` |
| UC-MEM-010 | DELETE | `/business/membership/benefits/:id` |
| UC-MEM-011 | GET | `/business/membership/user-memberships` |
| UC-MEM-012 | GET | `/business/membership/user-memberships/:id` |
| UC-MEM-013 | POST | `/business/membership/user-memberships` |
| UC-MEM-014 | PUT | `/business/membership/user-memberships/:id` |
| UC-MEM-015 | POST | `/business/membership/user-memberships/:id/cancel` |
| UC-MEM-016 | GET | `/business/membership/users/:userId/membership` |
| UC-MEM-017 | GET | `/business/membership/users/:userId/benefits` |
| UC-MEM-018 | GET | `/membership/tiers` |
| UC-MEM-019 | GET | `/membership/tiers/:id` |
| UC-MEM-020 | GET | `/membership/tiers/:tierId/benefits` |
| UC-MEM-021 | GET | `/membership/user/:userId` |
| UC-MEM-022 | GET | `/membership/user/:userId/benefits` |

---

## Events Emitted

| Event                   | Trigger              | Payload                            |
| ----------------------- | -------------------- | ---------------------------------- |
| `membership.created`    | Membership started   | membershipId, userId, tierId       |
| `membership.renewed`    | Membership renewed   | membershipId                       |
| `membership.upgraded`   | Tier upgraded        | membershipId, oldTierId, newTierId |
| `membership.downgraded` | Tier downgraded      | membershipId, oldTierId, newTierId |
| `membership.cancelled`  | Membership cancelled | membershipId, reason               |
| `membership.expired`    | Membership expired   | membershipId                       |

---

## Integration Test Coverage

| Use Case                 | Test File                     | Status |
| ------------------------ | ----------------------------- | ------ |
| UC-MEM-001 to UC-MEM-005 | `membership/membership.test.ts` | ✅   |
| UC-MEM-006 to UC-MEM-010 | `membership/membership.test.ts` | ✅   |
| UC-MEM-011 to UC-MEM-017 | `membership/membership.test.ts` | ✅   |
| UC-MEM-018 to UC-MEM-022 | `membership/membership.test.ts` | ✅   |


<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| GET | `/business/membership/benefits` | `getMembershipBenefits` | Admin routes for membership benefit management |
| POST | `/business/membership/benefits` | `createMembershipBenefit` | — |
| GET | `/business/membership/benefits/:id` | `getMembershipBenefitById` | — |
| PUT | `/business/membership/benefits/:id` | `updateMembershipBenefit` | — |
| DELETE | `/business/membership/benefits/:id` | `deleteMembershipBenefit` | — |
| GET | `/business/membership/tiers` | `getMembershipTiers` | Admin routes for membership tier management |
| POST | `/business/membership/tiers` | `createMembershipTier` | — |
| GET | `/business/membership/tiers/:id` | `getMembershipTierById` | — |
| PUT | `/business/membership/tiers/:id` | `updateMembershipTier` | — |
| DELETE | `/business/membership/tiers/:id` | `deleteMembershipTier` | — |
| GET | `/business/membership/user-memberships` | `getUserMemberships` | Admin routes for user membership management |
| POST | `/business/membership/user-memberships` | `createUserMembership` | — |
| GET | `/business/membership/user-memberships/:id` | `getUserMembershipById` | — |
| PUT | `/business/membership/user-memberships/:id` | `updateUserMembership` | — |
| POST | `/business/membership/user-memberships/:id/cancel` | `cancelUserMembership` | — |
| GET | `/business/membership/users/:userId/benefits` | `getUserMembershipBenefits` | — |
| GET | `/business/membership/users/:userId/membership` | `getUserMembershipByUserId` | Admin routes for fetching user-specific membership data |
| GET | `/customer/membership/tiers` | `getMembershipTiers` | Get all active membership tiers |
| GET | `/customer/membership/tiers/:id` | `getMembershipTierById` | Get specific membership tier details |
| GET | `/customer/membership/tiers/:tierId/benefits` | `getTierBenefits` | Get benefits for a specific tier |
| GET | `/customer/membership/user/:userId` | `getUserMembershipByUserId` | Get current user's membership |
| GET | `/customer/membership/user/:userId/benefits` | `getUserMembershipBenefits` | Get current user's membership benefits |

<!-- GENERATED:ENDPOINTS:END -->
