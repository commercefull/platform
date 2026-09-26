/**
 * Job: Create New Admin User
 * Creates a new admin user with the specified email, name, password, and role
 *
 * Usage:
 * yarn job:new:admin --email=admin@example.com --pass=password123 --name="Admin User" --role=admin
 */

import { hashAString } from '../../../../libs/hash';
import { provisionAdminUserUseCase } from '../../application/wired';

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

  try {
    // Hash the password
    console.log('🔐 Hashing password...');
    const passwordHash = hashAString(password);

    // Create the admin user (role validation, duplicate check, and default
    // permissions are handled by the use case)
    console.log(`👤 Creating admin user "${name}" with role "${role}"...`);
    const result = await provisionAdminUserUseCase.execute({
      email,
      name,
      passwordHash,
      role,
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   📧 Email: ${result.email}`);
    console.log(`   👤 Name: ${result.name}`);
    console.log(`   🛡️ Role: ${result.role}`);
    console.log(`   🔑 Permissions: ${result.permissions.join(', ')}`);
    console.log(`   📅 Created: ${result.createdAt.toISOString()}`);
    console.log('');
    console.log('🔐 You can now log in with the provided email and password.');
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    process.exit(1);
  }
}

run();
