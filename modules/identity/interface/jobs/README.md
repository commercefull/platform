# Admin User Creation Job

This job allows you to create new admin users for the platform.

## Usage

```bash
# Create a super admin (full access)
yarn job:new:admin --email=admin@example.com --pass=secure123 --name="Super Admin" --role=super_admin

# Create a regular admin
yarn job:new:admin --email=admin@example.com --pass=secure123 --name="Admin User" --role=admin

# Create a support user
yarn job:new:admin --email=support@example.com --pass=secure123 --name="Support User" --role=support

# Create an operations user
yarn job:new:admin --email=ops@example.com --pass=secure123 --name="Operations User" --role=operations
```

## Parameters

- `--email=<email>` (required): Email address for the admin user
- `--pass=<password>` (required): Plain text password (will be hashed)
- `--name=<full name>` (required): Full name of the admin user
- `--role=<role>` (optional): Role for the user. Defaults to `admin`. Valid options:
  - `super_admin`: Full access to everything
  - `admin`: Administrative access to users, orders, products, analytics
  - `support`: Access to users, orders, support tickets
  - `operations`: Access to orders, inventory, fulfillment

## Default Permissions by Role

### super_admin
- `*` (full access)

### admin
- `users:read`, `users:write`, `users:delete`
- `orders:read`, `orders:write`
- `products:read`, `products:write`
- `analytics:read`

### support
- `users:read`
- `orders:read`, `orders:write`
- `support:read`, `support:write`

### operations
- `orders:read`, `orders:write`
- `inventory:read`, `inventory:write`
- `fulfillment:read`, `fulfillment:write`

## Security Notes

- Passwords are automatically hashed using bcrypt
- Admin users are created with `active` status by default
- Duplicate email addresses are not allowed
- The job validates role names and required parameters
