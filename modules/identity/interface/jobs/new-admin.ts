/**
 * Job: Create New Admin User
 * Creates a new admin user with the specified email, name, password, and role
 *
 * Usage:
 * yarn job:new:admin --email=admin@example.com --pass=password123 --name="Admin User" --role=admin
 */

import { hashAString } from '../../../../libs/hash';
import AdminRepository from '../../infrastructure/repositories/AdminRepository';

async function run() {
  const args = process.argv.slice(2);

  // Parse command line arguments
  const emailArg = args.find(arg => arg.startsWith('--email='));
  const email = emailArg ? emailArg.split('=')[1] : null;

  const passArg = args.find(arg => arg.startsWith('--pass='));
  const password = passArg ? passArg.split('=')[1] : null;

  const nameArg = args.find(arg => arg.startsWith('--name='));
  const name = nameArg ? nameArg.split('=')[1] : null;

  const roleArg = args.find(arg => arg.startsWith('--role='));
  const role = roleArg ? roleArg.split('=')[1] : 'admin';

  // Validate required parameters
  if (!email || !password || !name) {
    console.error('❌ Missing required parameters:');
    console.error('   --email=<email> (required)');
    console.error('   --pass=<password> (required)');
    console.error('   --name=<full name> (required)');
    console.error('   --role=<role> (optional, defaults to "admin")');
    console.error('');
    console.error('Example:');
    console.error('   yarn job:new:admin --email=admin@example.com --pass=secure123 --name="Admin User" --role=super_admin');
    process.exit(1);
  }

  // Validate role
  const validRoles = ['super_admin', 'admin', 'support', 'operations'];
  if (!validRoles.includes(role)) {
    console.error(`❌ Invalid role "${role}". Valid roles: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  try {
    // Check if admin user already exists
    const existingAdmin = await AdminRepository.findByEmail(email);
    if (existingAdmin) {
      console.error(`❌ Admin user with email "${email}" already exists`);
      process.exit(1);
    }

    // Hash the password
    console.log('🔐 Hashing password...');
    const passwordHash = hashAString(password);

    // Set default permissions based on role
    let permissions: string[] = [];
    switch (role) {
      case 'super_admin':
        permissions = ['*']; // Full access
        break;
      case 'admin':
        permissions = [
          'users:read', 'users:write', 'users:delete',
          'orders:read', 'orders:write',
          'products:read', 'products:write',
          'analytics:read'
        ];
        break;
      case 'support':
        permissions = [
          'users:read',
          'orders:read', 'orders:write',
          'support:read', 'support:write'
        ];
        break;
      case 'operations':
        permissions = [
          'orders:read', 'orders:write',
          'inventory:read', 'inventory:write',
          'fulfillment:read', 'fulfillment:write'
        ];
        break;
    }

    // Create the admin user
    console.log(`👤 Creating admin user "${name}" with role "${role}"...`);
    const adminUser = await AdminRepository.create({
      email,
      name,
      passwordHash,
      role,
      permissions,
      status: 'active'
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   📧 Email: ${adminUser.email}`);
    console.log(`   👤 Name: ${adminUser.name}`);
    console.log(`   🛡️ Role: ${adminUser.role}`);
    console.log(`   🔑 Permissions: ${adminUser.permissions.join(', ')}`);
    console.log(`   📅 Created: ${adminUser.createdAt.toISOString()}`);
    console.log('');
    console.log('🔐 You can now log in with the provided email and password.');

  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    process.exit(1);
  }
}

run();
