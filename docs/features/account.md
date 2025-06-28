# Account Feature

The Account Feature is an essential component of the CommerceFull platform that manages user profiles and account information.

## Overview

This feature enables users to create and manage their profiles, providing a centralized way to store user information like name, contact details, and address data. It follows the platform's standardized naming convention to ensure consistency and maintainability.

## Key Components

### Data Models

- **Profile**: Core entity that stores user profile information (name, contact info, address)
- **Orders**: Reference structure for user order history (linked to the Order feature)

### Repository Layer

The repository layer (`repos/profile.ts`) provides data access methods following the platform's standardized naming convention:
- Database columns use `snake_case` (e.g., `user_id`, `first_name`, `last_name`)
- TypeScript interfaces use `camelCase` (e.g., `userId`, `firstName`, `lastName`)
- Field mapping dictionaries translate between naming conventions
- Transformation functions convert database records to TypeScript objects

### Controllers

- Account-related endpoints for profile management
- User authentication integration with the Auth feature
- User information retrieval and updates

### Routes

- **Profile Routes**: Create, read, update, and delete user profiles
- **Account Management Routes**: Integration with authentication and user settings
- **User Information Routes**: Personal information and preferences

## Naming Convention

This feature follows the platform's standardized naming convention:

1. **Database Columns**: Use `snake_case` (e.g., `profile_id`, `user_id`, `first_name`)
2. **TypeScript Interfaces**: Use `camelCase` (e.g., `profileId`, `userId`, `firstName`)
3. **Repository Methods**: Handle the translation between naming conventions using mapping dictionaries

Field mapping dictionaries in the repository define the mapping between database columns and TypeScript interface properties:

```typescript
const profileFields: Record<string, string> = {
  profileId: 'profile_id',
  userId: 'user_id',
  firstName: 'first_name',
  lastName: 'last_name',
  email: 'email',
  phone: 'phone',
  address: 'address',
  city: 'city',
  state: 'state',
  zip: 'zip',
  country: 'country',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};
```

Transformation functions convert between database records and TypeScript objects:

```typescript
function transformDbToTs<T>(dbRecord: any, fieldMap: Record<string, string>): T {
  if (!dbRecord) return null as any;
  
  const result: any = {};
  
  Object.entries(fieldMap).forEach(([tsKey, dbKey]) => {
    if (dbRecord[dbKey] !== undefined) {
      result[tsKey] = dbRecord[dbKey];
    }
  });
  
  return result as T;
}
```

## API Endpoints

### Profile Endpoints

- `POST /profiles`: Create a new user profile
- `GET /profiles/:profileId`: Get profile by ID
- `GET /profiles/user/:userId`: Get profile by user ID
- `PUT /profiles/:profileId`: Update a profile
- `DELETE /profiles/:profileId`: Delete a profile

### Account Management Endpoints

- `GET /user/profile`: Get authenticated user's profile
- `PUT /user/profile`: Update authenticated user's profile
- `GET /user/orders`: Get authenticated user's order history

## Database Schema

The account feature uses the following tables:

- `profile`: Stores user profile information (personal details, contact, address)

## Usage Examples

### Creating a Profile

```typescript
// Create a new user profile
const profile = await profileRepo.create({
  userId: 'user-123',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@example.com',
  phone: '555-123-4567',
  address: '123 Main St',
  city: 'Portland',
  state: 'OR',
  zip: '97201',
  country: 'US'
});
```

### Retrieving a Profile

```typescript
// Get profile by ID
const profile = await profileRepo.getByProfileId('profile-123');

// Get profile by user ID
const profile = await profileRepo.getByUserId('user-123');
```

### Updating a Profile

```typescript
// Update a user profile
const updatedProfile = await profileRepo.update({
  firstName: 'Jane',
  lastName: 'Smith', // Updated last name
  email: 'jane.smith@example.com', // Updated email
  phone: '555-123-4567',
  address: '456 Oak St', // Updated address
  city: 'Portland',
  state: 'OR',
  zip: '97201',
  country: 'US'
}, 'profile-123');
```

## Integration with Other Features

The account feature integrates with several other platform features:

- **Auth**: Provides authentication and authorization for account access
- **Order**: Connects user profiles to order history
- **Checkout**: Uses profile information for shipping and billing details
- **Basket**: Links user accounts to their shopping baskets

## Best Practices

1. Always validate user input before creating or updating profiles
2. Handle profile data securely, especially PII (Personally Identifiable Information)
3. Use the repository's transformation functions to handle database record conversion
4. Follow the naming convention pattern for all database interactions
5. Maintain proper error handling for profile operations

## Security Considerations

- Profile data contains personal information that must be protected
- Always verify user authentication before providing access to profile data
- Implement proper validation for all profile fields
- Use HTTPS for all API calls involving profile data
- Apply rate limiting to prevent abuse of profile endpoints
