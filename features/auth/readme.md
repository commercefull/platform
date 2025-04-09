# Authentication System

## Components

### Authentication Repository (`authRepo.ts`)
- Handles authentication credentials validation
- Password hashing and verification
- Password reset token generation and verification

### Authentication Controller (`authController.ts`)
- Login endpoints for customers and merchants
- Registration endpoints with password handling
- Password reset functionality
- JWT token generation

### Authentication Middleware (`authMiddleware.ts`)
- Token validation
- Role-based access control (customer, merchant, admin)
- Optional authentication support

### Public Router (`router.ts`)
- Customer login and registration
- Merchant login and registration
- Password reset functionality
- Profile access endpoints with proper authentication

### Admin Router (`routerAdmin.ts`)
- Admin authentication
- Merchant account management
- Protected admin routes

## Implementation Notes

We've successfully implemented the authentication functionality following the established architecture pattern of the platform. We've also addressed all TypeScript errors by:

1. Adding proper imports for crypto and JWT libraries
2. Handling password fields with custom interfaces and type assertions
3. Creating a custom AuthRequest interface to avoid conflicts with Express.Request types
4. Using consistent naming (authUser) throughout the codebase

These components allow customers and merchants to register, log in, manage their accounts, and reset their passwords while ensuring proper authentication and authorization throughout the application.